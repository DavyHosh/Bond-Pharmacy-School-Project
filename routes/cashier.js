const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const fs = require('fs');
var path = require("path");
var multer = require("multer");
const passport = require("passport");
var Sequelize = require("sequelize");
require("../config/cashierpassport")(passport);

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
    console.log("Cashier Database connected");
  } else {
    console.log(err);
  }
});


// suppliers
router.get("/cashier/deliveries", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM deliveries WHERE status = 'null' ORDER BY id DESC";
  let query = myconnection.query(sql, (err, delivery, rows) => {
    if (err) throw err;
    let sql = "SELECT * FROM deliveries WHERE status = 'accepted' ORDER BY id DESC";
    let query = myconnection.query(sql, (err, sale) => {
      if (err) throw err;
      res.render("./cashier/deliveries", { allDeliveries: delivery, allSales: sale });
    });
  });
});

router.get("/cashier/:id/delivery_receipt", ensureAuthenticated, (req, res) => {
  const orderId = req.params.id;
  let status = "accepted";

  let sql = "SELECT * FROM deliveries WHERE id = ? AND status = ?";
  myconnection.query(sql,[orderId, status], (err, result, fields) => {
    if(err) throw err;
        res.render("./cashier/receipt", { order: result[0] });
  });
});

router.post("/cashier/:id/cancel_delivery", ensureAuthenticated, (req, res) => {
  let deliveryId = req.params.id;
  let status = "revoked";
  let reason = req.body.reason;
  
  let sql = "UPDATE `deliveries` SET `status` = '" + status + "' WHERE `deliveries`.`id` = '" + deliveryId + "'";
  let sql2 = "UPDATE `deliveries` SET `reason` = '" + reason + "' WHERE `deliveries`.`id` = '" + deliveryId + "'";
  let query = myconnection.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    let query = myconnection.query(sql2, (err, results) => {
      if (err) return res.status(500).send(err);
      res.redirect("/cashier/deliveries");
    });
  });
});

router.get("/cashier/:id/accept_delivery", ensureAuthenticated, (req, res) => {
  let deliveryId = req.params.id;
  let status = "accepted";
  
  let sql = "UPDATE `deliveries` SET `status` = '" + status + "' WHERE `deliveries`.`id` = '" + deliveryId + "'";
  let query = myconnection.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.redirect("/cashier/deliveries");
  });
});

// customers
router.get("/cashier/orders", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM orders WHERE status = 'null' ORDER BY id DESC";
  let query = myconnection.query(sql, (err, order, rows) => {
    if (err) throw err;
    let sql = "SELECT * FROM orders WHERE status = 'accepted' ORDER BY id DESC";
    let query = myconnection.query(sql, (err, sale) => {
      if (err) throw err;
      res.render("./cashier/orders", { allOrders: order, allSales: sale });
    });
  });
});

router.get("/cashier/:id/receipt", ensureAuthenticated, (req, res) => {
  const orderId = req.params.id;

  let sql = "SELECT * FROM orders WHERE id = ?";
  myconnection.query(sql,[orderId], (err, result, fields) => {
    if(err) throw err;
        res.render("./cashier/receipt", { order: result[0] });
  });
});

router.get("/cashier/:id/cancel_order", ensureAuthenticated, (req, res) => {
  let orderId = req.params.id;
  let status = "revoked";
  
  let sql = "UPDATE `orders` SET `status` = '" + status + "' WHERE `orders`.`id` = '" + orderId + "'";
  let query = myconnection.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.redirect("/cashier/orders");
  });
});

router.get("/cashier/:id/accept_order", ensureAuthenticated, (req, res) => {
  let orderId = req.params.id;
  let status = "accepted";
  
  let sql = "UPDATE `orders` SET `status` = '" + status + "' WHERE `orders`.`id` = '" + orderId + "'";
  let query = myconnection.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.redirect("/cashier/orders");
  });
});

router.get("/cashier/:id/receipt", ensureAuthenticated, (req, res) => {
  res.render("./cashier/receipt");
});

//logout Handle
router.get("/cashier_logout", ensureAuthenticated, (req, res) => {
  req.logout();
  req.flash("success", "you've been successfully logged out!");
  res.redirect("/");
});

module.exports = router;
