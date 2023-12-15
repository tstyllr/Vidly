const winston = require("winston");
const config = require("config");
require("winston-mongodb");
const { label, timestamp, prettyPrint, simple, colorize, combine } = winston.format;

const db = config.get("db");
const log = winston.createLogger({
  format: winston.format.combine(label({ label: 'right meow!' }),
    timestamp(),
    prettyPrint()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ dirname: "logs", filename: "all.log" }),
    new winston.transports.File({
      dirname: "logs",
      filename: "error.log",
      level: "error",
    }),
    new winston.transports.MongoDB({ db, level: "error" }),
  ],
});

module.exports = log;
