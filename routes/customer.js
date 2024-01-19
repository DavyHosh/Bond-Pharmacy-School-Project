const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const fs = require('fs');
var path = require("path");
var multer = require("multer");
const passport = require("passport");
var Sequelize = require("sequelize");
require("../config/customerpassport")(passport);

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
    console.log("Customer Database connected");
  } else {
    console.log(err);
  }
});

router.get("/customer/index", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM products";
  let query = myconnection.query(sql, (err, product) => {
    if (err) throw err;
    res.render("./customer/index", { allProducts: product});
  });
});

router.get("/customer/shop", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM products";
  let query = myconnection.query(sql, (err, product) => {
    if (err) throw err;
    res.render("./customer/shop", { allProducts: product});
  });
});

router.get("/customer/:id/product", ensureAuthenticated, (req, res) => {
  const productId = req.params.id;

  let sql = "SELECT * FROM products WHERE id = ?";
  myconnection.query(sql,[productId], (err, result, fields) => {
    if(err) throw err;
        res.render("./customer/shop-single", { product: result[0] });
  });
});

router.get("/customer/about", ensureAuthenticated, (req, res) => {
  res.render("./customer/about");
});

router.get("/customer/(:id)/cart", ensureAuthenticated, (req, res) =>  {
  let productId = req.params.id;
  let userId = req.session.user_id;

  let sql = "SELECT * FROM products WHERE id = ?";
  myconnection.query(sql,[productId], (err, result) => {
    if(err) throw err;
    myconnection.query("SELECT * FROM cart WHERE productId = ? AND userId = ?",[productId, userId], (err, rows) => {
      if(err) throw err;
      if (rows.length) {
        console.log('product exists!');
        res.redirect("/customer/shop");
      } else {
        let sql2 = "INSERT INTO cart (filename, title, price, description, userId, productId) VALUES(?, ?, ?, ?, ?, (SELECT id FROM products WHERE id = ?))";
        let query2 = myconnection.query(sql2, [result[0].filename, result[0].title, result[0].price, result[0].description, userId, productId], (err, results) => {
            if (err) throw err;
            res.redirect("/customer/cart");
        });
      }
    });
  });
});

router.get("/customer/cart", ensureAuthenticated, (req, res) => {
  let userId = req.session.user_id
  let sql = "SELECT * FROM cart WHERE userId = ?";
  let sql2 = "SELECT * FROM cart WHERE userId = ?";
  let query = myconnection.query(sql, [userId], (err, product) => {
    let query = myconnection.query(sql2,[userId], (err, total) => {
      if (err) throw err;
      res.render("./customer/cart", {userId: userId, total: total, allCart: product});
    });
  });
});

router.get("/customer/:id/cart/delete", ensureAuthenticated, (req, res) => {
  var cartId = req.params.id;
    myconnection.query("SELECT * FROM cart WHERE id = ?",[cartId],(err, rows, fields) => {
      if (!err) {
          if (err) throw err;
          let sql = "DELETE FROM cart WHERE id = ?";
          myconnection.query(sql,[cartId], (err, result) => {
            if (err) throw err;
            res.redirect("/customer/cart");
          });
      }
    }
  );
});

router.get("/customer/checkout", ensureAuthenticated, (req, res) => {
  let userId = req.session.user_id;
  let sql = "SELECT * FROM customers WHERE id = ?";
  let sql2 = "SELECT * FROM cart WHERE userId = ?";
  let sql3 = "SELECT * FROM cart WHERE userId = ?";
  let sql4 = "SELECT SUM(price) AS 'subTotal' FROM cart WHERE userId = ?";
  let query = myconnection.query(sql,[userId], (err, user) => {
    if (err) throw err;
    let query = myconnection.query(sql2,[userId], (err, product) => {
      if (err) throw err;
      var subTotal = product.reduce(function(sum, item){
        sum = sum + item.price;
        return sum;
      }, 0);
      let query = myconnection.query(sql3,[userId], (err, total) => {
        if (err) throw err;
        let query = myconnection.query(sql4,[userId], (err, checkout) => {
          var sum = Object.values(JSON.parse(JSON.stringify(checkout)))
          if (err) throw err;
          console.log(sum[0].subTotal)
          res.render("./customer/checkout", {user: user[0], allCart: product, subTotal: subTotal, sum: sum[0].subTotal,userId: userId, total: total});
        });
      });
    });
  });
});

router.get("/customer/:id/place_order", ensureAuthenticated, (req, res) => {
  let productId = req.params.id;
  let userId = req.session.user_id;
  let fname = req.session.fname;
  let lname = req.session.lname;
  let status = "null";

  let sql = "SELECT * FROM products WHERE id = ?";
  myconnection.query(sql,[productId], (err, result) => {
    if(err) throw err;
    myconnection.query("SELECT * FROM orders WHERE productId = ? AND userId = ?",[productId, userId], (err, rows) => {
      if(err) throw err;
      if (rows.length) {
        console.log('product exists!');
        res.redirect("/customer/shop");
      } else {
        let sql2 = "INSERT INTO orders (fname, lname, title, amount, filename, date, status, userId, productId) VALUES(?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM products WHERE id = ?))";
        myconnection.query(sql2, [fname, lname, result[0].title, result[0].price, result[0].filename, result[0].date, status, userId, productId], (err, results) => {
            if (err) throw err;
            res.redirect("/customer/orders");
        });
      }
    });
  });
});

router.get("/customer/orders", ensureAuthenticated, (req, res) => {
  let userId = req.session.user_id;

  let sql = "SELECT * FROM orders WHERE userId = ?";
  myconnection.query(sql,[userId], (err, order, fields) => {
    if(err) throw err;
        res.render("./customer/orders", { allOrders: order });
  });
});

router.get("/customer/:id/receipt", ensureAuthenticated, (req, res) => {
  const orderId = req.params.id;

  let sql = "SELECT * FROM orders WHERE id = ?";
  myconnection.query(sql,[orderId], (err, result, fields) => {
    if(err) throw err;
        res.render("./customer/receipt", { order: result[0] });
  });
});

router.get("/customer/contact", ensureAuthenticated, (req, res) => {
  res.render("./customer/contact");
});

router.post("/customer/contact", ensureAuthenticated, (req, res) => {
  res.redirect("/customer/contact");
});

//logout Handle
router.get("/customer_logout", ensureAuthenticated, (req, res) => {
  req.logout();
  req.flash("success", "you've been successfully logged out!");
  res.redirect("/");
});

module.exports = router;
