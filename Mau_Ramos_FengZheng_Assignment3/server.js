/*
Authors: Monica Mau, Le Yi Feng Zheng, Brandon Ramos
Assignment 3
Date: 5/12/2023
Description: server.js file to run server, validates quantities, login information, and registration information 
Required IRS: 3, 4, 5
*/

var express = require("express");
var app = express();
var products = require(__dirname + "/products.json");
var querystring = require("querystring");
var url = require("url");

// load file system interface
var fs = require("fs");

// load nodemailer
var nodemailer = require("nodemailer");

// load session package
var session = require("express-session");

// cookie parser
var cookieParser = require("cookie-parser");
app.use(cookieParser());

// encryption and decryption
// this code is referenced from stackoverflow: https://stackoverflow.com/questions/51280576/trying-to-add-data-in-unsupported-state-at-cipher-update and Professor Port for clarification
// this allows you to put anything in here, you have to choose a string to server as the "key" to encrypt and decrypt
let secrateKey = "secrateKey";
//Requires crypto library
const crypto = require("crypto");

// function to encrypt the text
function encrypt(text) {
	encryptalgo = crypto.createCipher("aes192", secrateKey);
	let encrypted = encryptalgo.update(text, "utf8", "hex");
	encrypted += encryptalgo.final("hex");
	return encrypted;
}

// function to decrypt text
function decrypt(encrypted) {
	decryptalgo = crypto.createDecipher("aes192", secrateKey);
	let decrypted = decryptalgo.update(encrypted, "hex", "utf8");
	decrypted += decryptalgo.final("utf8");
	return decrypted;
}

// checks to see encrypted version of password in the terminal
console.log(encrypt("abc123@123"));

app.use(
	session({ secret: "MySecretKey", resave: true, saveUninitialized: true })
);

// code referenced from lab 13 fileio exercise 1a and 1b, set variable for the json file
var user_data_filename = __dirname + "/user_data.json";

var products_filename = __dirname + "/products.json";

if (fs.existsSync(user_data_filename)) {
	// read in user data （check that exists)
	var user_data_obj_JSON = fs.readFileSync(user_data_filename, "utf-8");

	// convert user data JSON to object
	var user_data = JSON.parse(user_data_obj_JSON);

	// if user_data_filename not found
} else {
	console.log(`Hey, I couldn't find ${user_data_filename}!`);
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

// IR 4: Add to favorites & save it to the session to retrieve back to cart later 
app.post("/favorite", function (request, response, next) {
	console.log(JSON.stringify(request.body));

	// initalize empty session object for favorites
	if (!request.session.favorites) {
		request.session.favorites = {};
	}

	// store updated favorites in session
	if (
		typeof request.session.favorites[request.body.product_type] == "undefined"
	) {
		request.session.favorites[request.body.product_type] = [];
	}

	// indicate in the favorites object if the product is favorited - ngl these four lines of code were the most traumatizing moments of my life in this class where Port basically called me a dumbass
	if (request.body.product_type !== "get") {
		request.session.favorites[request.body.product_type][
			request.body.product_index
		] = request.body.favored;
	}

	// update the favorites and send em
	response.json(request.session.favorites);
});

// Admin page 
// Received help from Prof. Port
app.get("/admin", authAdmin, function (request, response, next) {
	// present the admin page
	str = `
	<link href="admin.css" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css2?family=Quicksand" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css2?family=Montserrat" rel="stylesheet"> 
    <body>
	<h1>SHINee Album Shop</h1>
    <h2>Admin settings<h2>
    <br>
    <input type="button" class="button" value="Manage Users" onclick="location.href='./manageusers'">
    <input type="button" class="button" value="Manage Products" onclick="location.href='./manageproducts'">
    <input type="button" class="button" value="Return to Main Page" onclick="location.href='./products_display.html?product_type=Group'">
    </body>
        `;

	response.send(str);
	return;
});

app.get("/manageusers", authAdmin, function (request, response, next) {
	// received help with writing this code from Michelle Zhang
	// initialize variable str
	var str = "<form action = './updateusers' method='POST'>";

	// loop through product type in products
	for (var user_email in user_data) {
		// append a string of HTML to str
		str += `
		<link href="admin.css" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css2?family=Quicksand" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css2?family=Montserrat" rel="stylesheet"> 
	<body>
		Email: <input type="text" name="update[${user_email}]" value="${user_email}">
            Name: <input type="text" name="user_data[${user_email}][name]" value="${
			user_data[user_email].name
		}">
            Password: <input type="text" name="user_data[${user_email}][password]" value="${
			user_data[user_email].password
		}">
            Admin: <input type="checkbox" name="admin[${user_email}]" ${
			user_data[user_email].admin ? "checked" : ""
		}>
            Delete account?: <input type="checkbox" name="delete[${user_email}]">
            <br><br>
			</body>
            `;
	}

	// append an empty row for users to add a new account
	str += `
	  Register a new user:
	  <br><br>
	  Email: <input type="text" name="new_user_email">
      Name: <input type="text" name="new_user_name">
      Password: <input type="text" name="new_user_password">
      Admin: <input type="checkbox" name="new_user_admin">
      <br><br>`;

	// append a submit button
	// append a return to admin button
	str += '<input type="submit"></form>';
	str +=
		'<input type="button" size="40" value="Return to Admin" onclick="location.href=\'/admin\'">';
	response.send(str);
});

// the following was adapted from Professor Port and ChatGPT
app.post("/updateusers", authAdmin, function (request, response, next) {
	user_data = request.body.user_data;

	// look for updated email addresses
	for (let user_email in request.body.update) {
		if (user_email != request.body.update[user_email]) {
			user_data[request.body.update[user_email]] = user_data[user_email];
			delete user_data[user_email];
		}
	}

	// look for accounts to delete
	for (let user_email in request.body.delete) {
		delete user_data[user_email];
	}

	// look for accounts to make admin
	console.log(request.body.admin);
	for (let user_email in request.body.admin) {
		user_data[user_email].admin = true;
	}

	// add new user if email exists in request body
	// this code is adapted from ChatGPT
	if (request.body.new_user_email) {
		const new_email = request.body.new_user_email;

		var admincheckbox = true || "";

		const new_user_data = {
			name: request.body.new_user_name,
			password: request.body.new_user_password,
			admin: admincheckbox,
		};
		user_data[new_email] = new_user_data;
		console.log(new_user_data);
	}

	// write updated data to user_data_filename (user_data.json)
	fs.writeFileSync(user_data_filename, JSON.stringify(user_data));
	response.redirect("./manageusers");
});

app.get("/manageproducts", authAdmin, function (request, response, next) {
	// received help with writing this code from Michelle Zhang
	// initialize variable str
	var str = "<form action = './updateproducts' method='POST'>";
	// loop through product type in products
	for (var prod_type in products) {
		// loop through index of each product in each product type
		for (var i in products[prod_type]) {
			// append a string of HTML to str
			str += `
                ${prod_type}[${i}][name]: <input type="text" name="prod_info[${prod_type}][${i}][name]" value="${products[prod_type][i].name}">
                Price: $<input type="text" name="prod_info[${prod_type}][${i}][price]" value="${products[prod_type][i].price}">
            Inventory: <input type="text" name="prod_info[${prod_type}][${i}][quantity_available]" value="${products[prod_type][i].quantity_available}">
            Description: <input type="text" name="prod_info[${prod_type}][${i}][description]" value="${products[prod_type][i].description}">
            Delete Inventory?: <input type="checkbox" name="delete[${prod_type}][${i}]">
            <br><br>`;
		}
	}
	// add an empty row for new product
	str += `<link href="admin.css" rel="stylesheet">
	New product:
           <br>
           Product type: <input type="text" name="new_prod_type">
           Product name: <input type="text" name="new_prod_name">
           Price: $<input type="text" name="new_prod_price">
           Inventory: <input type="text" name="new_prod_inventory">
           Description: <input type="text" name="new_prod_description">
           <br><br>`;

	// append a submit button
	str += '<input type="submit"></form>';
	str +=
		'<input type="button" size="40" value="Return to Admin" onclick="location.href=\'/admin\'">';
	response.send(str);
});

app.post("/updateproducts", authAdmin, function (request, response, next) {
	console.log(JSON.stringify(request.body));

	// the following is taken from ChatGPT
	const {
		prod_info,
		delete: toDelete,
		new_prod_type,
		new_prod_name,
		new_prod_price,
		new_prod_inventory,
		new_prod_description,
	} = request.body;

	// Update existing products
	for (const prod_type in prod_info) {
		for (const i in prod_info[prod_type]) {
			const index = Number(i);
			const product = prod_info[prod_type][i];
			if (products[prod_type] && products[prod_type][index]) {
				products[prod_type][index].name = product.name;
				products[prod_type][index].price = product.price;
				products[prod_type][index].quantity_available =
					product.quantity_available;
				products[prod_type][index].description = product.description;
			}
		}
	}

	// remove products that were selected for deletion
	for (const prod_type in toDelete) {
		for (const i in toDelete[prod_type]) {
			const index = Number(i);
			if (toDelete[prod_type][index]) {
				products[prod_type].splice(index, 1);
			}
		}
	}

	// this was taken from ChatGPT
	// add new product
	if (
		new_prod_type &&
		new_prod_name &&
		new_prod_price &&
		new_prod_inventory &&
		new_prod_description
	) {
		if (!products[new_prod_type]) {
			products[new_prod_type] = [];
		}
		products[new_prod_type].push({
			name: new_prod_name,
			price: new_prod_price,
			quantity_available: new_prod_inventory,
			description: new_prod_description,
		});
	}

	// write updated data to products.json
	fs.writeFileSync(products_filename, JSON.stringify(products));
	response.redirect("./manageproducts");
});

// microservice
// Checks if user's account is an admin account
function authAdmin(request, response, next) {
	console.log(request.cookies);
	// check if user is logged in, else, send to login
	if (typeof request.cookies.userid == "undefined") {
		response.redirect("./login.html");
		return;
	}
	// check if user logged in is an admin, if not, send message
	if (!user_data[request.cookies.userid].admin) {
		response.send("You are not an authorized administrator!");
		return;
	}
	next();
}

// received help from Professor Port
app.post("/isAdmin", function (request, response, next) {
	// check if user is logged in, else, send to login
	if (typeof request.cookies.userid != "undefined") {
		// check if user logged in is an admin, if not, send message
		if (user_data[request.cookies.userid].admin == true) {
			response.json({ is_admin: true });
			return;
		} else {
			// user is not an admin
			response.json({ is_admin: false});
			return;
		}
	} else {
		// user is not logged in
		response.json({ is_admin: undefined });
	} 
});

// add selected quantities to cart, assisted by Prof Port
app.post("/addToCart", function (request, response, next) {
	console.log(request.body);

	var errors = {};

	var i = request.body["product_index"];

	var product_type = request.body["prod_type"];

	var qty = request.body["prod_quantity"];

	//initialize product type and index to an empty array
	if (request.session.cart.hasOwnProperty(product_type) == false) {
		request.session.cart[product_type] = [];
	}
	// check if the array at the given index is undefined, if so initialize to null
	if (typeof request.session.cart[product_type][i] === "undefined") {
		request.session.cart[product_type][i] = 0;
	}

	// check if quantity is blank or a non neg integer, if so then output errors
	if (qty == 0 || qty == "") {
		errors[`quantity${i}_error`] = `Please select a quantity!`;
	} else if (findNonNegInt(qty) == false) {
		errors[`quantity${i}_error`] = findNonNegInt(qty, true).join("<br>");
	}

	// check if quantities are available
	if (
		Number(qty) + request.session.cart[product_type][i] >
		products[product_type][i].quantity_available
	) {
		errors[`quantity${i}_available_error`] = `We don't have ${qty} available!`;

		// if quantity is valid, add to session
	} else if (Object.keys(errors).length === 0) {
		request.session.cart[product_type][i] += Number(qty);
	}

	request.session.save(function (err) {
		// session saved
	});

	response.json(errors); // sends response
});

// retrieve current cart
app.post("/get_cart", function (request, response, next) {
	response.json(request.session.cart);
});

// update the session quantities with updated amounts from cart
app.post("/update_cart", function (request, response, next) {
	// set updated_cart variable to the contents of the request body
	var updated_cart = request.body;

	// empty errors
	var errors = {};

	if (Object.keys(errors).length == 0) {
		for (let product_type in products) {
			for (let i in products[product_type]) {
				// if there is no value then move to the next product
				if (typeof updated_cart[`cart_${product_type}_${i}`] == "undefined") {
					continue;
				}

				// if quantity is 0, set to null,
				if (updated_cart[`cart_${product_type}_${i}`] === 0) {
					request.session.cart[product_type][i] = null;
				}
				// update the quantities of products in the cart
				request.session.cart[product_type][i] = Number(
					updated_cart[`cart_${product_type}_${i}`]
				);
			}
		}
	} else {
		let params = new URLSearchParams();
		params.append("errors", JSON.stringify(errors));
		response.redirect(`./cart.html?${params.toString()}`);
	}

	response.redirect(`./cart.html?`);
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
	var encryptedPassword = encrypt(request.body.password);

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
	} else if (user_data[username].password == "") {
		errors[`password_error`] = `Enter your password!`;

		// check to see if user's password matches password saved, entered
	} else if (user_data[username].password !== encryptedPassword) {
		errors[`password_error`] = `Password is incorrect!`;
	} else {
		var name = user_data[username].name;
	}

	// if all login is valid, redirect to product display page and set cookies for username and name
	if (Object.keys(errors).length === 0) {
		response.cookie("userid", username, { expire: Date.now() - 15 * 1000 });
		response.cookie("name", name, { expire: Date.now() - 15 * 1000 });
		message = `<script>alert('${name} has successfully logged in!'); location.href="./products_display.html?product_type=Group";</script>`;
		response.send(message);
	}
	// login is not valid, go back to login page and display error message
	else {
		// add errors object to request.body to put into the querystring
		let params = new URLSearchParams();
		params.append("username", username);
		params.append("errorsJSONstring", JSON.stringify(errors));
		response.redirect("./login.html?" + params.toString());
	}
});

// logout referenced and modified from Tina Vo, deletes session cart and clears cookies, return to index page
app.get("/logout", function (request, response, next) {
	// send logout alert and redirect to index
	message = `<script>alert('You have successfully logged out!'); location.href="./index.html";</script>`;
	delete request.session.cart;
	response.clearCookie("userid");
	response.clearCookie("name");
	response.send(message);
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

		// Require that passwords have at least one number and one special character. (regex referenced from ChatGPT)
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
	// if there are no errors with registration info, write to json file and return to products display page

	var totalLength = 0;

	for (var prop in errors) {
		totalLength += errors[prop].length;
	}

	if (totalLength === 0) {
		// write updated data to user_data_filename (user_data.json)
		user_data[username] = {};
		user_data[username].name = request.body.name;
		user_data[username].password = encrypt(request.body.password);
		fs.writeFileSync(user_data_filename, JSON.stringify(user_data));

		response.cookie("userid", username, { expire: Date.now() - 60 * 1000 });
		response.cookie("name", name, { expire: Date.now() - 60 * 1000 });
		response.redirect("./products_display.html?product_type=Group");

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

// checkout and go to confirmation page
app.post("/checkout", function (request, response, next) {

	// if user is not logged in, display alert and redirect to login page
	if (
		typeof request.cookies["userid"] === "undefined" ||
		request.cookies["userid"] == ""
	) {
		var message = `<script>alert('You must sign in or register an account before making a purchase!'); location.href="./login.html"</script>`;
		response.send(message);

		// go to invoice if user cookies match
	} else {
		response.redirect("/invoice.html");
	}
});

//IR5: Rate products for purchase (serivce to add rating for product)
//Helped from Prof. Port
app.post("/rateProduct", function (request, response, next) {
	console.log(request.body);

	var prodRating =
		products[request.body.prod_type][request.body.product_index]["Rating"];

	// Have product rating --> calculate avg
	if (typeof prodRating == "undefined") {
		products[request.body.prod_type][request.body.product_index]["Rating"] = {
			"Num Ratings": 1,
			Avg: Number(request.body.prod_rating),
		};
	} else {
		var n = prodRating["Num Ratings"] + 1;
		var avg = (
			(prodRating["Avg"] * prodRating["Num Ratings"] +
				Number(request.body.prod_rating)) /
			n
		).toFixed(2);
		products[request.body.prod_type][request.body.product_index]["Rating"] = {
			"Num Ratings": n,
			Avg: avg,
		};
	}
	response.json({});
});

// Confirming purchase to send the invoice to email registered
app.post("/purchase", function (request, response, next) {
	var name = request.cookies["name"];
	var userid = request.cookies["userid"];

	str = `<link href="invoice.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&family=Palanquin+Dark:wght@500&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Quicksand" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Dosis:wght@300&family=Noto+Sans+Devanagari&family=Palanquin+Dark:wght@500&display=swap" rel="stylesheet">
	
	<h1>SHINee Album Shop</h1>
	<h2>Thank you ${name} for your purchase! Please see your invoice below.</h2>
	
	<div>
      <table border="2" width="90%">
        <tbody>
            <th style="text-align: center;" width="33%">Item</th>
            <th style="text-align: center;" width="33%">Quantity</th>
            <th style="text-align: center;" width="33%">Price</th>
          </tr>`;

	var cart = request.session.cart;

	// Subtotal
	var subtotal = 0;

	// generates rows with prices based on quantities
	subtotal = 0;
	for (let product_type in cart) {
		for (let i = 0; i < cart[product_type].length; i++) {
			var quantities = cart[product_type][i];
			if (quantities > 0) {
				// Setup conditionals
				extended_price = quantities * products[product_type][i].price; // Compute extended price
				subtotal += extended_price; // Add subtotal back to itself

				str += `
	<tr>
	 	<td align="center" width="33%">${products[product_type][i].name}</td>
	 	<td align="center" width="33%">${quantities}</td>
	 	<td align="center" width="33%">$${products[product_type][i].price}</td>
   	</tr>
          `;
			}
		}
	}

	// Tax rate
	var tax_rate = 0.04712;
	var tax = tax_rate * subtotal;

	// Compute shipping
	if (subtotal <= 80) {
		shipping = 10;
	} else {
		shipping = 0;
	}

	// Grand total
	var total = subtotal + tax + shipping;

	str += `
          <tr>
            <td colspan="2" width="100%">&nbsp;</td>
          </tr>
          <tr>
            <td style="text-align: right;" colspan="2" width="67%">Subtotal</td>
            <td colspan="2" width="54%">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right;" colspan="2" width="67%">Tax @ 4.71%</span></td>
            <td colspan="2" width="54%">$${tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right;" colspan="2" width="67%">Shipping</span></td>
            <td colspan="2" width="54%">$${shipping}</td>
          </tr>
          <tr>
            <td style="text-align: right;" colspan="2" width="67%"><b>Total</b></td>
            <td colspan="2" width="54%"><b>$${total.toFixed(2)}</b></td>
          </tr>
      </tbody>
    </table>
  </div>
  <a class="home-button" href="/index.html"><i class="fa fa-home"></i> Home</li></a>
  <footer>&copy; 2023 Monica's SHINee Album Shop</footer>
`;

	// parts referenced from assignment 3 code example
	// create a transporter variable for nodemailer
	var transporter = nodemailer.createTransport({
		host: "mail.hawaii.edu",
		port: 25,
		secure: false, // use TLS
		tls: {
			// do not fail on invalid certs
			rejectUnauthorized: false,
		},
	});

	var user_email = userid;
	// email format -> sends the invoice
	var mailOptions = {
		from: "mylm@hawaii.edu", //sender
		to: user_email, //receiver
		subject: "Thank you for your order!", // subject heading
		html: str, //html body (invoice)
	};

	// send email if successful, if not, alert an error message
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			email_msg = `<script>alert('Oops, ${userid}. There was an error and your invoice could not be sent'); location.href="/products_display.html?product_type=Group"</script>`;
			response.send(email_msg);
			return; // terminate the function after sending the error response
		} else {
			console.log("Email sent to: " + info.response);
			email_msg = `<script>alert('Your invoice was mailed to ${userid}');</script>`;
			response.send(str + email_msg);
		}
	});

	for (let product_type in request.session.cart) {
		for (i in request.session.cart[product_type]) {
			if (request.session.cart[product_type][i] != null) {
				// remove selected quantities from quantity available

				products[product_type][i].quantity_available -=
					request.session.cart[product_type][i];
				products[product_type][i].quantity_sold +=
					request.session.cart[product_type][i];
			}
		}
	}

	response.clearCookie("userid");
	response.clearCookie("name");
	delete request.session.cart;
});

// route all other GET requests to files in public
app.use(express.static(__dirname + "/public"));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
