/*
Author: Monica Mau
Assignment 1
Date: 4/10/2023
Description: server.js file to run server 
 */

var express = require("express");
var app = express();
var products = require(__dirname + "/products.json");
var querystring = require("querystring");

// middleware, code based on lab 12 ex. 2c
app.use(express.urlencoded({ extended: true }));

// monitor all requests
app.all("*", function (request, response, next) {
	console.log(request.method + " to " + request.path);
	next();
});

// Routing
app.get("/products_data.js", function (request, response, next) {
	response.type(".js"); // send response as javascript
	var products_str = `var products = ${JSON.stringify(products)}`; // sets var products_str, converts JSON products array into string
	response.send(products_str); // sends response
});

// process purchase request (validate quantities, check quantity available) - assisted by Prof Port
app.post("/purchase", function (request, response, next) {
	// output the data in the request body (quantities) to the console
	console.log(request.body);
	// empty errors object
	var errors = {};
	// no quantities
	var hasQty = false;
	// has any input, valid or invalid
	var hasInput = false;
	// loop through all quantities
	for (let i in products) {
		// set var qty to the value of the quantity i in the request body
		var qty = request.body[`quantity${i}`];
		// qty is greater than zero
		if (qty > 0) {
			hasQty = true;
			hasInput = true;
		}
		// if nothing entered, then qty is 0
		if (qty == "") {
			qty = 0;
		}
		// check if quantity is a non neg integer, if so then fill errors object
		if (findNonNegInt(qty) == false) {
			errors[`quantity${i}_error`] = findNonNegInt(qty, true).join("<br>");
			hasInput = true;
		}
		// check if quantities are available
		if (qty > products[i].quantity_available) {
			errors[
				`quantity${i}_available_error`
			] = `We don't have ${qty} available!`;
			hasInput = true;
		}
	}

	// check if at least 1 item was selected (regardless of qty validity), if not then output message
	if (hasQty == false && hasInput == false) {
		errors[`noQty`] = `Please select some items to purchase!`;
	}

	// log contents of the errors object to the console
	console.log(errors);

	// if all quantities are valid, remove purchase from inventory, redirect to invoice and put quantities in query string
	if (Object.keys(errors).length === 0) {
		for (i in products) {
			// tracking the quantity available by subtracting purchased quantities
			products[i].quantity_available -= request.body[`quantity${i}`];
			// IR 1 - Tracking the total quantity of each item sold
			products[i].quantity_sold += Number(request.body[`quantity${i}`]);
		}
		response.redirect("./invoice.html?" + querystring.stringify(request.body));
	}
	// quantities are not valid, go back to order page and display error message
	else {
		// add errors object to request.body to put into the querystring
		request.body["errorsJSONstring"] = JSON.stringify(errors);
		// back to the order page and putting errors in the querystring
		response.redirect(
			"./products_display.html?" + querystring.stringify(request.body)
		);
	}
});

// function to find if a number is a non negative integer, and if not, output errors
function findNonNegInt(q, returnErrors = false) {
	//the function returns non-negative integers in the object.
	errors = []; // assume no errors at first
	if (Number(q) != q) errors.push("Not a number!"); // Check if string is a number value
	if (q < 0) errors.push("Negative value!"); // Check if it is non-negative
	if (parseInt(q) != q) errors.push("Not an integer!"); // Check that it is an integer

	return returnErrors ? errors : errors.length == 0;
}

// route all other GET requests to files in public
app.use(express.static(__dirname + "/public"));

// start server
app.listen(8000, () => console.log(`listening on port 8000`));
