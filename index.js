const express = require("express");
const config = require('config');
const log = require("./startup/log");

const app = express();

require('./startup/db')();
require('./startup/routes')(app);

const port = process.env.NODE_PORT || config.get('port')
app.listen(port, () => {
  log.info(`Express did listen to ${port}`)
})