const log = require('../startup/logger')

module.exports = function (error, req, res, next) {
  log.error(error.message);
  res.status(500).send(error.message);
}