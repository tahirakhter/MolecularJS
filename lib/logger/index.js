'use strict';

const { createLogger, format, transports } = require('winston');
const { omit, isEmpty } = require('lodash');
const fs = require('fs');
const path = require('path');
require('winston-daily-rotate-file');

const env = process.env.NODE_ENV || 'development';

const logDir = 'logs';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function customPrint(info) {
  const details = omit(info, ['timestamp', 'level', 'label', 'message']);

  if (isEmpty(details)) {return `${info.timestamp} | ${info.level} | [${info.label}]: ${info.message}`;}

  return `${info.timestamp} | ${info.level} | [${info.label}]: ${info.message} \n|---> ${JSON.stringify(details)}`;

}

const logger = (caller) => {
  return createLogger({
    level: 'info',
    format: format.combine(
      format.label({ label: `${path.dirname(caller).split(path.sep).pop()}/${path.basename(caller)}` }),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' })
    ),
    transports: [
      new transports.Console({
        level: env === 'production' ? 'error' : 'info',
        format: format.combine(
          format.colorize(),
          format.printf(customPrint)
        )
      }),
      new transports.DailyRotateFile({
        filename: `${logDir}/%DATE%.api.log`,
        datePattern: 'YYYY-MM-DD',
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        format: format.combine(
          format.printf(customPrint)
        )
      })
    ],
    exceptionHandlers: [
      new transports.Console()
    ]
  });
};

module.exports = logger;
