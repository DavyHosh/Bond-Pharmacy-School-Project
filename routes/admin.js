const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const fs = require('fs');
var path = require("path");
var multer = require("multer");
var Sequelize = require("sequelize");
const cashierpassport = require("passport");
require("../config/cashierpassport")(cashierpassport);

const adminpassport = require("passport");
require("../config/adminpassport")(adminpassport);

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
    console.log("Admin Database connected");
  } else {
    console.log("Admin db unable to connect");
  }
});

router.get("/admin/index", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM products";
  let query = myconnection.query(sql, (err, product) => {
    if (err) throw err;
    res.render("./admin/index", { allProducts: product});
  });
});

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + file.originalname)
  }
});

var upload = multer({ storage: storage });

router.get("/admin/add_product", ensureAuthenticated, (req, res) => {
  res.render("./admin/add_product");
});

router.post("/admin/add_product", ensureAuthenticated, upload.single('myProduct'), (req, res) => {
  var newData = {
    title: req.body.title,
    price: req.body.price,
    description: req.body.description,
    filename: req.file.filename
  };
  
  let sql = "INSERT INTO products SET ?";
  let query = myconnection.query(sql, newData, (err, results) => {
    if (err) throw err;
    res.redirect("/admin/products");
  });
});

router.get("/admin/products", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM products";
  let query = myconnection.query(sql, (err, product) => {
    if (err) throw err;
    res.render("./admin/products", { allProducts: product});
  });
});

router.get("/admin/:id/edit_product", ensureAuthenticated, (req, res) => {
  const productId = req.params.id;

  let sql = "SELECT * FROM products WHERE id = ?";
  myconnection.query(sql,[productId], (err, result, fields) => {
    if(err) throw err;
        res.render("./admin/edit_product", { product: result[0] });
  });
});

router.post("/admin/:id/edit_product", ensureAuthenticated, (req, res) => {
  const productId = req.params.id;

  let title = req.body.title;
  let price = req.body.price;
  let description = req.body.description;
  let sql = "UPDATE `products` SET `title` = '" + title + "', `price` = '" + price + "', `description` = '" + description + "' WHERE `products`.`id` = '" + productId + "'";
  myconnection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.redirect("/admin/products");
  });
});

router.get("/admin/:id/delete_product", ensureAuthenticated, (req, res) => {
  var productId = req.params.id;
  let sql = 'DELETE FROM products WHERE id = ?';
  myconnection.query(sql,[productId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/products");
  });
});

// company purchases
router.get("/admin/new_products", ensureAuthenticated, (req, res) => {
  res.render("./admin/new_products");
});
// company purchases
router.post("/admin/approve", ensureAuthenticated, (req, res) => {
  res.render("./admin/approve");
});

// company purchases
router.get("/admin/purchases", ensureAuthenticated, (req, res) => {
  res.render("./admin/purchases");
});

// company sales to customers
router.get("/admin/sales", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM orders WHERE status = 'accepted' ORDER BY id DESC";
  let query = myconnection.query(sql, (err, sale) => {
    if (err) throw err;
    res.render("./admin/sales", { allSales: sale });
  });
});

router.get("/admin/:id/delete_sale", ensureAuthenticated, (req, res) => {
  var saleId = req.params.id;
  let sql = 'DELETE FROM orders WHERE id = ?';
  myconnection.query(sql,[saleId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/sales");
  });
});

// company products stock
router.get("/admin/inventory", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM deliveries WHERE status = 'accepted' ORDER BY id DESC";
  let query = myconnection.query(sql, (err, sale) => {
    if (err) throw err;
    res.render("./admin/inventory", { allSales: sale });
  });
});

router.get("/admin/:id/delete_delivery", ensureAuthenticated, (req, res) => {
  var deliveryId = req.params.id;
  let sql = 'DELETE FROM deliveries WHERE id = ?';
  myconnection.query(sql,[deliveryId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/inventory");
  });
});

// all users
router.get("/admin/users", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM customers";
  let sql2 = "SELECT * FROM suppliers";
  let sql3 = "SELECT * FROM cashiers";
  let query = myconnection.query(sql, (err, customer) => {
    if (err) throw err;
    let query = myconnection.query(sql2, (err, supplier) => {
      if (err) throw err;
      let query = myconnection.query(sql3, (err, cashier) => {
        if (err) throw err;
        res.render("./admin/users", { allCustomers: customer, allSuppliers : supplier, allCashiers : cashier });
      });
    });
  });
});

// user details
router.get("/admin/:id/delete_customer", ensureAuthenticated, (req, res) => {
  var customerId = req.params.id;
  let sql = 'DELETE FROM customers WHERE id = ?';
  myconnection.query(sql,[customerId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/users");
  });
});

router.get("/admin/:id/delete_supplier", ensureAuthenticated, (req, res) => {
  var supplierId = req.params.id;
  let sql = 'DELETE FROM suppliers WHERE id = ?';
  myconnection.query(sql,[supplierId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/users");
  });
});

router.get("/admin/:id/delete_cashier", ensureAuthenticated, (req, res) => {
  var cashierId = req.params.id;
  let sql = 'DELETE FROM cashiers WHERE id = ?';
  myconnection.query(sql,[cashierId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/users");
  });
});


// Add Cashier
router.get("/admin/add_cashier", ensureAuthenticated, (req, res) => {
  res.render("./admin/add_cashier",);
});

router.post(
  "/admin/add_cashier",
  cashierpassport.authenticate("local-cashier_signup", {
    successRedirect: "/admin/users",
    failureRedirect: "/admin/add_cashier",
    failureFlash: true
  })
);

// router.get("/admin/edit_cashier", (req, res) => {
//   res.render("./admin/edit_cashier",);
// });

// router.get("/admin/delete_cashier", (req, res) => {
//   res.render("./admin/delete_cashier",);
// });

router.get("/admin/support", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM contact";
  let query = myconnection.query(sql, (err, message) => {
    if (err) throw err;
    res.render("./admin/support", { allMessages: message});
  });
});

router.get("/admin/:id/delete_message", ensureAuthenticated, (req, res) => {
  var messageId = req.params.id;
  let sql = 'DELETE FROM contact WHERE id = ?';
  myconnection.query(sql,[messageId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/support");
  });
});

//logout Handle
router.get("/admin_logout", ensureAuthenticated, (req, res) => {
  req.logout();
  req.flash("success", "you've been successfully logged out!");
  res.redirect("/admin");
});


module.exports = router;

