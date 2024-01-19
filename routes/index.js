const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const fs = require('fs');
var path = require("path");
var multer = require("multer");
var Sequelize = require("sequelize");
const passport = require("passport");
const supplierpassport = require("passport");
const cashierpassport = require("passport");
const adminpassport = require("passport");
require("../config/customerpassport")(passport);
require("../config/supplierpassport")(supplierpassport);
require("../config/cashierpassport")(cashierpassport);
require("../config/cashierpassport")(adminpassport);

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

// var cors = require("cors");
// router.use(cors());

// const helmet = require("helmet");
// router.use(helmet());

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
    console.log("Index Database connected");
  } else {
    console.log(err);
  }
});

router.get("/", (req, res) => {
  let sql = "SELECT * FROM products";
  let query = myconnection.query(sql, (err, product) => {
    if (err) throw err;
    res.render("./index", { allProducts: product});
  });
});

router.get("/shop", (req, res) => {
  let sql = "SELECT * FROM products";
  let query = myconnection.query(sql, (err, product) => {
    if (err) throw err;
    res.render("./shop", { allProducts: product});
  });
});

router.get("/:id/product", (req, res) => {
  const productId = req.params.id;

  let sql = "SELECT * FROM products WHERE id = ?";
  myconnection.query(sql,[productId], (err, result, fields) => {
    if(err) throw err;
        res.render("./shop-single", { product: result[0] });
  });
});

router.get("/about", (req, res) => {
  res.render("./about");
});

router.get("/cart", (req, res) => {
  res.render("./cart");
});

router.get("/checkout", (req, res) => {
  res.render("./checkout");
});

router.get("/contact", (req, res) => {
  res.render("./contact");
});

router.post("/contact", (req, res) => {
  var myData = req.body;

  console.log(myData);
  let sql = "INSERT INTO contact SET ?";
  let query = myconnection.query(sql, myData, (err, results) => {
      if (err) throw err;
      req.flash("success", "Message sent successfully!");
      res.redirect("/contact");
  });
  });

router.get("/thankyou", (req, res) => {
  res.render("./thankyou");
});

// Sign Up Handles
router.get("/customer_signup", (req, res) => {
  res.render("./customer_signup");
});

router.post(
  "/customer_signup",
  passport.authenticate("local-customer_signup", {
    successRedirect: "/customer_login",
    failureRedirect: "/customer_signup",
    failureFlash: true
  })
);

router.get("/supplier_signup", (req, res) => {
  res.render("./supplier_signup");
});

router.post(
  "/supplier_signup",
  supplierpassport.authenticate("local-supplier_signup", {
    successRedirect: "/supplier_login",
    failureRedirect: "/supplier_signup",
    failureFlash: true
  })
);

router.get("/admin_signup", (req, res) => {
  res.render("./admin_signup");
});

router.post(
  "/admin_signup",
  adminpassport.authenticate("local-admin_signup", {
    successRedirect: "/admin",
    failureRedirect: "/admin_signup",
    failureFlash: true
  })
);

//Log in Handles
router.get("/customer_login", (req, res) =>{ res.render("./customer_login"); });
router.post("/customer_login", 
  passport.authenticate("local-customer_login", {
    successRedirect: "./customer/index",
    failureRedirect: "/customer_login",
    failureFlash: true,
    successFlash: "welcome back!"
  }),
  function(req, res) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 1000 * 60 * 3;
    } else {
      req.session.cookie.expires = false;
    }
    res.redirect("./customer/index");
  }
);

router.get("/supplier_login", (req, res) =>{ res.render("./supplier_login"); });
router.post("/supplier_login", 
  supplierpassport.authenticate("local-supplier_login", {
    successRedirect: "./supplier/deliveries",
    failureRedirect: "/supplier_login",
    failureFlash: true,
    successFlash: "welcome back!"
  }),
  function(req, res) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 1000 * 60 * 3;
    } else {
      req.session.cookie.expires = false;
    }
    res.redirect("./supplier/deliveries");
  }
);

router.get("/cashier_login", (req, res) =>{ res.render("./cashier_login"); });
router.post("/cashier_login",
  cashierpassport.authenticate("local-cashier_login", {
    successRedirect: "./cashier/deliveries",
    failureRedirect: "/cashier_login",
    failureFlash: true,
    successFlash: "welcome back!"
  }),
  function(req, res) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 1000 * 60 * 3;
    } else {
      req.session.cookie.expires = false;
    }
    res.redirect("./cashier/deliveries");
  }
);

router.get("/admin", (req, res) =>{ res.render("./admin"); });
router.post("/admin_login",
  adminpassport.authenticate("local-admin_login", {
    successRedirect: "./admin/index",
    failureRedirect: "/admin",
    failureFlash: true,
    successFlash: "welcome back!"
  }),
  function(req, res) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 1000 * 60 * 3;
    } else {
      req.session.cookie.expires = false;
    }
    res.redirect("./admin/index");
  }
);

module.exports = router;
