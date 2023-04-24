/* 
Name: Tina Vo
Due Date: 12/14/2021
Description: Server for Assignment 3
Credits: Thank you Professor Port and Brandon Jude Marcos for help and guidance
Borrowed and modified code from: Assignment1_2file, Lab 12, Assignment 3 Code Example, Kimberly Matutina 
Products and logo from: https://www.inthemoodfor.net/shop (I do not own the logo)! 
*/

//express takes querystring and turns into an object
//take json and define as object, store in variable called products
var express = require('express');
var app = express();
var querystring = require("querystring");
var fs = require('fs')
//var nodemailer = require("nodemailer");
var nodemailer = require('nodemailer');

//load in product data
var products_array = require(__dirname + '/product_data.json');
var qString;
var user_data = __dirname + '/user_data.json'; // get data from user_data.json

// cookies and sessions 
var cookieParser = require('cookie-parser'); // setup cookie-parser
var session = require('express-session'); // setup express sessions

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "ITM352", resave: true, saveUninitialized: true }));


if (fs.existsSync(user_data)) {
    var file_stats = fs.statSync(user_data);
    data = fs.readFileSync(user_data, 'utf-8');
    //var users_reg_data = JSON.parse(user_data);
    var users_reg_data = JSON.parse(fs.readFileSync(user_data, 'utf-8')); // return string, parse to object, set object value to users_reg_data
}
else {
    //test in console in case user data doesn't go through
    console.log(`${user_data} does not exist!`)
}

// code express and cookieParser based on lab 13 ex3
app.use(express.json());  // parse application/json content to request.body
app.use(cookieParser());

// monitor requests using for loop then send it to next thing (app.get)
// based on lab 13
app.all('*', function (request, response, next) {
    if (typeof request.session.cart == 'undefined') { request.session.cart = {}; }
    next();
});
// GET request from product_data.js then creates a string from a variable
app.get("/product_data.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products_array = ${JSON.stringify(products_array)};`;
    response.send(products_str);
});

//GET request to cart_data.js will return javascript to define a cart variable with request.session.cart
app.get("/cart_data.js", function (request, response, next) {
    response.type('.js');
    if (typeof request.session.cart == 'undefined') {
        request.session.cart = {};
    }
    var products_str = `var cart = ${JSON.stringify(request.session.cart)};`;
    response.send(products_str);
});


//express executes this post
app.post('/add_to_cart', function (request, response, next) {
    //variables for data validation
    var product_type = request.body["product_type"];
    var prod_index = request.body["prod_index"];
    var quantity = request.body["quantity"];
    var errors = {}; //start with no errors

    // check all the posted quantities
    //quantity is not valid (negative number, random letters)
    if (isNonNegInt(quantity) == false) {
        errors['invalid_quantity'] = `${quantity} ${products_array[product_type][prod_index].name} is not a valid quantity`;
    }
    // must add quantity to cart
    if (quantity == 0) {
        errors['no_quantities'] = `You need to select some quantities!`;
    }
    //quantity greater than quantity available
    if (quantity > products_array[product_type][prod_index].quantity_available) {
        errors['quantity_available'] = `${quantity} of ${products_array[product_type][prod_index].name} is not available. Only ${products_array[product_type][prod_index].quantity_available} available.`;
    }


    // if errors is empty, go to invoice. otherwise go back to order page with errors - professor port helped with adding product to cart
    if (Object.keys(errors).length == 0) {
        // purchase is valid, remove quantity available
        products_array[product_type][prod_index].quantity_available -= Number(quantity);
        //add purchase to shopping cart
        if (typeof request.session.cart == 'undefined') {
            request.session.cart = {}; //empty cart object
        }
        if (typeof request.session.cart[product_type] == 'undefined') {
            request.session.cart[product_type] = []; //making a place for product
        }
        //take what's in the cart before and add it
        if (typeof request.session.cart[product_type][prod_index] == 'undefined') {
            request.session.cart[product_type][prod_index] = Number(quantity);
        }
        //if there are already quantities for this product then add to it
        else {
            request.session.cart[product_type][prod_index] += Number(quantity);
        }
        console.log(request.session.cart);
        response.redirect("./products_display.html?prod_key=Stickers"); // goes to products page with updated cart qty
    }
    else {
        // make error message from all errors
        var errorMessage_str = '';
        for (err in errors) {
            errorMessage_str += errors[err] + '\n';
        }
        let params = new URLSearchParams();
        params.append('prod_key', product_type);
        params.append('errorMessage', errorMessage_str);
        params.append('qty_obj', JSON.stringify(request.body));
        response.redirect(`./products_display.html?${params.toString()}`); 
    }
});

//get info from session (shopping cart data) 
app.post('/get_cart', function (request, response) {
    response.json(request.session.cart);
});

// purchase is valid, update the cart 
app.post('/update_cart', function (request, response, next) {
    console.log(request.body);
    var updated_cart = request.body;
    var errors = {}; //start with no errors
    
    // professor port helped me with putting the quantity back to products page (zoom with prof & brandon marcos)
    //modify inventory from the difference of cart and update
    if (Object.keys(errors).length == 0) {
        //modify inventory from the difference of cart and update
        for (let product_key in products_array) {

            // trying to fix the null error (thank you professor port)
            for (let i in products_array[product_key]) {
                if (typeof updated_cart[`cart_${product_key}_${i}`] == 'undefined') {
                    continue;
                }

                //get the difference between cart and inventory
                let diff = request.session.cart[product_key][i] - updated_cart[`cart_${product_key}_${i}`];
                products_array[product_key][i].quantity_available += diff;
                request.session.cart[product_key][i] = Number(updated_cart[`cart_${product_key}_${i}`]);
            }
        }
    }

    let params = new URLSearchParams();
    params.append('errors', JSON.stringify(errors));

    response.redirect(`./shopping_cart.html?${params.toString()}`);


});

// --------------- login page ---------------------------
app.post("/process_login", function (request, response) {


    //empty basket of errors
    var errors = {};
    //string for messages
    var loginMessage_str = '';
    var incorrectLogin_str = '';

    // validate username and password
    console.log(request.query);
    username = request.body.username.toLowerCase(); // usernames are formatted as lowercase

    // thank you professor port for guidance
    if (typeof users_reg_data[username] != 'undefined') { // username and password shouldn't be undefined
        if (users_reg_data[username].password == request.body.password) {
            request.query.username = username;
            console.log(users_reg_data[request.query.username].name);
            request.query.name = users_reg_data[request.query.username].name; // go to invoice if username and password are correct
            request.query.email = users_reg_data[request.query.username].email; // put email in query
            let more_qString = querystring.stringify(request.query); // generate new querys

            //display name on products display
            var user_info = { "username": username, "name": users_reg_data[username].name, "email": users_reg_data[username].email };
            // user info expiration
            response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });

            // professor port helped with adding on query string
            loginMessage_str = `Welcome ${username}, you are logged in. Navigate the tabs to explore new products!`; //message that displays after login
            response.redirect(`./products_display.html?prod_key=Stickers?loginMessage=${loginMessage_str}&` + qString + '&' + more_qString);

            return;
        }

        // if password is incorrect, show 'Invalid Password' message 
        else {
            incorrectLogin_str = 'The password is invalid!';
            console.log(errors);
            request.query.username = username;
            request.query.name = users_reg_data[username].name;
        }
    }

    // if username is incorrect, show 'Invalid Username' message 
    else {
        incorrectLogin_str = 'The username is invalid!';
        console.log(errors);
        request.query.username = username;
    }

    //redirect to invoice with message (professor port helped me with the query)
    response.redirect(`./login.html?loginMessage=${incorrectLogin_str}&wrong_pass=${username}`);

});

// --------------- registration page ------------------------
app.post("/process_register", function (request, response) {
    // professor port helped me with pushing errors
    console.log(request.body);
    //empty basket of errors
    var errors = {};
    //string for message display
    var loginMessage_str = '';
    // check is new name is lowercase
    var register_user = request.body.username.toLowerCase();
    // validate name, username, email, and pw
    errors['name'] = [];
    errors['username'] = [];
    errors['email'] = [];
    errors['password'] = [];
    errors['repeat_password'] = [];

    // number and letter limitations from kimberly matutina -> modified by pushing different errors -> added span to show error in registration
    if (/^[A-Za-z]+ [A-Za-z]+$/.test(request.body.name)) {
    }
    // error message when name doesn't follow character guidelines
    else {
        errors['name'].push('Please follow the format for names! (ex. Tina Vo)');
    }

    // error message when the name is empty
    if (request.body.name == "") {
        errors['name'].push('The name is invalid. Please insert a name.');
    }

    // the users full name should only allow letters, no more than 30 characters
    if (request.body.name.length > 30) { // execute errors if the name surpassed limit
        errors['name'].push('Name is too long. Insert a name less than 30 characters.');
    }

    // error for when username is already taken
    if (typeof users_reg_data[register_user] != 'undefined') {
        errors['username'].push('Username is taken.');
    }

    // character limitations for username - only numbers and letters allowed (insensitive)
    if (/^[0-9a-zA-Z]+$/.test(request.body.username)) {
    }
    else {
        errors['username'].push('Use only letters and numbers for your username.');
    }

    // make username a minimum of 4 characters and max of 10
    if (request.body.username.length > 10 || request.body.username.length < 4) {
        errors['username'].push('Your username must contain 4-10 characters.');
    }

    // email limitations -> https://www.w3resource.com/javascript/form/email-validation.php)
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(request.body.email)) {
    }
    else {
        errors['email'].push('Please use a valid format email format (ex. tinavo@gmail.com)');
    }

    // make password a minimum of six characters
    if (request.body.password.length < 6) {
        errors['password'].push('Your password is too short (Please use at least 6 characters).');
    }

    // check to see if the passwords match
    if (request.body.password != request.body.repeat_password) {
        errors['repeat_password'].push('Your password does not match.');
    }

    // request name, username, and email
    request.query.name = request.body.name;
    request.query.username = request.body.username;
    request.query.email = request.body.email;


    // remember user information given no errors (save info)
    var num_errors = 0;
    for (err in errors) {
        num_errors += errors[err].length;
    }
    if (num_errors == 0) {
        POST = request.body;
        var username = POST["username"];
        users_reg_data[username] = {};
        users_reg_data[username].name = request.body.name;
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;

        // stringify user's information
        data = JSON.stringify(users_reg_data);
        fs.writeFileSync(user_data, data, "utf-8");
        request.query.name = users_reg_data[request.query.username].name;
        request.query.email = users_reg_data[request.query.username].email; // define email
        let more_qString = querystring.stringify(request.query); // new query to add to response

        // NEW save user info and set expiration
        console.log(POST, "account information");
        // successfulful registration message and goes to products page after accepting th msg
        loginMessage_str = `<script>alert('${users_reg_data[username].name} Registration Successful!');
        location.href = "${'./products_display.html?prod_key=Stickers.html?' + qString + '&' + more_qString}";
        </script>`;
        // create user info variable to store -> username, name, and email
        var user_info = { "username": username, "name": users_reg_data[username].name, "email": users_reg_data[username].email };
        //set user expiration in milliseconds 
        response.cookie('user_info', JSON.stringify(user_info), { maxAge: 35 * 60 * 1000 });
        response.send(loginMessage_str);
    }
    // check for errors
    else {
        console.log('in post register', errors, request.body)
        //errors object for error message (search params)
        request.body.errors_obj = JSON.stringify(errors);

        // redirect to register.html
        response.redirect("./register.html?" + querystring.stringify(request.body));

    }
});

// logs the user out and clears data hence session destroy and clearCookie
app.get("/logout", function (request, response) {
    var user_info = JSON.parse(request.cookies["user_info"]);
    var username = user_info["username"];
    logout_msg = `<script>alert('${user_info.name} has successfully logged out!'); location.href="./index.html";</script>`;
    response.clearCookie('user_info');
    response.send(logout_msg);
    request.session.destroy();
});

// leads the user to the final invoice page where user is not allowed to edit quantities
// thank you brandon marcos for helping with the my conditional statement error below!
app.post('/completePurchase', function (request, response) {

    //if user is not logged in, redirect to login page
    if (typeof request.cookies["user_info"] == 'undefined') {
        console.log(user_name);
        response.redirect(`./login.html`);

        //otherwise, proceed to the final purchase page
    } else {
        var user_info = JSON.parse(request.cookies["user_info"]);
        var user_email = user_info["email"];
        var user_name = user_info["name"];
        var shopping_cart = request.session.cart;

        //load stylesheet to make invoice similar to shopping cart
        str =
            `<link rel="stylesheet" type="text/css" href="./invoice.css">
        <link
        href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Be+Vietnam+Pro:wght@100&family=Dancing+Script&family=Didact+Gothic&family=Nixie+One&display=swap"
        rel="stylesheet">
        <div id="topText">
        <h2 id="subtitle">Order Confirmation</h2>
        </div>
        
        <h3 align="center">Thank you for your purchase ${user_info.name}!<br>
        <br>
        <section>
            <table>
            <tbody>
            <tr>
                <td style="text-align: left;" width="40%"><strong>Image</strong></td>
                <td width="20%"><strong>Product</strong></td>
                <td width="20%"><strong>Quantity</strong></td>
                <td width="20%"><strong>Price</strong></td>
            </tr>`;

        var shopping_cart = request.session.cart;

        subtotal = 0; // Compute subtotal
        for (product_type in products_array) {
            for (i = 0; i < products_array[product_type].length; i++) {
                if (typeof shopping_cart[product_type] == 'undefined') continue;
                //if (typeof request.session.username != 'undefined')
                quantity = shopping_cart[product_type][i];
                //if username exists, go to invoice
                if (quantity > 0) {
                    extended_price = quantity * products_array[product_type][i].price // Compute extended price
                    subtotal += extended_price; // Add subtotal back to itself
                    //invoice_str += `<tr><td>${quantity}</td><td>${products_array[product_type][i].name}</td><tr>`;


                    str += `
                            <tr>
                            <td width="23%"><center><img src="${products_array[product_type][i].image}" style="width:120px; height:auto;"></center></td>
                            <td width="11%"><center>${products_array[product_type][i].name}</center></td>
                            <td align="center" width="11%">
                                <input name="cart[${product_type}][${i}]" value="${quantity}" ${products_array[product_type][i].quantity_available}">
                        
                                </td>
                            <td width="11%"><center>\$${products_array[product_type][i].price}</center></td>
                        </tr>
                        `;
                }
            };
        }
        //subtotal = 0; //subtotal starts off as 0
        //compute tax information
        var taxRate = 0.427; // this is the local sales tax 

        // compute shipping
        // subtotals up to $50 will have $4 shipping
        if (subtotal <= 30) {
            shipping = 4.50;

        }

        // subtotals over $30 get free shipping
        else if (subtotal >= 31) {
            shipping = 0;

        }

        //compute total 
        var total = taxRate + subtotal + shipping;

        str += `
                  <tr>
                  <td colspan="3" width="50%">&nbsp;</td>
                  </tr>
                  <tr>
                  <td>Subtotal</td>
                  <td>$${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                  <td>Tax @ 4.27%</td>
                  <td>$${taxRate.toFixed(2)}</td>
                  </tr>
                  <tr>
                  <td>Shipping</td>
                  <td>$${shipping.toFixed(2)}</td>
                  </tr>
                  <tr>
                  <td><b>Grand Total</b></td>
                  <td><b>$${total.toFixed(2)}</b></td>
                  </tr>
          </tbody>
          </table>
          <br>An email copy has been sent to ${user_info.email}</h3>
        <a href="./index.html">Shop More</a>
        <section class="return_policy">
        <b><br>General Shipment<br></b>
        <br>Tina's Stationery ships all orders within the US at a rate of $4.50 per order.
        <br>We provide free shipping for purchases over $30!
        <br>
        <br>© 2021 Tina's Stationery
    </section>
          </section>`;

        // set up mail server https://mailtrap.io/blog/nodemailer-gmail/
        // create a transporter variable for nodemailer
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'itm352student@gmail.com',
                pass: '!student!'
            }
        });

        // email format -> sends the invoice
        var mailOptions = {
            from: 'Tinas Stationery', //sender
            to: user_email, //receiver 
            subject: 'Thanks for your order!', // subject heading
            html: str //html body (invoice) 
        };

        // send email if successful, if not, alert an error message
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {

                email_msg = `<script>alert('Oops, ${user_info.name}. There was an error and your invoice could not be sent');</script>`;
                response.send(str + email_msg);

            } else {
                console.log('Email sent to: ' + info.response);
                email_msg = `<script>alert('Your invoice was mailed to ${user_email}');</script>`;
                response.send(str + email_msg);

            }
        });
    }
    //show invoice in str to see if it's there
    console.log(str);
    request.session.destroy();
});


// settings for sessions https://expressjs.com/en/resources/middleware/session.html --> credits to jacob graham for guidance 
app.use(session({
    secret: 'itm352!student!', // encrypt session
    resave: true,
    saveUninitialized: false,
    httpOnly: false,
    secure: true,
    ephemeral: true
}))

//this is a middleware (gets in the middle of request and response)
//document root, look for page in that directory (public)
app.use(express.static(__dirname + '/public'));
app.listen(8080, () => console.log(`listening on port 8080`));
function isNonNegInt(q, returnErrors = false) {
    errors = []; // assume no errors at first
    if (q == '') q = 0;
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    else {
        if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
        if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    }
    return returnErrors ? errors : (errors.length == 0);
}