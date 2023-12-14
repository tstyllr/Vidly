const express = require("express");
const config = require("config");
const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
require("express-async-errors");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const { createLogger, format, transports, level } = require('winston');
const { combine, timestamp, label, prettyPrint, simple, colorize } = format;
require('winston-mongodb');
const cors = require('cors')

const jwtPrivateKey = process.env.jwtPrivateKey || config.get("jwtPrivateKey");

const db = config.get("db");
mongoose
  .connect(db, {})
  .then((res) => {
    console.log("Connected db", db);
  })
  .catch((error) => {
    console.log("Failed to connect db", db);
  });

const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'combined.log', dirname: 'logs' }),
    new transports.File({ filename: 'error.log', dirname: 'logs', level: 'error' }),
    new transports.MongoDB({ db, level: 'error' }),
  ],
  format: combine(timestamp(), prettyPrint()),
});

logger.info('hello world.');
logger.error('oops')

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
};

const validateCourse = function (course) {
  const schema = Joi.object({
    name: Joi.string().required(),
  });
  return schema.validate(course);
};

const validateObjectId = function (id) {
  const schema = Joi.object({
    id: Joi.objectId(),
  });
  return schema.validate(id);
};

function validateObjectIdMiddleware(req, res, next) {
  const { error } = validateObjectId(req.params);
  if (error) return res.status(400).send("Invalid id");

  next();
}

function authenticationMiddleware(req, res, next) {
  const token = req.get("token");
  jwt.verify(token, jwtPrivateKey, (error, payload) => {
    if (error) {
      res.status(400).send(error.message);
    } else {
      req.user = payload;
      next();
    }
  });
}

function role99Middleware(req, res, next) {
  if (req.user?.role === 99) {
    next();
  } else res.status(403).send("Request denied!");
}

const port = process.env.PORT || config.get("port");
const app = express();
// cors (cross origin resource sharing)。浏览器有同源策略，默认不允许当前网站向其他origin（其他服务器）获取资源。服务器可以通过配置cros让浏览器允许访问
app.use(cors()); // 表示服务器允许所有的跨源访问
// app.use(cors({origin: 'https://example.com'})); // 表示服务器只允许https://example.com的跨源访问
app.use(express.json());
app.use("/static", express.static("/Users/yangzhicong/temp/"));

// 配置模板引擎https://expressjs.com/en/guide/using-template-engines.html#using-template-engines-with-express
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", { foo: "ejs" });
});

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

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

app.get("/api/users/:id", async (req, res) => {
  let { error: inputErr } = validateObjectId(req.params);
  if (inputErr) return res.status(400).send(inputErr.message);

  let user = await User.findById(req.params.id);
  res.send(user);
});

app.post("/api/users", async (req, res) => {
  const { error: inputError } = validateUser(req.body);
  if (inputError) return res.status(400).send(inputError.message);

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res
      .status(400)
      .send(`User with email ${req.body.email} is already exist!`);

  let password = await bcrypt.hash(req.body.password, 10);
  user = new User({
    name: req.body.name,
    email: req.body.email,
    password,
  });
  await user.save();
  res.send(user);
});

app.delete(
  "/api/users/:id",
  [authenticationMiddleware, role99Middleware, validateObjectIdMiddleware],
  async (req, res) => {
    const { error: inputErr } = validateObjectId(req.params);
    if (inputErr) return res.status(400).send(inputErr.message);

    let user = await User.findByIdAndDelete(req.params.id);
    res.send(user);
  }
);

function extMW1(req, res, next) {
  console.log("ext MW 1");
  next();
}

function extMW2(req, res, next) {
  console.log("ext MW 2");
  next();
}

app.put(
  "/api/users/:id",
  [authenticationMiddleware, validateObjectIdMiddleware],
  async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) res.status(400).send(error.message);

    let user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
      },
      { new: true }
    );

    res.send(user);
  }
);

const validateLoginBody = (body) => {
  const schema = Joi.object({
    email: Joi.string().email(),
    password: Joi.string().min(6).max(1024),
  });
  return schema.validate(body);
};

app.post("/api/login", async (req, res) => {
  const { error } = validateLoginBody(req.body);
  if (error) return res.status(400).send(error.message);

  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email");

  let passed = await bcrypt.compare(req.body.password, user.password);
  if (!passed) return res.status(400).send("Invalid password");

  const payload = { name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(payload, jwtPrivateKey);

  res.send({ token });
});

const personSchema = new mongoose.Schema({
  name: String,
  stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Story" }],
});
const Person = mongoose.model("Person", personSchema);

const storySchema = new mongoose.Schema({
  title: String,
  author: { type: mongoose.SchemaTypes.ObjectId, ref: "Person" },
  fans: [{ type: mongoose.SchemaTypes.ObjectId, ref: "Person" }],
});
const Story = mongoose.model("Story", storySchema);

const test = async () => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    await Story.findByIdAndUpdate(
      "657272721acec782ddaa0020",
      { title: "倩女幽魂" },
      { session }
    );
    await Person.findByIdAndUpdate(
      "657272721acec782ddaa001f",
      { name: "汤姆" },
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    console.log("tranaction fail", error.message);
    if (session) await session.abortTransaction();
  } finally {
    if (session) await session.endSession();
  }
};
// test();

app.use(function (error, req, res, next) {
  res.status(500).send(error.message);
});

app.listen(port, () => {
  console.log("listening on port", port);
});
