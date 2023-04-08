var express = require('express');
var app = express();
var querystring = require('querystring');

var products = require(__dirname + '/products.json'); // in current directory, get products.json and store it in memory in the server and use it in client requests for validating data and sharing product information between pages; loading json and displaying it in products

// Routing 

// allows server to share products data to any user that asks for it and allows server to control product data; server is database
app.get("/products_data.js", function (request, response, next) { // respond with js by giving var products = product data in memory and turns it into a json string and sends it back 
   response.type('.js'); // send response as javascript
   var products_str = `var products = ${JSON.stringify(products)}`; // string is executed and defines var products 
   response.send(products_str); // sends back string with all the javascript; respond.send has to send a string
});

// POST data can be decoded 
app.use(express.urlencoded({ extended: true }));

// monitor all requests; this manages what is output in the console for all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path); // In the console, display the method used to the path requested
   next();
});

// process purchase request (validate quantities, check quantity available)

// Get quantities from products_display.html and create invoice if valid
app.post('/process_purchase', function (request, response, next) {
   console.log(request.body);});

// route all other GET requests to files in public
app.use(express.static(__dirname + "/public"));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));