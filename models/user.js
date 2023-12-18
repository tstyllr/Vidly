const mongoose = require("mongoose");
const Joi = require('joi')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 1024,
  },
  email: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 1024,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    maxLength: 1024,
  },
});

const User = mongoose.model("User", userSchema);

function validate(user) {
  const schema = Joi.Schema({
    name: Joi.string().required().min(3).max(1024),
    email: Joi.string().required().min(3).max(1024),
    password: Joi.string().required().min(6).max(1024),
  })
  return schema.validate(user);
}

module.exports.User = User;
module.exports.validate = validate;
