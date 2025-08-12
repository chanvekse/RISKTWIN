/**
 * =============================================================================
 * ENVIRONMENT CONFIGURATION MANAGER
 * =============================================================================
 * 
 * Centralized configuration management for the RiskTwin platform
 * Supports environment variables with fallbacks for security and flexibility
 */

const fs = require('fs');
const path = require('path');

class EnvironmentConfig {
  constructor() {
    this.loadEnvironment();
    this.validateRequiredSettings();
  }

  loadEnvironment() {
    // Try to load .env file if it exists
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
    }

    this.config = {
      // Database Configuration
      database: {
        url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_aRB0bz3YGglm@ep-wandering-brook-aes1z00x.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        pool: {
          min: parseInt(process.env.DB_POOL_MIN) || 1,
          max: parseInt(process.env.DB_POOL_MAX) || 5,
          idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000,
          connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
          acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
          createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT) || 30000,
          reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL) || 1000,
          createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL) || 200,
          propagateCreateError: false
        }
      },

      // Server Configuration
      server: {
        port: parseInt(process.env.PORT) || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        staticPath: process.env.STATIC_PATH || '../frontend/ui'
      },

      // Security Configuration
      security: {
        jwtSecret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        corsOrigin: process.env.CORS_ORIGIN || '*',
        enableHttps: process.env.ENABLE_HTTPS === 'true'
      },

      // Logging Configuration
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/risktwin.log',
        enableConsole: process.env.LOG_CONSOLE !== 'false',
        enableFile: process.env.LOG_FILE_ENABLED === 'true'
      },

      // Performance Configuration
      performance: {
        cacheTtl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
        enableCaching: process.env.ENABLE_CACHING === 'true',
        compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000
      },

      // External Services
      external: {
        redisUrl: process.env.REDIS_URL || null,
        monitoringUrl: process.env.MONITORING_URL || null,
        sentryDsn: process.env.SENTRY_DSN || null
      }
    };
  }

  validateRequiredSettings() {
    const required = [
      'database.url'
    ];

    const missing = required.filter(key => {
      const value = this.getNestedValue(this.config, key);
      return !value || value === '';
    });

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  get(section) {
    return this.config[section];
  }

  getDatabase() {
    return this.config.database;
  }

  getServer() {
    return this.config.server;
  }

  getSecurity() {
    return this.config.security;
  }

  getLogging() {
    return this.config.logging;
  }

  getPerformance() {
    return this.config.performance;
  }

  getExternal() {
    return this.config.external;
  }

  isDevelopment() {
    return this.config.server.nodeEnv === 'development';
  }

  isProduction() {
    return this.config.server.nodeEnv === 'production';
  }

  isTest() {
    return this.config.server.nodeEnv === 'test';
  }
}

// Export singleton instance
module.exports = new EnvironmentConfig(); 