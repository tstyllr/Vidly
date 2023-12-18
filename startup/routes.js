const error = require('../middlewares/error');
const users = require('../routes/users')
const json = require('express').json;

module.exports = function (app) {
  app.use(json())
  app.use('/api/users', users);
  app.use(error);
}