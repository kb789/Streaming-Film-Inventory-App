var express = require("express");
var mongoose = require("mongoose");
const bodyParser = require("body-parser");
var path = require("path");
require("dotenv").config();

var indexRouter = require("./routes/index");

var app = express();

// database setup

var mongoDB = process.env.DB;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// set the view engine to ejs

app.set("view engine", "ejs");

// route middlewares

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

app.use((req, res, next) => {
  res.status(404).send("<h1>Page not found on the server</h1>");
});

app.listen(3000);
console.log("Server is listening on port 3000");
