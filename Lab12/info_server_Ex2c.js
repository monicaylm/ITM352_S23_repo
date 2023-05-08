var express = require('express');
var app = express();
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + ' with qs ' + JSON.stringify(request.query));
    next();
});
app.use(express.static(__dirname + '/public'));
app.listen(8180, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback