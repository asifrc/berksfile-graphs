var express = require('express');
var http = require('http');
var path = require('path');

var liner = require('./lib/LineStream.js')
var parser = require('./lib/GraphStream.js');
var s3upload = require('./lib/S3UploadStream.js');

var app = express();
app.set('views', path.join(__dirname, 'res', 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;
app.use(express.static(path.join(__dirname, 'res', 'public')));

app.get('/', function(req, res) {
    res.render('index')
});
app.get('/grph', function(req, res) {
    res.render('graph')
})

app.post('/transform', function(req, res){
    var key;
    req.pipe(new liner({ objectMode: true } ))
       .pipe(new parser({ objectMode: true } ))
       .pipe(new s3upload( ))
       .on('s3uploadkey', function(key) {  res.redirect('/grph?' + (new Date).getTime() + '#' + key); })
       .on('error', function () { res.status(501).send('err during parsing') })
       .on('finish', function () {  /* see above */  });
    ;
});
app.get('/grph/:filename', function(req, res) {
    var s3 = new AWS.S3();
    var params = {Bucket: S3_BUCKET, Key: req.params.filename};
    s3.getObject(params).createReadStream()
        .pipe(res)
        .on('err', function() { res.status(501).send('err during download') })
        .on('finish', function () { res.status(200) });
})

module.exports = app;
