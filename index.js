const express = require("express");
const config = require("config");
const mongoose = require("mongoose");
const Joi = require("joi");

const db = config.get("db");
mongoose.connect(
  db,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to", db);
  }
);

const port = process.env.PORT || config.get("port");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log("my middleware 1");
  next();
});

app.use((req, res, next) => {
  console.log("my middleware 2");
  next();
});

app.use((req, res, next) => {
  console.log("my middleware 3");
  next();
});

let courses = [
  { id: "1", name: "course1" },
  { id: "2", name: "course2" },
  { id: "3", name: "course3" },
];

app.get("/api/courses", (req, res) => {
  console.log("receive request", req.params);
  res.send(courses);
});

const idSchema = Joi.object({
  id: Joi.string().required(),
});

app.get("/api/courses/:id", (req, res) => {
  const { error } = idSchema.validate(req.params);
  if (error) {
    res.status(400).send(error.message);
    return;
  }

  const course = courses.find((x) => {
    return x.id === req.params.id;
  });
  if (!course) {
    res.status(404).send(`Course with id ${req.params.id} is not found!`);
    return;
  }

  res.send(course);
});

const courseSchema = Joi.object({
  name: Joi.string().required(),
});
app.post("/api/courses", (req, res) => {
  const { error } = courseSchema.validate(req.body);
  if (error) {
    res.status(400).send(error.message);
    return;
  }

  const course = {
    ...req.body,
    id: courses.length + 1,
  };
  courses.push(course);

  res.send(course);
});

app.put("/api/courses/:id", (req, res) => {
  console.log(req.params, req.body);
  const { error: error1 } = idSchema.validate(req.params);
  if (error1) {
    res.status(400).send(error1.message);
    return;
  }

  const { error: error2 } = courseSchema.validate(req.body);
  if (error2) {
    res.status(400).send(error2.message);
    return;
  }

  const courseIdx = courses.findIndex(x => x.id === req.params.id);
  if (courseIdx === -1) {
    res.status(404).send(`Course with id ${req.params.id} is not found!`);
    return;
  }
  const course = courses[courseIdx];

  let next = { ...course, ...req.body };
  courses.splice(courseIdx, 1, next);

  res.send(next);
});

app.listen(port, () => {
  console.log("listening on port", port);
});
