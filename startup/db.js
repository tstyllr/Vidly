const mongoose = require('mongoose')
const config = require('config')
const log = require('./logger');

module.exports = function () {
  const db = config.get('db');
  mongoose.connect(db, {}).then(res => {
    log.info(`Did connected to ${db}`);
  }).catch(error => {
    log.error(`Failed to connect ${db}. message: ${error.message}`)
  });
}
