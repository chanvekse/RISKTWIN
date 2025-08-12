/**
 * =============================================================================
 * SECURITY MIDDLEWARE
 * =============================================================================
 * 
 * Comprehensive security middleware for production-ready applications
 * Includes security headers, CORS, rate limiting, and attack prevention
 */

class SecurityMiddleware {
  
  // Security headers middleware
  static securityHeaders(req, res, next) {
    // Prevent XSS attacks
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self'"
    );
    
    // Prevent clickjacking
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Remove server identification
    res.removeHeader('X-Powered-By');
    
    next();
  }

  // CORS configuration
  static corsOptions(req, res, next) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://risktwin.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    const origin = req.headers.origin;
    
    if (!origin || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  }

  // Request size limiter
  static requestSizeLimiter(maxSize = '10mb') {
    return (req, res, next) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      const maxBytes = this.parseSize(maxSize);
      
      if (contentLength > maxBytes) {
        return res.status(413).json({
          error: 'Request entity too large',
          maxSize: maxSize,
          code: 'REQUEST_TOO_LARGE'
        });
      }
      
      next();
    };
  }

  // Request timeout middleware
  static requestTimeout(timeoutMs = 30000) {
    return (req, res, next) => {
      req.setTimeout(timeoutMs, () => {
        if (!res.headersSent) {
          res.status(408).json({
            error: 'Request timeout',
            timeout: `${timeoutMs}ms`,
            code: 'REQUEST_TIMEOUT'
          });
        }
      });
      
      next();
    };
  }

  // Basic authentication middleware
  static basicAuth(username, password) {
    return (req, res, next) => {
      const auth = req.headers.authorization;
      
      if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="RiskTwin API"');
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
      const [user, pass] = credentials;
      
      if (user !== username || pass !== password) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }
      
      next();
    };
  }

  // IP whitelist middleware
  static ipWhitelist(allowedIPs = []) {
    return (req, res, next) => {
      if (allowedIPs.length === 0) {
        return next(); // No restrictions if no IPs specified
      }
      
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const normalizedIP = clientIP.replace(/^::ffff:/, ''); // Handle IPv4-mapped IPv6
      
      if (!allowedIPs.includes(normalizedIP) && !allowedIPs.includes('*')) {
        return res.status(403).json({
          error: 'Access denied from this IP address',
          code: 'IP_BLOCKED'
        });
      }
      
      next();
    };
  }

  // Input sanitization middleware
  static sanitizeInputs(req, res, next) {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = SecurityMiddleware.sanitizeString(req.query[key]);
        }
      });
    }
    
    // Sanitize body parameters (selective sanitization to avoid breaking JSON structures)
    if (req.body && typeof req.body === 'object') {
      this.sanitizeObject(req.body);
    }
    
    next();
  }

  // SQL injection prevention
  static sqlInjectionPrevention(req, res, next) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(;|\-\-|\/\*|\*\/)/g,
      /(\b(OR|AND)\b.*=.*)/gi
    ];
    
    const checkValue = (value) => {
      if (typeof value === 'string') {
        return sqlPatterns.some(pattern => pattern.test(value));
      }
      return false;
    };
    
    const hasSqlInjection = (obj) => {
      for (const key in obj) {
        if (checkValue(obj[key])) return true;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (hasSqlInjection(obj[key])) return true;
        }
      }
      return false;
    };
    
    // Check query parameters
    if (req.query && hasSqlInjection(req.query)) {
      return res.status(400).json({
        error: 'Potentially malicious input detected',
        code: 'MALICIOUS_INPUT'
      });
    }
    
    // Check body parameters
    if (req.body && hasSqlInjection(req.body)) {
      return res.status(400).json({
        error: 'Potentially malicious input detected',
        code: 'MALICIOUS_INPUT'
      });
    }
    
    next();
  }

  // Health check bypass for monitoring
  static healthCheckBypass(req, res, next) {
    if (req.url === '/health' || req.url === '/health-check' || req.url === '/status') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    }
    next();
  }

  // Utility methods
  static parseSize(size) {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
    
    if (!match) return parseInt(size) || 0;
    
    const [, amount, unit] = match;
    return Math.floor(parseFloat(amount) * (units[unit] || 1));
  }
  
  static sanitizeString(str) {
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  static sanitizeObject(obj) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = SecurityMiddleware.sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        SecurityMiddleware.sanitizeObject(obj[key]);
      }
    });
  }

  // Create a complete security middleware stack
  static createSecurityStack(options = {}) {
    const middleware = [];
    
    // Always include basic security headers
    middleware.push(this.securityHeaders);
    
    // Add health check bypass
    middleware.push(this.healthCheckBypass);
    
    // Add CORS if enabled
    if (options.cors !== false) {
      middleware.push(this.corsOptions);
    }
    
    // Add request timeout
    if (options.timeout !== false) {
      middleware.push(this.requestTimeout(options.timeout || 30000));
    }
    
    // Add request size limiting
    if (options.maxSize) {
      middleware.push(this.requestSizeLimiter(options.maxSize));
    }
    
    // Add IP whitelist if specified
    if (options.allowedIPs && options.allowedIPs.length > 0) {
      middleware.push(this.ipWhitelist(options.allowedIPs));
    }
    
    // Add input sanitization
    if (options.sanitize !== false) {
      middleware.push(this.sanitizeInputs);
    }
    
    // Add SQL injection prevention
    if (options.sqlProtection !== false) {
      middleware.push(this.sqlInjectionPrevention);
    }
    
    return middleware;
  }
}

module.exports = SecurityMiddleware; 