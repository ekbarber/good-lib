var request = require('request');
var xml2js = require('xml2js');
module.exports = (function goodreads (){
	var _userId = 16169391;
	var _ApiKey = 'KFwxZN0GKIr4M0rbiWGTg';
	var _urlEndpoint = 'http://goodreads.com/review/list/' + _userId + '?shelf=to-read&v=2&key=' + _ApiKey;

	return {
		getBooks:function(callback){
			request.get(_urlEndpoint,function(err,res,body){
				console.log('GET ' + _urlEndpoint + '?v=2&key=' + _ApiKey + ' : %s', res.statusCode);
				xml2js.parseString(body, function(err,result){
					var books = [];
					result.GoodreadsResponse.reviews[0].review.forEach(function(book){
						books.push(book.book);
					});
					callback(books);
				})
			})			
		}
	}
}())