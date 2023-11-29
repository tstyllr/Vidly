const express = require("express");
const config = require("config");
const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require('joi-objectid')(Joi)
require('express-async-errors');

const db = config.get("db");
mongoose.connect(
  db,
  {}).then(res => {
    console.log('Connected db', db);
  }).catch(error => {
    console.log("Failed to connect db", db);
  })

const dbCourseSchema = new mongoose.Schema({ name: String });
const Course = mongoose.model("Course", dbCourseSchema);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 50,
  },
  email: {
    type: String,
    index: true,
    unique: true,
    required: true,
    minLength: 5,
    maxLength: 50,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    maxLength: 1024,
  },
  role: {
    type: Number,
    required: true,
    default: 1,
  },
});

const User = mongoose.model("User", userSchema);

const validateUser = function (user) {
  const schema = Joi.object({
    name: Joi.string().required().max(50).min(3),
    email: Joi.string().required().email().min(5).max(50),
    password: Joi.string().required().min(6).max(1024),
  });
  return schema.validate(user);
}


const validateCourse = function (course) {
  const schema = Joi.object({
    name: Joi.string().required(),
  });
  return schema.validate(course);
}

const validateObjectId = function (id) {
  const schema = Joi.object({
    id: Joi.objectId(),
  });
  return schema.validate(id);
}

const port = process.env.PORT || config.get("port");
const app = express();
app.use(express.json());

app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.send(courses);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404).send(`Course ${req.params.id} is not exist`);
      return;
    }

    res.send(course);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.post("/api/courses", async (req, res) => {
  try {
    const { error } = validateCourse(req.body);
    if (error) {
      throw error;
    }

    const course = new Course(req.body);
    await course.save();
    res.send(course);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { error: error1 } = validateObjectId(req.params);
    if (error1) throw error1;

    const { error: error2 } = validateCourse(req.body);
    if (error2) throw error2;

    const course = await Course.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
    });
    res.send(course);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const { error } = validateObjectId(req.params);
    if (error) throw error1;

    const course = await Course.findByIdAndDelete(req.params.id);
    res.send(course);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.send(users);
});

app.post('/api/users', async (req, res) => {
  const { error: inputError } = validateUser(req.body)
  if (inputError) throw inputError;

  let user = new User(req.body);
  await user.save();
  res.send(user);
});

app.put('/api/users/:id', async (req, res) => {
  throw new Error('未实现该API');
});

app.use(function (error, req, res, next) {
  res.status(500).send(error.message);
});

app.listen(port, () => {
  console.log("listening on port", port);
});
