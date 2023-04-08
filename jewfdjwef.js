var express = require("express");
var app = express();
var products_array = require(__dirname + "/products.json");

// Routing

// allows server to share products data to any user that asks for it and allows server to control product data; server is database
app.get("/products_data.js", function (request, response, next) {
	// respond with js by giving var products = product data in memory and turns it into a json string and sends it back
	response.type(".js"); // send response as javascript
	var products_str = `var products = ${JSON.stringify(products)}`; // string is executed and defines var products
	response.send(products_str); // sends back string with all the javascript; respond.send has to send a string
}); 

app.use(express.urlencoded({ extended: true }));

// monitor all requests
app.all("*", function (request, response, next) {
	console.log(request.method + " to " + request.path);
	next();
});

// process purchase request (validate quantities, check quantity available)

// <** your code here ***>

app.post('/process_purchase', function (request, response, next) {
    console.log(request.body);
})

// route all other GET requests to files in public
app.use(express.static(__dirname + "/public"));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));

