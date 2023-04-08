var express = require('express');
var app = express();
var products = require(__dirname + '/products.json');
var querystring = require('querystring');

// Routing 

app.get("/products_data.js", function (request, response, next) { // respond with js by giving var products = product data in memory and turns it into a json string and sends it back 
    response.type('.js'); // send response as javascript
    var products_str = `var products = ${JSON.stringify(products)}`; // sets var products_str, converts JSON products array into string
    response.send(products_str); // sends response 
 });

app.use(express.urlencoded({ extended: true }));

// monitor all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// process purchase request (validate quantities, check quantity available)
// 
app.post('/purchase', function (request, response, next){
    response.redirect('./invoice.html?' + querystring.stringify(request.body));
});

function findNonNegInt(q, returnErrors = false){ //the function returns non-negative integers in the object.
    errors = []; // assume no errors at first
    if(Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    if(q < 0) errors.push('Negative value!'); // Check if it is non-negative
    if(parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer

    return returnErrors ? errors : (errors.length == 0);
      }



// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));


