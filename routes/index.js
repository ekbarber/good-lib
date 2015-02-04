var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GoodLib' });
});

router.get('/books', function(req, res, next) {
	req.models.Book.find(function(err, books){
		if(err){throw err;}
		res.render('books', { title: 'Books', books: books});		
	})
});
router.get(/^\/books\/(\w+)\/?$/, function(req, res, next) {
	console.log(req.params[0]);
	req.models.Book.findOne({_id:req.params[0]}, function(err, book){
		if(err){throw err;}
		res.render('book', {book:book})
	})
});

router.get('/libraries', function(req, res, next){
	req.models.Book.distinct('libraries.name',function(err,result){
		if(err){throw err;}
		res.render('libraries', {title:'Libaries', libraries:result});
	})
})

router.get(/^\/libraries\/(\w+)\/?$/, function(req, res, next){
	req.models.Book.find({'libraries.name':req.params[0]},function(err,result){
		if(err){throw err;}
		res.render('library', {title:req.params[0], books:result});
	})
})
module.exports = router;
