const log = require('../startup/log')

module.exports = function (error, req, res, next) {
  log.error(error.message);
  res.status(500).send(error.message);
}