const express = require("express");
const config = require('config');
const app = express();
const logger = require("./startup/logger");

require('./startup/error')();
require('./startup/validate')();
require('./startup/config')();
require('./startup/db')();
require('./startup/cors')(app);
require('./startup/routes')(app);

const port = process.env.NODE_PORT || config.get('port');
app.listen(port, () => {
  logger.info(`Express did listen to ${port}`)
})