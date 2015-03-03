var http = require('http');
var url = require('url');
var htmlparser = require('htmlparser');
var soupselect = require('soupselect');

var catalogHost = 'find.minlib.net';
var searchPath = '/iii/encore/search/C__S';
var isResultRegEx = /\/encore\/record\//;
var user_agent = 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36';
var fs = require('fs');
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
	//console.log('sending request to %s\n\n', opt.host + opt.path);

	var req = http.get(opt, function(res){
		var headers = res.headers;
		var html;

		if(headers['set-cookie']){
			for(var i = 0; i < headers['set-cookie'].length; i++){
				setCookie(headers['set-cookie'][i]);
			}
		}
		if(res.statusCode != '200'){
			console.log('resonse code: %s', res.statusCode)	
		}
		
		if(res.statusCode == '302' && res.headers.location){
			console.log('redirect to %s', res.headers.location);
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
				if(opt.path.match(isResultRegEx)){
					console.log('result!');
					//console.log(html)
					parseResult(html, callback);
				}else{
					console.log('search');
					parseSearch(html, callback);
				}
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
function parseSearch(html, callback){
	fs.writeFile("D:/search-"+new Date().getTime()+".html", html);

	var select = soupselect.select;
	var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err,dom){
		select(dom, 'a#recordDisplayLink2Component').forEach(function(el){
			if(el.name == 'a'){
				var path = el.attribs.href;	
				var requestOpt = {
					host:catalogHost,
					path:path,
					headers:_defaultHeaders
				};
				sendReq(requestOpt, callback);
			}else{
				console.log('not a link, something weird happened')
			}
		})
	}));
	parser.parseComplete(html);
}
function parseResult(html,callback){	
	var searchResult = [];
	var select = soupselect.select;
	var parser = new htmlparser.Parser(new htmlparser.DefaultHandler(function(err,dom){
		select(dom, 'table.itemTable tr').forEach(function(el){
			
			var libFields = select(el, 'td');
			//the first row only has th, so it will throw an error
			if(libFields.length >= 3){
				var library = {};
				var nameSection = select(libFields[0], 'a');
				if(nameSection.length === 0){
					console.log('HTML PARSE ERROR - couldnt find name and section');
				}else{
					library.name = nameSection[0].children[0].data.replace(/[\s]*(.+)\/.+[\s]*$/,'$1');
					library.section = nameSection[0].children[0].data.replace(/[\s]*.+\/(.+)[\s]*$/,'$1');
				}

				var callNum = select(libFields[1], 'a');
				if(callNum.length === 0){
					console.log('HTML PARSE ERROR - couldnt find callnum');
				}else{
					library.callNum = callNum[0].children[0].data.replace(/[\s]*(.+)[\s]*$/, '$1');
				}

				library.avail = !!(libFields[2].children[0].data.match(/AVAILABLE/))
			
				console.log(library);
				
				searchResult.push(library);	
			}
		});
		callback(searchResult);
	}));
	parser.parseComplete(html);
	

}