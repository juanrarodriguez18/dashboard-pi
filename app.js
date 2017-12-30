const pug = require('pug');
const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Set views path
app.set('views', path.join(__dirname, 'views'));
// Set public path
app.use(express.static(path.join(__dirname, 'views')));

//Pug pages rendering
app.set("view engine", "pug");

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/login', function (req, res) {
    res.render("login");
  });

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});