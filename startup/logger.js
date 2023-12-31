const winston = require("winston");
const config = require("config");
require("winston-mongodb");
const db = config.get("db");

const logger = winston.createLogger({
  level: 'info',
  // defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', dirname: 'logs', level: 'error', format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()), }),
    new winston.transports.File({ filename: 'combined.log', dirname: 'logs', format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()), }),
    new winston.transports.MongoDB({ db, level: "error", format: winston.format.combine(winston.format.timestamp(), winston.format.json()), }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }));
}

module.exports = logger;
