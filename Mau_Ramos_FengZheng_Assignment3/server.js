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

var session = require("express-session");

app.use(
	session({ secret: "MySecretKey", resave: true, saveUninitialized: true })
);

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
app.use(express.json());

// monitor all requests
app.all("*", function (request, response, next) {
	console.log(request.method + " to " + request.path);
	if (request.session.hasOwnProperty("cart") == false) {
		request.session.cart = {};
	}
	console.log(request.session);
	next();
});

// Routing
app.get("/products_data.js", function (request, response, next) {
	response.type(".js"); // send response as javascript
	var products_str = `var products = ${JSON.stringify(products)}`; // sets var products_str, converts JSON products array into string
	response.send(products_str); // sends response
});

// Admin page
app.get("/admin", function (request, response, next) {
	// check if session is for Admin, if not ask for admin password
	if(!request.session.hasOwnProperty('isAdmin')) {
		str = `
		<body>
		Enter the admin password: 
		<br>
		<form action="" method="POST">
		<input type="password" name="password" size="40" placeholder="enter password"><br>
		<input type="submit" value="Submit" id="submit">
		</form>
		</body>
			`;
		 
		response.send(str);
		return;
	}
	// present the admin page
	str = `
	<body>
	What do you want to do: 
	<br>
	<input type="button" size="40" value="Manage Users" onclick="location.href='./manageusers'">
	<br>
	<input type="button" size="40" value="Manage Products" onclick="location.href='./manageproducts'">
	<br>
	<input type="button" size="40" value="Logout" onclick="location.href='./products_display.html'">
	</body>
		`;
	 
	response.send(str);
	return;

});

// check admin login
/* app.post("/admin", function (request, response, next) {
	if(request.body.password == 'adminpass') {
		request.session.isAdmin = true;
		response.redirect('./admin');
	} else {
		response.send('Sorry, you are not an authorized admin user');
	}
}); */

app.get("/manageusers", function (request, response, next) {
	var admin = request.body['admin'];
	// check if user is admin = true
	if(admin != true) {
		response.send(`You are not an authorized administrator!`);
	}
	response.send('manage users'); // sends response
});

app.get("/manageproducts", function (request, response, next) {
	// received help with writing this code from Michelle Zhang
	// initialize variable str
	var str = "<form action = './update_products' method='POST'>";
	// loop through product type in products
	for(var prod_type in products) {
		// loop through index of each product in each product type
		for(var i in products[prod_type]) {
			// append a string of HTML to str
			str +=
			`${prod_type}[${i}][name]:<input type="text" name="prod_info[${prod_type}][${i}][name]" value="${products[prod_type][i].name}"><br>`
		}
	}
	// append a submit button
	str += '<input type="submit"></form>';
	response.send(str);
});

/* function authAdmin(request, response, next) {
	if(!request.session.hasOwnProperty('isAdmin')) {
		response.redirect('./admin');
	} else {
		next();
	}
	
} */

// add selected quantities to cart, assisted by Prof Port
app.post("/addToCart", function (request, response, next) {
	console.log(request.body);

	var errors = {};

	var i = request.body["product_index"];

	var product_type = request.body["prod_type"];
	
	var qty = request.body["prod_quantity"];
			
		// validate quantity selected
		// check if quantity is a non neg integer, if so then fill errors object
		if (findNonNegInt(qty) == false) {
		errors[`quantity${i}_error`] = findNonNegInt(qty, true).join("<br>");
	}
	
	// check if quantities are available
		if (qty > products[product_type][i].quantity_available) {
			errors[
				`quantity${i}_available_error`
			] = `We don't have ${qty} available!`;
		}

		// if quantity is valid, add to session
		if (Object.keys(errors).length === 0) {
			//initialize product type and index to an empty array
			if (request.session.cart.hasOwnProperty(product_type) == false) {
				request.session.cart[product_type] = [];
			}
			// check if the array at the given index is undefined, if so initialize to zero
			if (typeof request.session.cart[product_type][i] === "undefined") {
				request.session.cart[product_type][i] = 0;
			}

			request.session.cart[product_type][i] += Number(qty);
		}

		request.session.save(function (err) {
			// session saved
		});

		response.json(errors); // sends response
	}
);

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
		/*for (i = 0; i < products[product_type].length; i++) {
			// tracking the quantity available by subtracting purchased quantities
			products[product_type][i].quantity_available -= selected_qty[`quantity${i}`];
			products[product_type][i].quantity_sold += Number(selected_qty[`quantity${i}`]);
		}*/

		let params = new URLSearchParams(selected_qty);
		params.append("username", username);
		params.append("name", name);
		response.redirect("./products_display.html?" + params.toString());
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
		for (i = 0; i < products[product_type].length; i++) {
			// tracking the quantity available by subtracting purchased quantities, only once you get to the invoice
			products[product_type][i].quantity_available -=
				selected_qty[`quantity${i}`];
			products[product_type][i].quantity_sold += Number(
				selected_qty[`quantity${i}`]
			);
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
