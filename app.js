var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var articlesRouter = require('./routes/articles');
var usersRouter = require('./routes/users');
var feedbackRouter = require('./routes/feedback');
var commentRouter = require('./routes/comments');

var app = express();

const port = 4000;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, function(){
  console.log(`Listening on port ${port}`);
})

app.use(function(req, res, next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,PUT,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type, X-Auth-Token, content-type");
  next();
})

const urlPrefix = '/api';

app.use(urlPrefix, articlesRouter);
app.use(urlPrefix, usersRouter);
app.use(urlPrefix, feedbackRouter);
app.use(urlPrefix, commentRouter);

module.exports = app;
