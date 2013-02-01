
var express = require('express');

var app = express();

app.set('views', __dirname+'/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname+'/public'));

// serve static html client at /
app.get('/', function (req, res) {
  res.render('index', {title: 'home'});
});

app.get('/portfolio', function(req, res) {
	res.render('portfolio', {title: 'portfolio'});
});

app.listen(3000);

console.log('Trendinvesting running on port 3000');

