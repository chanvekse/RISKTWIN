/**
 * =============================================================================
 * INPUT VALIDATION MIDDLEWARE
 * =============================================================================
 * 
 * Comprehensive validation and sanitization for API endpoints
 * Prevents SQL injection, XSS, and invalid data attacks
 */

const validator = require('validator');

class ValidationMiddleware {
  // Validate customer ID parameter
  static validateCustomerId(req, res, next) {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Customer ID is required',
        code: 'MISSING_CUSTOMER_ID'
      });
    }

    const customerId = parseInt(id);
    if (isNaN(customerId) || customerId <= 0) {
      return res.status(400).json({ 
        error: 'Invalid customer ID format. Must be a positive integer.',
        code: 'INVALID_CUSTOMER_ID'
      });
    }

    req.validatedCustomerId = customerId;
    next();
  }

  // Validate high-risk query parameters
  static validateHighRiskParams(req, res, next) {
    const { threshold, limit } = req.query;

    // Validate threshold
    if (threshold !== undefined) {
      const thresholdNum = parseFloat(threshold);
      if (isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
        return res.status(400).json({ 
          error: 'Threshold must be a number between 0 and 100',
          code: 'INVALID_THRESHOLD'
        });
      }
      req.validatedThreshold = thresholdNum;
    }

    // Validate limit
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ 
          error: 'Limit must be a number between 1 and 100',
          code: 'INVALID_LIMIT'
        });
      }
      req.validatedLimit = limitNum;
    }

    next();
  }

  // Validate scenario data
  static validateScenarioData(req, res, next) {
    const { customer_id, name, change_json } = req.body;

    // Validate customer_id
    if (!customer_id) {
      return res.status(400).json({ 
        error: 'customer_id is required',
        code: 'MISSING_CUSTOMER_ID'
      });
    }

    const customerIdNum = parseInt(customer_id);
    if (isNaN(customerIdNum) || customerIdNum <= 0) {
      return res.status(400).json({ 
        error: 'customer_id must be a positive integer',
        code: 'INVALID_CUSTOMER_ID'
      });
    }

    // Validate scenario name
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ 
        error: 'Scenario name is required and must be a string',
        code: 'INVALID_SCENARIO_NAME'
      });
    }

    if (name.length > 255) {
      return res.status(400).json({ 
        error: 'Scenario name must be less than 255 characters',
        code: 'SCENARIO_NAME_TOO_LONG'
      });
    }

    // Sanitize scenario name
    const sanitizedName = validator.escape(name.trim());

    // Validate change_json
    if (!change_json || typeof change_json !== 'object') {
      return res.status(400).json({ 
        error: 'change_json is required and must be an object',
        code: 'INVALID_CHANGE_JSON'
      });
    }

    // Validate specific scenario changes
    if (change_json.move_state && !ValidationMiddleware.validateStateCode(change_json.move_state)) {
      return res.status(400).json({ 
        error: 'Invalid state code format',
        code: 'INVALID_STATE_CODE'
      });
    }

    if (change_json.increase_deductible !== undefined) {
      const deductible = parseFloat(change_json.increase_deductible);
      if (isNaN(deductible) || deductible < 0 || deductible > 10000) {
        return res.status(400).json({ 
          error: 'Deductible increase must be between 0 and 10000',
          code: 'INVALID_DEDUCTIBLE'
        });
      }
    }

    req.validatedScenario = {
      customer_id: customerIdNum,
      name: sanitizedName,
      change_json
    };

    next();
  }

  // Validate cohort analysis parameters
  static validateCohortParams(req, res, next) {
    const { type, timeFrame } = req.query;

    // Validate analysis type
    const validTypes = ['risk_based', 'geographic', 'policy_vintage', 'claim_behavior'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid analysis type. Must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_ANALYSIS_TYPE'
      });
    }

    // Validate time frame
    const validTimeFrames = ['30d', '90d', '180d', '1y'];
    if (timeFrame && !validTimeFrames.includes(timeFrame)) {
      return res.status(400).json({ 
        error: `Invalid time frame. Must be one of: ${validTimeFrames.join(', ')}`,
        code: 'INVALID_TIME_FRAME'
      });
    }

    req.validatedCohortParams = {
      type: type || 'risk_based',
      timeFrame: timeFrame || '90d'
    };

    next();
  }

  // Validate state code format
  static validateStateCode(stateCode) {
    return /^[A-Z]{2}$/.test(stateCode);
  }

  // Sanitize string inputs to prevent XSS
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return validator.escape(str.trim());
  }

  // General request sanitization
  static sanitizeRequest(req, res, next) {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = this.sanitizeString(req.query[key]);
        }
      });
    }

    // Sanitize body parameters (selective)
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string' && key !== 'change_json') {
          req.body[key] = this.sanitizeString(req.body[key]);
        }
      });
    }

    next();
  }

  // Rate limiting validation
  static createRateLimitHandler(windowMs = 900000, max = 100) {
    const requests = new Map();

    return (req, res, next) => {
      const clientId = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      requests.forEach((timestamps, ip) => {
        const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
        if (validTimestamps.length === 0) {
          requests.delete(ip);
        } else {
          requests.set(ip, validTimestamps);
        }
      });

      // Check current client
      const clientRequests = requests.get(clientId) || [];
      const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart);

      if (recentRequests.length >= max) {
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add current request
      recentRequests.push(now);
      requests.set(clientId, recentRequests);

      next();
    };
  }

  // Error handler for validation errors
  static handleValidationError(error, req, res, next) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    next(error);
  }
}

module.exports = ValidationMiddleware; 