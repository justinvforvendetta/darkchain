var async = require('async');
var fs = require('fs');
var request = require('request');
var express = require('express'),
    app = express(),
    doT = require('dot'),
    pub = __dirname + '/public',
    view =  __dirname + '/views';
    
var defs = {
    loadfile:function(path){return fs.readFileSync(__dirname + path, 'utf8');},
    savefile:function(path, data){return fs.writeFileSync(__dirname + path, data, 'utf8');},
    static: false,
};

doT.templateSettings.strip = false;

function generateTemplate(input, output, defs) {
  var template = doT.template(fs.readFileSync(__dirname + '/views/' + input, 'utf8'), null, defs);
  fs.writeFileSync(__dirname + '/views/' + output, template.toString());
}

// Generate dynamic website templates
generateTemplate('livetx.html', 'livetx.js', defs);
generateTemplate('liveblock.html', 'liveblock.js', defs);

// Include router.js content
eval(fs.readFileSync(__dirname + '/views/router.js') + '');

var engines = require('consolidate');

app.set('views', view);
app.set('view options', {layout: false});
app.set("view engine", "html");
app.engine('.html', engines.dot);

app.use('/static', express.static(__dirname + '/static'));

var query_api = function(request,cb){
     var payload = {'method': request['method'], 'id': 1, 'jsonrpc': 1, 'params': request['params']};
     request.post({ url: 'http://bkchain.org/api/raw/' + request['currency'], body: JSON.stringify(payload) }, function(err,response,body){
           if (err){
                 cb(err);
           } else {
                 cb(null, JSON.parse(body)); // First param indicates error, null=> no error
           }
     });
};

// Page selector
app.get(/^(.*)$/, function(req, res) {
    var data = { _def: defs, layout: false, strip: false, title_details: 'bkchain.org', script_name_base: '', source_base: '' };
    var url = req.params[0];
    var url_parts = url.split('/').filter(function(e){return e});
    
    // Defer routing to shared client/server url parser system
    route_url(data, '/', url_parts, function(request_type, data) { res.render(request_type + '.html', data); });
});

// Start server
var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});