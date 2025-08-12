/**
 * =============================================================================
 * STRUCTURED LOGGING SYSTEM
 * =============================================================================
 * 
 * Professional logging with structured data, error tracking, and performance monitoring
 * Supports different log levels and output formats for development and production
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || 'info',
      enableConsole: config.enableConsole !== false,
      enableFile: config.enableFile || false,
      logFile: config.logFile || 'logs/risktwin.log',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      enableTimestamp: config.enableTimestamp !== false,
      enableColors: config.enableColors !== false && process.stdout.isTTY,
      service: config.service || 'risktwin-api'
    };

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.colors = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[36m',    // Cyan
      debug: '\x1b[35m',   // Magenta
      trace: '\x1b[37m',   // White
      reset: '\x1b[0m'
    };

    this.requestId = null;
    this.startTime = process.hrtime();

    // Ensure log directory exists
    if (this.config.enableFile) {
      this.ensureLogDirectory();
    }
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.config.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  setRequestId(id) {
    this.requestId = id;
  }

  generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.config.level];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.config.service,
      pid,
      message,
      ...meta
    };

    if (this.requestId) {
      logEntry.requestId = this.requestId;
    }

    return logEntry;
  }

  formatConsoleOutput(logEntry) {
    const { timestamp, level, message, requestId, ...meta } = logEntry;
    const color = this.config.enableColors ? this.colors[level.toLowerCase()] : '';
    const reset = this.config.enableColors ? this.colors.reset : '';
    
    let output = `${color}[${timestamp}] ${level}${reset}: ${message}`;
    
    if (requestId) {
      output += ` [${requestId}]`;
    }

    if (Object.keys(meta).length > 0) {
      output += ` ${JSON.stringify(meta)}`;
    }

    return output;
  }

  writeToFile(logEntry) {
    if (!this.config.enableFile) return;

    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Check file size and rotate if necessary
      if (fs.existsSync(this.config.logFile)) {
        const stats = fs.statSync(this.config.logFile);
        if (stats.size > this.config.maxFileSize) {
          this.rotateLogFile();
        }
      }

      fs.appendFileSync(this.config.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  rotateLogFile() {
    try {
      for (let i = this.config.maxFiles - 1; i >= 1; i--) {
        const oldFile = `${this.config.logFile}.${i}`;
        const newFile = `${this.config.logFile}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          if (i === this.config.maxFiles - 1) {
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      if (fs.existsSync(this.config.logFile)) {
        fs.renameSync(this.config.logFile, `${this.config.logFile}.1`);
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, meta);

    // Console output
    if (this.config.enableConsole) {
      const consoleOutput = this.formatConsoleOutput(logEntry);
      console.log(consoleOutput);
    }

    // File output
    this.writeToFile(logEntry);
  }

  // Convenience methods
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  trace(message, meta = {}) {
    this.log('trace', message, meta);
  }

  // HTTP request logging
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0
    };

    if (res.statusCode >= 400) {
      this.error('HTTP Request Error', meta);
    } else if (res.statusCode >= 300) {
      this.warn('HTTP Request Redirect', meta);
    } else {
      this.info('HTTP Request', meta);
    }
  }

  // Database operation logging
  logDatabaseQuery(operation, table, duration, error = null) {
    const meta = {
      operation,
      table,
      duration: `${duration}ms`,
      success: !error
    };

    if (error) {
      meta.error = error.message;
      this.error('Database Query Failed', meta);
    } else {
      this.debug('Database Query', meta);
    }
  }

  // Performance logging
  logPerformance(operation, duration, metadata = {}) {
    const meta = {
      operation,
      duration: `${duration}ms`,
      ...metadata
    };

    if (duration > 1000) {
      this.warn('Slow Operation Detected', meta);
    } else {
      this.debug('Performance Metric', meta);
    }
  }

  // API call logging
  logApiCall(endpoint, method, statusCode, duration, error = null) {
    const meta = {
      endpoint,
      method,
      statusCode,
      duration: `${duration}ms`,
      success: !error
    };

    if (error) {
      meta.error = error.message;
      this.error('API Call Failed', meta);
    } else if (statusCode >= 400) {
      this.warn('API Call Error Response', meta);
    } else {
      this.info('API Call Success', meta);
    }
  }

  // Service startup logging
  logServiceStart(serviceName, port = null, config = {}) {
    const meta = {
      service: serviceName,
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      ...config
    };

    if (port) {
      meta.port = port;
    }

    this.info(`${serviceName} Started`, meta);
  }

  // Error with stack trace
  logError(error, context = {}) {
    const meta = {
      error: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    };

    this.error('Unhandled Error', meta);
  }

  // Create child logger with additional context
  child(additionalMeta = {}) {
    const childLogger = new Logger(this.config);
    childLogger.requestId = this.requestId;
    
    // Override log method to include additional metadata
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, meta = {}) => {
      originalLog(level, message, { ...additionalMeta, ...meta });
    };

    return childLogger;
  }

  // Express middleware for request logging
  createRequestMiddleware() {
    return (req, res, next) => {
      const requestId = this.generateRequestId();
      this.setRequestId(requestId);
      
      req.logger = this.child({ requestId });
      req.startTime = process.hrtime();

      // Log request start
      req.logger.info('Request Started', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      });

      // Log response when finished
      res.on('finish', () => {
        const diff = process.hrtime(req.startTime);
        const responseTime = diff[0] * 1000 + diff[1] * 1e-6;
        this.logRequest(req, res, Math.round(responseTime));
      });

      next();
    };
  }
}

// Export singleton instance
const config = {
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: process.env.LOG_CONSOLE !== 'false',
  enableFile: process.env.LOG_FILE_ENABLED === 'true',
  logFile: process.env.LOG_FILE || 'logs/risktwin.log',
  service: 'risktwin-api'
};

module.exports = new Logger(config); 