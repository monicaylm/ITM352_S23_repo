/*
Author: Monica Mau
Assignment 2
Date: 4/19/2023
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
var filename = __dirname + "/user_data.json";

if (fs.existsSync(filename)){
	// read in user data （check that exists)
	var user_data_obj_JSON = fs.readFileSync(filename, "utf-8");
	console.log(`Hey, I found ${filename}!`)

	// convert user data JSON to object
	var user_data = JSON.parse(user_data_obj_JSON);
	console.log(JSON.stringify(user_data));

	// if filename not found
} else {
	console.log(`Hey, I couldn't find ${filename}!`)
}


// Middleware function to check if user is authenticated
function isAuthenticated(request, response, next) {
	if (request.session.user) {
	  // User is authenticated, allow them to access the page
	  next();
	} else {
	  // User is not authenticated, redirect them to the login page
	  response.redirect('/login');
	}
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

	// Middleware function to check if user is authenticated
	function isAuthenticated(req, res, next) {
		if (req.session.user) {
		  // User is authenticated, allow them to access the page
		  next();
		} else {
		  // User is not authenticated, redirect them to the login page
		  res.redirect('/login');
		}
	  }

app.get("/invoice.html", isAuthenticated, function (request, response, next){
	response.render('invoice');
});

app.get('/login', (request, response) => {
	// Render the login template
	response.render('login');
  });

// process login, validate username and password
app.post("/login", function (request, response, next) {
	// output the data in the request body (quantities) to the console
	console.log(request.body);

	// empty errors object
	var errors = {};

	// set values for username and password, formats username as lowercase
	var username = request.body["username"].toLowerCase();
	var password = request.body["password"];

	// Function to authenticate user
	function authenticate() {
	// Load the user data from a JSON file
	user_data};

	// Authenticate the user
	var { username, password } = request.body;
	var user = authenticate(username, password);
  
	if (user) {
	  // Store the authenticated user in the session
	  request.session.user = user;
	  // Redirect the user to the protected page
	  res.redirect('/protected');
	} else {
	  // Authentication failed, show error message
	  res.render('login', { error: 'Invalid username or password' });
	}

	function isValidEmail() {
		// regular expression pattern for email validation - referenced from chatGPT
		var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailPattern.test(username);
	}

	// check if username entered is a valid email address
	if (!isValidEmail(username)) {
		errors[`email_error`] = `${username} is an invalid email address!`;

		// check if username email is in user data
	} else if (user_data.hasOwnProperty(username) !== true) {
		errors[`username_error`] = `${username} is not a registered email!`;

		// check to see if user's password matches password saved, entered
	} else if (password !== user_data[username].password) {
		errors[`password_error`] = `Password is incorrect!`;
	} else {
		var name = user_data[username].name;
	}

	// if all login is valid, redirect to invoice and put quantities, name, email in query string
	if (Object.keys(errors).length === 0) {
		request.session.user = user;
		let params = new URLSearchParams(selected_qty);
		params.append("email", username);
		params.append("name", name);
		response.redirect("./invoice.html?" + params.toString());
	}
	// login is not valid, go back to login page and display error message
	else {
		// add errors object to request.body to put into the querystring
		//request.body["errorsJSONstring"] = JSON.stringify(errors);
		let params = new URLSearchParams();
		params.append("errorsJSONstring", JSON.stringify(errors));
		response.redirect("./login.html?" + params.toString());

		// back to the order page and putting errors in the querystring
		//response.redirect("./login.html?" + querystring.stringify(errors));
	}
});

// referenced from assignment 2 code examples on class website

// post registration page, referenced from assignment 2 workshop code
app.post("/register", function (request, response, next) {
	var errors = {};
	var username = request.body["username"].toLowerCase();
	var password = request.body["password"];
	var repeatpassword = request.body["repeatpassword"];
	var name = request.body["name"];

	// if email address is already registered, output errors
	if (typeof user_data[username] != "undefined") {
		errors[
			`username_taken`
		] = `${username} is already registered! Please enter a different email address.`;
	}
	// if username is blank, output error
	if (username == "") {
		errors["no_username"] = `You need to add your email address!`;
	}

	// function from chatgpt
	function isValidEmail() {
		// regular expression pattern for email validation
		var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailPattern.test(username);
	}

	// if username is not a valid email address
	if (!isValidEmail(username)) {
		errors["invalid_email"] = `Please enter a valid email address!`;
	}

	// function referenced from chatgpt to validate that there are two words for first and last name
	function validateTwoWords() {
		var pattern = /^[a-zA-Z]+\s+[a-zA-Z]+$/;
		return pattern.test(name);
	}

	if (!validateTwoWords(name)) {
		errors["invalid_name"] = `Please enter a first and last name!`;
	}

	// if name is blank, output error
	if (name == "") {
		errors["no_name"] = `Please enter your name!`;
	}

	// if password field is blank, output error
	if (password == "") {
		errors["no_password"] = `Please create a password!`;
		// if repeat password is blank, output error
	} else if (repeatpassword == "") {
		errors["no_repeatpassword"] = `Please retype your password!`;
		// if passwords do not match, output error
	} else if (password !== repeatpassword) {
		errors["password_mismatch"] = `Passwords do not match!`;
	}

	if (password.length < 6 && password.length > 1) {
		errors["password_length"] = `Password length must be greater than 6 characters!`;
	}

	// if there are no errors with registration info, go to invoice and send all info to querystring

	if (Object.keys(errors).length === 0) {

		for (i in products) {
			// tracking the quantity available by subtracting purchased quantities
			products[i].quantity_available -= request.body[`quantity${i}`];
			// IR 1 - Tracking the total quantity of each item sold
			products[i].quantity_sold += Number(request.body[`quantity${i}`]);
		}

		// write updated data to filename (user_data.json)
		user_data[username] = {};
		user_data[username].name = request.body.name;
		user_data[username].password = request.body.password;
		fs.writeFileSync(filename, JSON.stringify(user_data));

		//selected_qty['email'] = username;
		//selected_qty['name'] = user_data[username].name;
		// set value of params to selected_qty var
		let params = new URLSearchParams(selected_qty);
		params.append("email", username);
		params.append("name", name);
		response.redirect("./invoice.html?" + params.toString());

		return;
		// if there are errors, put them in the jsonstring and return to the registration page
	} else {
		let params = new URLSearchParams();
		params.append("email", username);
		params.append("name", name);
		params.append("errorsJSONstring", JSON.stringify(errors));
		response.redirect("./registration.html?" + params.toString());	
	}
});

// route all other GET requests to files in public
app.use(express.static(__dirname + "/public"));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
