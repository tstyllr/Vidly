const express = require("express");
const config = require("config");
const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require('joi-objectid')(Joi)
require('express-async-errors');
const bcrypt = require("bcrypt")
const ejs = require('ejs');

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
    name: Joi.string().required().min(3).max(50),
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

function validateObjectIdMiddleware(req, res, next) {
  const { error } = validateObjectId(req.params);
  if (error) return res.status(400).send('Invalid id');

  next();
}

const port = process.env.PORT || config.get("port");
const app = express();
app.use(express.json());
app.use('/static', express.static('/Users/yangzhicong/temp/'));

// 配置模板引擎https://expressjs.com/en/guide/using-template-engines.html#using-template-engines-with-express
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('index', { foo: 'ejs' });
})

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

app.get('/api/users/:id', async (req, res) => {
  let { error: inputErr } = validateObjectId(req.params);
  if (inputErr) return res.status(400).send(inputErr.message);

  let user = await User.findById(req.params.id);
  res.send(user);
});

app.post('/api/users', async (req, res) => {
  const { error: inputError } = validateUser(req.body)
  if (inputError) return res.status(400).send(inputError.message)

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send(`User with email ${req.body.email} is already exist!`)

  let password = await bcrypt.hash(req.body.password, 10);
  user = new User({
    name: req.body.name,
    email: req.body.email,
    password
  });
  await user.save();
  res.send(user);
});

app.delete('/api/users/:id', async (req, res) => {
  const { error: inputErr } = validateObjectId(req.params);
  if (inputErr) return res.status(400).send(inputErr.message);

  let user = await User.findByIdAndDelete(req.params.id);
  res.send(user);
});

function extMW1(req, res, next) {
  console.log('ext MW 1');
  next();
}

function extMW2(req, res, next) {
  console.log('ext MW 2');
  next();
}

app.put('/api/users/:id', [validateObjectIdMiddleware], async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) res.status(400).send(error.message);

  let user = await User.findByIdAndUpdate(req.params.id, {
    name: req.body.name,
  }, { new: true });

  res.send(user);
});

const validateLoginBody = (body) => {
  const schema = Joi.object({
    email: Joi.string().email(),
    password: Joi.string().min(6).max(1024),
  });
  return schema.validate(body);
};
app.post('/api/login', async (req, res) => {
  const { error } = validateLoginBody(req.body);
  if (error) return res.status(400).send(error.message);

  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email");

  let passed = await bcrypt.compare(req.body.password, user.password);
  if (!passed) return res.status(400).send('Invalid password');

  res.send(user);
});

const childSchema = new mongoose.Schema({
  name: String,
  age: Number,
  grade: Number,
});

const parentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  level: Number,
  children: [childSchema],
});

const Parent = mongoose.model("Parent", parentSchema);

app.post('/api/parents', async (req, res) => {
  let parent = new Parent({ name: 'yang tu sheng', age: 63, level: 1, children: [{ name: 'yang zhi cong', age: 33, grade: 1 }, { name: 'yang yong', age: 38, grade: 1 }, { name: 'yang zhi chao', age: 28, grade: 1 }] });
  await parent.save()
  res.send(parent);
});

const personSchema = new mongoose.Schema({
  name: String,
  sex: Number,
  spouse: mongoose.Schema.Types.ObjectId,
  parents: [mongoose.Schema.Types.ObjectId],
  children: [mongoose.Schema.Types.ObjectId],
});

const Person = mongoose.model("Person", personSchema);

const validatePerson = (person) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    sex: Joi.number().min(0).max(1).required(),
    spouse: Joi.objectId(),
    parent: Joi.array().items(Joi.objectId()).required(),
    children: Joi.array().items(Joi.objectId()).required(),
  });
  return schema.validate(person);
}

app.get('/api/person', async (req, res) => {
  let person = await Person.find({});
  res.send(person);
})

app.get('/api/person/:id', [validateObjectIdMiddleware], async (req, res) => {
  let person = await Person.findById(req.params.id);
  res.send(person);
})

app.post('/api/person', async (req, res) => {
  let { error } = validatePerson(req.body);
  if (error) return res.status(400).send('Invalid request params! ' + error.message);

  let person = new Person(req.body);
  person = await person.save();
  res.send(person);
});

app.put('/api/person/:id', [validateObjectIdMiddleware], async (req, res) => {
  let person = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.send(person);
})

app.use(function (error, req, res, next) {
  res.status(500).send(error.message);
});

app.listen(port, () => {
  console.log("listening on port", port);
});
