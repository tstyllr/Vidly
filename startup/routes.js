const users = require('../routes/users')

module.exports = function (app) {
  app.use('/api/users', users);
}