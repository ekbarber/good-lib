var http = require('http');
var url = require('url');
var htmlparser = require('htmlparser');
var soupselect = require('soupselect');

var catalogHost = 'find.minlib.net';
var searchPath = '/iii/mobile/record/C__Rb2732141__S'
var isbn = '1594488843';
var user_agent = 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36';

var _cookies = [];
var _defaultHeaders = {
	'User-Agent':user_agent
}

module.exports = function searchCatalog(isbn,callback){
	var requestOpt = {
		host:catalogHost,
		path:searchPath + isbn,
		headers:_defaultHeaders
	}

	sendReq(requestOpt,callback)
}
function sendReq(opt,callback){
	console.log('sending request to %s', opt.host + opt.path);

	var req = http.get(opt, function(res){
		var headers = res.headers;
		var html;
		if(headers['set-cookie']){
			for(var i = 0; i < headers['set-cookie'].length; i++){
				setCookie(headers['set-cookie'][i]);
			}
		}
		if(res.statusCode == '302' && res.headers.location){
			var parsedUrl = url.parse(res.headers.location,true);
			opt.host = parsedUrl.host;
			opt.path = parsedUrl.path;
			opt.headers['Cookie'] = _cookies.join(';');

			sendReq(opt,callback)
		}else{
			res.setEncoding('utf8');
			res.on('data',function(data){
				html += data;
			});
			res.on('end',function(){
				parseHtml(html,callback);
			})
		}
	})
}

function setCookie(cookie){
	var parsedCookie = cookie.slice(0, cookie.indexOf(';'));
	for(var j = 0; j < _cookies.length; j++){
		if(_cookies[j] == parsedCookie){
			return;
		}		
	}

	_cookies.push(parsedCookie);
}

function parseHtml(html,callback){
	var searchResult = [];
	var select = soupselect.select;
	var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err,dom){
		select(dom, 'table.itemTable td').forEach(function(el){
			var libFields = select(el, 'p');
			var library = {
				name:libFields[1].children[0].data.replace(/(.+)\/\w+$/,'$1'),
				section:libFields[1].children[0].data.replace(/.+\/(\w+)$/,'$1'),
				avail:(libFields[0].children[0].data == 'true'),
				callNum:libFields[2].children[0].data
			}
			searchResult.push(library);	
		});
		callback(searchResult);
	}));
	parser.parseComplete(html);

}