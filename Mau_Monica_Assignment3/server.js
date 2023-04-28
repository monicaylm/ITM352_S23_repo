/*
Authors: Monica Mau, Le Yi Feng Zheng, Brandon Ramos
Assignment 3
Date: 5/12/2023
Description: server.js file to run server, validates quantities, login information, and registration information 
 */

var express = require("express");
var app = express();
var products = require(__dirname + "/products.json");
var querystring = require("querystring");
var url = require("url");
var selected_qty = {};

// load file system interface
var fs = require("fs");
const { response } = require("express");

// code referenced from lab 13 fileio exercise 1a and 1b, set variable for the json file
var filename = __dirname + "/user_data.json";

if (fs.existsSync(filename)) {
	// read in user data （check that exists)
	var user_data_obj_JSON = fs.readFileSync(filename, "utf-8");

	// convert user data JSON to object
	var user_data = JSON.parse(user_data_obj_JSON);

	// if filename not found
} else {
	console.log(`Hey, I couldn't find ${filename}!`);
}

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
	
	//set variable for product_type
	var product_type = request.body["product_type"]
	// output the data in the request body (quantities) to the console
	console.log(request.body);
	// empty errors object
	var errors = {};
	// no quantities
	var hasQty = false;
	// has any input, valid or invalid
	var hasInput = false;
	// loop through all quantities
	for (i = 0; i < products[product_type].length; i++) {
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
		if (qty > products[product_type][i].quantity_available) {
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

	// if all quantities are valid, redirect to login page and put quantities, name, email in query string

	if (Object.keys(errors).length === 0) {
		selected_qty = request.body;
		response.redirect("./login.html?" + querystring.stringify(selected_qty));
	}
	// quantities are not valid, go back to order page and display error message
	else {
		// add errors object to request.body to put into the querystring
		request.body["errorsJSONstring"] = JSON.stringify(errors);
		
		// back to the order page and putting errors in the querystring
		for (key in products){
		response.redirect(
			`./products_display.html?product_type=${key}` + querystring.stringify(request.body)
		)}
	};
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

// process login, validate username and password
app.post("/login", function (request, response, next) {
	// output the data in the request body (quantities) to the console
	console.log(request.body);

	// empty errors object
	var errors = {};

	// set values for username and password, formats username as lowercase
	var username = request.body["username"].toLowerCase();
	var password = request.body["password"];

	// check if username field is blank
	if (username == "") {
		errors[`email_error`] = `Enter an email address!`;

		// check if username entered is a valid email address
	} else if (!/^[a-zA-Z0-9._]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(username)) {
		errors[`email_error`] = `${username} is an invalid email address!`;

		// check if username email is in user data
	} else if (user_data.hasOwnProperty(username) !== true) {
		errors[`username_error`] = `${username} is not a registered email!`;

		// check if password is blank
	} else if (password == "") {
		errors[`password_error`] = `Enter your password!`;

		// check to see if user's password matches password saved, entered
	} else if (password !== user_data[username].password) {
		errors[`password_error`] = `Password is incorrect!`;
	} else {
		var name = user_data[username].name;
	}

	// if all login is valid, redirect to invoice and put quantities, name, email in query string
	if (Object.keys(errors).length === 0) {
		for (i in products) {
			// tracking the quantity available by subtracting purchased quantities
			products[i].quantity_available -= selected_qty[`quantity${i}`];
			products[i].quantity_sold += Number(selected_qty[`quantity${i}`]);
		}

		let params = new URLSearchParams(selected_qty);
		params.append("username", username);
		params.append("name", name);
		response.redirect("./invoice.html?" + params.toString());
	}
	// login is not valid, go back to login page and display error message
	else {
		// add errors object to request.body to put into the querystring
		//request.body["errorsJSONstring"] = JSON.stringify(errors);
		let params = new URLSearchParams();
		params.append("username", username);
		params.append("name", name);
		params.append("errorsJSONstring", JSON.stringify(errors));
		response.redirect("./login.html?" + params.toString());

		// back to the order page and putting errors in the querystring
		//response.redirect("./login.html?" + querystring.stringify(errors));
	}
});

// referenced from assignment 2 code examples on class website

// post registration page, referenced from assignment 2 workshop code
app.post("/register", function (request, response, next) {
	// set variables as the input field values in the request body
	var username = request.body["username"].toLowerCase();
	var password = request.body["password"];
	var repeatpassword = request.body["repeatpassword"];
	var name = request.body["name"];

	// empty errors object
	var errors = {};

	// empty arrays for input fields errors
	errors["username"] = [];
	errors["name"] = [];
	errors["password"] = [];
	errors["repeatpassword"] = [];

	// -------------------- USERNAME/EMAIL ERROR VALIDATION -------------------- //

	// username field is blank
	if (username == "") {
		errors["username"].push(`Enter an email address!`);

		// not a valid email address (regex referenced from ChatGPT)
	} else if (!/^[a-zA-Z0-9._]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(username)) {
		errors["username"].push(`Enter a valid email address!`);

		// email address is already registered
	} else if (typeof user_data[username] != "undefined") {
		errors["username"].push(
			`${username} is already registered! Please enter a different email address.`
		);
	}

	// -------------------- NAME ERROR VALIDATION -------------------- //

	// name field is blank
	if (name == "") {
		errors["name"].push(`Enter a name!`);

		// name does not include both first and last (regex referenced from ChatGPT)
	} else if (!/^[a-zA-Z]+\s+[a-zA-Z]+$/.test(name)) {
		errors["name"].push(`Enter first and last name!`);

		// name length is greater than 30 characters or less than 2
	} else if (name.length > 30 || name.length < 2) {
		errors["name"].push(
			`Enter a name greater than 2 characters and less than 30 characters.`
		);
	}

	// -------------------- PASSWORD ERROR VALIDATION -------------------- //

	// password field is blank
	if (password == "") {
		errors["password"].push(`Please create a password!`);

		// password contains spaces, (regex referenced from ChatGPT)
	} else if (!/^\S+$/.test(password)) {
		errors["password"].push(`Password must not contain spaces!`);

		// IR2 Require that passwords have at least one number and one special character. (regex referenced from ChatGPT)
	} else if (!/^(?=.*\d)(?=.*\W).+$/.test(password)) {
		errors["password"].push(
			`Password must contain at least one letter, one number, and one special character!`
		);

		// repeat password is blank
	} else if (repeatpassword == "") {
		errors["repeatpassword"].push(`Please retype your password!`);

		// passwords do not match
	} else if (password !== repeatpassword) {
		errors["repeatpassword"].push(`Passwords do not match!`);
	}

	// password length is more than 1 but less than 10 characters
	if ((password.length < 10 && password.length >= 1) || password.length > 16) {
		errors["password"].push(
			`Password length must be between 10 and 16 characters!`
		);
	}

	// -------------------- NO ERRORS -------------------- //
	// if there are no errors with registration info, go to invoice and send all info to querystring

	var totalLength = 0;

	for (var prop in errors) {
		totalLength += errors[prop].length;
	}

	if (totalLength === 0) {
		for (i in products) {
			// tracking the quantity available by subtracting purchased quantities, only once you get to the invoice
			products[i].quantity_available -= selected_qty[`quantity${i}`];
			products[i].quantity_sold += Number(selected_qty[`quantity${i}`]);
		}

		// write updated data to filename (user_data.json)
		user_data[username] = {};
		user_data[username].name = request.body.name;
		user_data[username].password = request.body.password;
		fs.writeFileSync(filename, JSON.stringify(user_data));

		let params = new URLSearchParams(selected_qty);
		params.append("username", username);
		params.append("name", name);
		response.redirect("./invoice.html?" + params.toString());

		return;
		// if there are errors, put them in the jsonstring and return to the registration page
	} else {
		let params = new URLSearchParams();
		params.append("username", username);
		params.append("name", name);
		params.append("errorsJSONstring", JSON.stringify(errors));
		response.redirect("./registration.html?" + params.toString());
	}
});

// route all other GET requests to files in public
app.use(express.static(__dirname + "/public"));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
