var mongoose = require('mongoose');

var _librarySchema = mongoose.Schema({
	name: String,
	section:String,
	avail:Boolean,
	callNum:String
});

var _bookSchema = mongoose.Schema({
	title: String,
	isbn: String,
	isbn13: String,
	lastUpdated: {type:Date,default: Date.now},
	libraries:[_librarySchema]
});

module.exports = {
	Book: mongoose.model('Book', _bookSchema),
	Library: mongoose.model('Library', _librarySchema),
}