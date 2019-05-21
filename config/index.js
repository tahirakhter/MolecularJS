'use strict';

const convict = require('convict');
const path = require('path');
const fs = require('fs');

const config = convict({
  env: {
    doc: 'Application Environment',
    format: ['develop', 'qa', 'prod'],
    default: 'develop',
    env: 'NODE_ENV'
  },

  api: {
    showExceptionToClient: {
      format: Boolean,
      default: false
    },
    port: {
      format: 'port',
      default: 3004
    },
    key: {
      format: String,
      default: 'consumer api key'
    },
    limit: {
      format: String,
      default: '50MB'
    },
    windowMs: {
      format: Number,
      default: 15 * 60 * 1000 // 15 minutes //todo in convict
    },
    max: {
      format: Number,
      default: 1000 // limit each IP to 1000 requests per windowMs
    }
  },
  nats: {
    url: "nats://127.0.0.1:4222",
    user: "open-api",
    pass: "SHgj7NCpp1DWaUkZQrJwBunl0jylfWQRYA==",
    tls:{
      rejectUnauthorized: false
    }
  },
  cacher: {
    type: {
      format: String,
      default: 'Redis'
    },
    options: {
      // Prefix for keys
      prefix: {
        format: String,
        default: 'MOL'
      },
      // set Time-to-live to 30sec.
      ttl: {
        format: Number,
        default: 30
      },
      // Turns Redis client monitoring on.
      monitor: {
        format: Boolean,
        default: false
      },
      // Redis settings
      redis: {
        host: {
          format: String,
          default: 'localhost'
        },
        port: {
          format: 'port',
          default: 6379
        },
        password: {
          format: String,
          default: 'abcd@1234'
        },
        db: {
          format: Number,
          default: 0
        }
      }
    }
  }
});

const env = config.get('env');
const configPath = path.join(__dirname, `./${env}.json`);
if (fs.existsSync(configPath)) {
  config.loadFile(configPath);
}
config.validate({ allowed: 'strict' });

module.exports = config;
