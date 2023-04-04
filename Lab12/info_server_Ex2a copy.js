var express = require('express');
var app = express();

app.all('*', function (request, response, next) {
    response.send(request.method + ' to path ' + request.path + ' with qs ' + JSON.stringify(request.query));
    next();
});

app.get('/test', function (request, response, next){
    response.send('GET to test');;
});


app.use(express.static(__dirname + '/public')); 
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback
