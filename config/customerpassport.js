var LocalStrategy = require("passport-local").Strategy;

var mysql = require("mysql");
var bcrypt = require("bcrypt-nodejs");


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
    console.log("passport db connected");
  } else {
    console.log("passport db unable to connect");
  }
});

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    myconnection.query("SELECT * FROM customers WHERE id = ? ", [id], function(
      err,
      rows
    ) {
      done(err, rows[0]);
    });
  });

  passport.use(
    "local-customer_signup",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
      },
      function(req, username, password, done) {
        myconnection.query("SELECT * FROM customers WHERE username = ? ", [username], function(err, rows) {
            if (err) return done(err);
            if (rows.length) {
              return done(
                null,
                false,
                console.log('not taken'),
                req.flash("signupMessage", "That is already taken")
              );
            } else {
              var newUserMysql = {
                fname : req.body.fname,
                lname : req.body.lname,
                phone : req.body.phone,
                username: username,
                password: bcrypt.hashSync(password, null, null)
              };

              var insertQuery =
                "INSERT INTO customers SET ?";

              myconnection.query( insertQuery, newUserMysql, function(err, rows) {
                  if(err) console.log(err);
                  newUserMysql.id = rows.insertId;

                  return done(null, newUserMysql);
                }
              );
            }
          }
        );
      }
    )
  );

  passport.use(
    "local-customer_login",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
      },
      function(req, username, password, done) {
        myconnection.query("SELECT * FROM customers WHERE username = ? ", [username], function(err, rows) {
            if (err) return done(err);
            if (!rows.length) {
              return done( null, false, req.flash("loginMessage", "No User Found"));
            }
            if (rows.length) {
              var user = rows[0]
              req.session.username = user.username;
              req.session.fname = user.fname;
              req.session.lname = user.lname;
              req.session.user_id = user.id
              return done(null, rows[0]);
            }
            if (!bcrypt.compareSync(password, rows[0].password))
              return done(
                null,
                false,
                req.flash("loginMessage", "Wrong Password")
            );
          }
        );
      }
    )
  );
};