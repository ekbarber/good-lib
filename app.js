var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var goodreads = require('./lib/goodreads')
var models = require('./models');
var mongoose = require('mongoose');
var searchCatalog = require('./lib/search-catalog');

var routes = require('./routes/index');
var users = require('./routes/users');

var BOOK_UPDATE_INTERVAL = 10000; //10 seconds
var app = express();

mongoose.connect('mongodb://localhost/goodlib');

var _db = mongoose.connection;
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next){
    req.models = models;
    next();
})

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

_db.once('open',function(){
    console.log('connected to database')
   //updateBooks();
})


function updateBooks(callback){
    callback = callback || function(){};
    goodreads.getBooks(function(books){
        var bookInfo = books[0][0];
        models.Book.remove();
        books.forEach(function(bookInfo){
            bookInfo = bookInfo[0];
            console.log('checking %s', bookInfo.title[0]);
            
            models.Book.find({isbn:bookInfo.isbn[0]},function(err, results){
                if(err){throw err;}

                //If it doesn't exit, we'll create a new one
                if(results.length === 0){
                    console.log('%s doesnt exist, creating new', bookInfo.title[0])
                    var book = new models.Book({
                        title:bookInfo.title[0],
                        isbn:bookInfo.isbn[0],
                        libraries:catalogResults
                    });
                    book.save(function(err, book){
                        if(err){throw err;}
                        updateBookLibraries(book)
                        console.log("%s saved", book.title)
                    })  
                }else{
                    var book = results[0];
                    console.log("%s already in db", book.title)
                    updateBookLibraries(book);
                }
            })
        })
            
    });
}
function updateBookLibraries(book){
    console.log('searching catalog for %s', book.title);
    book.libraries = [];
    searchCatalog(book.isbn, function(catalogResults){
        console.log('found %s libraries for %s', catalogResults.length, book.title);
        catalogResults.forEach(function(libraryInfo){
            book.libraries.push(libraryInfo);
        });
        book.save(function(err, book){
            if(err){throw err;} 
        });
    })
}
module.exports = app;
