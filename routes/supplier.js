const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const fs = require('fs');
var path = require("path");
var multer = require("multer");
const passport = require("passport");
var Sequelize = require("sequelize");
require("../config/supplierpassport")(passport);

var session = require('express-session');
var flash = require('connect-flash');
router.use(
  session({
    cookie: { maxAge: 100 },
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);
router.use(flash());

router.use(function(req, res, next){
    res.locals.message = req.flash();
    next();
});

var cors = require("cors");
router.use(cors());

const helmet = require("helmet");
router.use(helmet());

require("cookie-parser");

var SequelizeStore = require("connect-session-sequelize")(session.Store);

const sequelize = new Sequelize('nsp', 'root', 'password', {
  host: 'localhost',
  dialect: "mysql"
});

sequelize.define("Session", {
  sid: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  // admin_id: Sequelize.STRING,
  user_id: Sequelize.STRING,
  expires: Sequelize.DATE,
  data: Sequelize.TEXT,
});

function extendDefaultFields(defaults, session) {
  return {
    data: defaults.data,
    expires: defaults.expires,
    // admin_id: session.admin_id,
    user_id: session.user_id,
  };
}

var myStore = new SequelizeStore({
  db: sequelize,
  table: "Session",
  extendDefaultFields: extendDefaultFields,
});

router.use(
  session({
    secret: "secret",
    store: myStore,
    saveUninitialized: false,
    resave: false, // we support the touch method so per the express-session docs this should be set to false
    proxy: true, // if you do SSL outside of node.
  })
);

myStore.sync();

//authentication
const { ensureAuthenticated } = require("../config/auth");

// DB CONFIGURATION hope this works outs :-)
var myconnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "nsp",
  port: "3306",
  insecureAuth : true,
  multipleStatements: true
});
myconnection.connect(err => {
  if (!err) {
    console.log("Supplier Database connected");
  } else {
    console.log(err);
  }
});

// Deliveries
router.get("/supplier/deliveries", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM deliveries ORDER BY id DESC";
  let query = myconnection.query(sql, (err, delivery, rows) => {
    if (err) throw err;
      res.render("./supplier/deliveries", { allDeliveries: delivery });
  });
});

router.get("/supplier/new_delivery", ensureAuthenticated, (req, res) => {
  let userId = req.session.user_id;
  let delivery = req.session.fname + ' ' + req.session.lname;
  res.render("./supplier/new_delivery", { delivery: delivery });
});

router.post("/supplier/new_delivery", ensureAuthenticated, (req, res) => {
  var newData = {
    title: req.body.title,
    quantity: req.body.quantity,
    amount: req.body.amount,
    expiry_date: req.body.expiry_date,
    supplier: req.body.supplier,
    status: "null",
    reason: "null",
  };
  
  let sql = "INSERT INTO deliveries SET ?";
  let query = myconnection.query(sql, newData, (err, results) => {
    if (err) throw err;
    res.redirect("/supplier/deliveries");
  });
});

router.get("/supplier/edit_delivery", ensureAuthenticated, (req, res) => {
  res.render("./supplier/edit_delivery");
});

router.post("/supplier/edit_delivery", ensureAuthenticated, (req, res) => {
  res.redirect("/supplier/edit_delivery");
});

router.get("/supplier/sales", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM deliveries WHERE status = 'accepted' ORDER BY id DESC";
  let query = myconnection.query(sql, (err, sale, rows) => {
    if (err) throw err;
      res.render("./supplier/sales", { allSales: sale });
  });
});

//logout Handle
router.get("/supplier_logout", ensureAuthenticated, (req, res) => {
  req.logout();
  req.flash("success", "you've been successfully logged out!");
  res.redirect("/");
});

module.exports = router;
