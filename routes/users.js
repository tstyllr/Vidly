const express = require('express');
const { User } = require('../models/user');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
})
module.exports = router;