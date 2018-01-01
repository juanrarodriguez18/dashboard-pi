require('dotenv').config()

const pug = require('pug');
const path = require('path');
const http = require('http');
const express = require('express');
const passport = require('passport');  
const session = require('express-session'); 
const connect = require('connect');
const fs = require('fs');
var LocalStrategy = require('passport-local').Strategy;
const monitor = require('./monitor.js');
const app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//app.use(express.favicon(__dirname+'/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

require('./authentication').init(app);

app.use(passport.authenticationMiddleware(), function(req, res) {
  if (req.url.indexOf("/login") !== -1){
    res.render('login');
  }else{
    // Use res.sendfile, as it streams instead of reading the file into memory.
    res.sendfile(__dirname + '/app/index.html');
  }
});

app.get('/logout', passport.authenticationMiddleware(), function(req, res){
  req.session.destroy();
  req.logout();
  res.redirect('/');
});

app.get('/getLoggedUser', passport.authenticationMiddleware(), function(req, res){
  var loggedUser;
  loggedUser = {"id": req.user.id, "username": req.user.username};
  res.send(loggedUser);
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { console.log(err); return next(err) }
    if (!user) {
      // *** Display message using Express 3 locals
      console.log("No user")
      return res.render('login', {loginMessage: 'Username or password incorrect'});
    }
    req.logIn(user, function(err) {
      if (err) { console.log(err); return next(err); }
      console.log("Correct")
      return res.redirect('/');
    });
  })(req, res, next);
});

app.get('/', passport.authenticationMiddleware(), function (req, res) {
  res.render("dashboard")
});

app.get('/login', function (req, res) {
    res.render("login");
  });

app.get('/monitor', passport.authenticationMiddleware(), function (req, res) {
    fs.readFile(__dirname+'/index.html', function(err, data) {
		if (err) {
      //Si hay error, mandaremos un mensaje de error 500
			console.log(err);
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
});

appHttpServer = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

monitor.initMonitor(appHttpServer);

/*app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});*/