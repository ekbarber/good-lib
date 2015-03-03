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

var last_update_time = 0;
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
app.use(function(req, res, next){
    console.log('last updated at: %s', last_update_time);
    if(last_update_time === 0 || (new Date().getTime() - last_update_time) > 120000){
        updateBooks();
        last_update_time = new Date().getTime()
    }
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
   console.log('connected to databases')
   //updateBooks();
})


function updateBooks(callback){
    callback = callback || function(){};
    console.log('Updating books')
    goodreads.getBooks(function(books){
        models.Book.remove(function(){
            console.log("Clearing all books");
            books.forEach(function(bookInfo){
                console.log('checking %s', bookInfo.title[0]);
                var book = new models.Book({
                    title:bookInfo.title[0],
                    isbn:bookInfo.isbn[0],
                    isbn13:bookInfo.isbn13[0]
                });
                book.save(function(err, book){
                    if(err){throw err;}
                    updateBookLibraries(book)
                    console.log("%s saved", book.title)
                })
            })
        });
    });
}
function updateBookLibraries(book){
    //console.log(book);
    console.log('searching catalog for %s, [%s]', book.title,book.isbn13);
    book.libraries = [];
    searchCatalog(book.isbn13, function(catalogResults){
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
