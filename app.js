const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
var bodyParser = require('body-parser');
const passport = require("passport");
const flash = require("connect-flash");

const mysql = require('mysql');

const session = require("express-session");
require("cookie-parser");


//Express Session
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

app.use(express.static('public'));
app.use(express.static(__dirname + "./public/"));
app.set('trust proxy', true);
app.set('views', __dirname + '/views');
app.set('view engine','ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes-users
app.use("/", require("./routes/index"));
app.use("/", require("./routes/customer"));
app.use("/", require("./routes/supplier"));
app.use("/", require("./routes/cashier"));
app.use("/", require("./routes/admin"));

app.listen(PORT, console.log('Pharma Store started on port 5000'));
