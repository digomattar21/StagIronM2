require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");



//var helmet = require('helmet')

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();


require('./configs/session.config')(app);

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup

app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "/public"),
    dest: path.join(__dirname, "/public"),
    sourceMap: true,
  })
);


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "/public")));
app.use(favicon(path.join(__dirname, 'public', 'assets','img', 'logo_white.ico')));
hbs.registerPartials(path.join(__dirname, "/views/partials"));

hbs.registerHelper('biggerThanZero', function (value) {
  value = parseFloat(value);
  return value >0 ;
});

hbs.registerHelper('getArticlesLength', function (articles) {
  return articles.length;
});

hbs.registerHelper('verifyEqual', function (arg1,arg2) {
  console.log(arg1, arg2);
  console.log(arg1==arg2)
  return arg1==arg2;
});

hbs.registerHelper('verifyOn', function (arg1) {
  return arg1==="on";
});

hbs.registerHelper('verifyEmpty', function (arg1) {
  return arg1!='';
});

hbs.registerHelper('checkOn', function (arg1) {
  return arg1=='on';
});



// default value for title local
app.locals.title = "Stag Talk";

require("./configs/db.config");



const index = require("./routes/index");
const private = require("./routes/private.routes");
const auth = require("./routes/auth.routes");
const articles = require("./routes/articleAuthor.routes")

//app.use(helmet());

app.use("/", index);
app.use("/", private);
app.use('/', auth);
app.use('/', articles)



module.exports = app;
