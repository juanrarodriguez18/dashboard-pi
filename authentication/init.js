require('dotenv').config()

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const authenticationMiddleware = require('./middleware')
const md5 = require('md5')

function findUser (username, callback) {

  const user = {"id": 1, "username": process.env.USERNAME, "password": process.env.PASSWORD};

  if (username === user.username) {
    return callback(null, user)
  }
  return callback(null)
}

passport.serializeUser(function (user, cb) {
  cb(null, user.username)
})

passport.deserializeUser(function (username, cb) {
  findUser(username, cb)
})

function initPassport () {
  passport.use(new LocalStrategy(
    function(username, password, done) {
      findUser(username, function (err, user) {
        if (err) {
          return done(err)
        }
        if (!user) {
          return done(null, false)
        }
        if (md5(password) !== md5(user.password)) {
          return done(null, false)
        }
        return done(null, user)
      })
    }
  ))

  passport.authenticationMiddleware = authenticationMiddleware
}

module.exports = initPassport