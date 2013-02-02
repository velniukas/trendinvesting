
var express = require('express'),
	mongoose = require('mongoose');
	
var app = express();
mongoose.connect('localhost', 'trendinvesting');

app.set('views', __dirname+'/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname+'/public'));

// serve static html client at /
app.get('/', function (req, res) {
  res.render('main', {title: 'home'});
});

app.get('/funds', function(req, res) {
	res.render('funds/portfolio', {title: 'portfolio'});
});

app.get('/categories', function(req, res) {
	res.render('funds/category', {title: 'category'});
});

app.listen(3000);

console.log('Trendinvesting running on port 3000');

