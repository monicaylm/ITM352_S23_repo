var express = require('express');
var app = express();

var products = require(__dirname + '/products.json');
console.log(products);

app.use(express.urlencoded({extended: true}));

app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + ' with qs ' + JSON.stringify(request.query));
    next();
});

app.get('./products_js', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + ' with qs ' + JSON.stringify(request.query));
    next();
});

app.post('/process_purchase', function (request, response, next){
    console.log(request.body);
    perf
    response.send('POST to process_purchase');;
});


app.use(express.static(__dirname + '/public')); 
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback
