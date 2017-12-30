function authenticationMiddleware () {
    return function (req, res, next) {
      if (req.isAuthenticated()) {
        return next()
      }
      res.render('login')
    }
  }
  
module.exports = authenticationMiddleware