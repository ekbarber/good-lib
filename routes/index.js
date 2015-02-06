var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Find some books!' });
});

router.get('/books', function(req, res, next) {
	req.models.Book.find(function(err, books){
		if(err){throw err;}
		res.render('books', { title: 'Books', books: books});		
	})
});
router.get(/^\/books\/(\w+)\/?$/, function(req, res, next) {

	req.models.Book.findOne({_id:req.params[0]}, function(err, book){
		if(err){throw err;}
		res.render('book', {book:book})
	})
});

router.get('/libraries', function(req, res, next){
	console.log(req.cookies);
	var recentLib;
	if(req.cookies && req.cookies.recentLib){
		 recentLib = req.cookies.recentLib;
	}else{
		recentLib = ''
	}
	req.models.Book.distinct('libraries.name',function(err,result){
		if(err){throw err;}
		res.render('libraries', {title:'Libaries', libraries:result,recentLib:recentLib});
	})
})

router.get(/^\/libraries\/(\w+)\/?$/, function(req, res, next){
	var library ={
		name: req.params[0]
	};
	
	res.header('Set-Cookie','recentLib='+library.name);
	req.models.Book.find({'libraries.name':library.name},function(err,result){
		if(err){throw err;}
		result.forEach(function(book){
			book.libraries.forEach(function(bookLibrary){
				if(bookLibrary.name == library.name){
					book.thisLibrary = bookLibrary;
				}
			});
		});
		res.render('library', {title:library.name, books:result});
	})
})
module.exports = router;
