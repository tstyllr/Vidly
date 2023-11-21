const express = require('express')
const config = require('config');
const mongoose = require('mongoose')

const db = config.get('db');
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
  console.log('Connected to', db);
});

const port = process.env.PORT || config.get("port");
const app = express();
app.listen(port, () => {
  console.log('listening on port', port);
});