var express = require('express');
var router = express.Router();
var search = require('../lib/search-catalog');
var goodreads = require('../lib/goodreads')

/* GET home page. */
router.get('/', function(req, res, next) {
	//search('1594488843')
	goodreads.getBooks(function(books){
		console.log(books);
	});
  res.render('index', { title: 'Express' });
});

module.exports = router;
