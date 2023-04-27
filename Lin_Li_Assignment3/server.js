/*
Author: Zenan Li & Kai Lin
Date: May 13th, 2022
Description: This is the server to accept and direct incoming requests through various routes.
*/

//Require express
var express = require('express');
var app = express();

//Create session
var session = require('express-session');
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

//Setup nodemailer
const nodemailer = require("nodemailer");
 
//Require file system package
fs = require('fs');
var products_array = require(__dirname + '/products.json');

//Parse JSON data
app.use(express.json())

//Post the retrieved product information from products.json file to another file called get_products_data.json
app.post("/get_products_data", function (request, response) {
    response.json(products_array);
});

//Post the selected product and its amount to the shopping cart
app.post("/get_cart_data", function (request, response) {
    if(typeof request.session.cart == 'undefined') {
        request.session.cart = {};
    }
    response.json(request.session.cart);
});

//Post the user info (email and username) to all the neccessary places
app.post("/get_user_info", function (request, response) {
    console.log(request.session.email,user_reg_info[request.session.email])
    let uinfo = {username:"Your Account",email:""};
    if (typeof request.session.email != 'undefined') {
        uinfo.email = request.session.email;
        uinfo.username = user_reg_info[uinfo.email].username
    }
    response.json(uinfo);
});

//Querystring package
var qs = require('querystring');

//Parsing incoming request bodies
var myParser = require("body-parser");
const req = require('express/lib/request');

//Establishing paths
const path = require('path');
const { append } = require('express/lib/response');
const { URLSearchParams } = require('url');

//---------Extra credit for Password Encryption!----------
//We only changed the password for itm352 user and Kai. Itm 352 is supposed to be grader and Kai is password but the user json file has the encrypted file.-----------
const { count } = require('console');
const e = require('express'); // For encryption
const { Cookie } = require('express-session');
//Will shift the password by 6
const shift = 6;
//Creates the function that is called upon in post.login below
function encrypt(password) {
    //Sets variables for the encrypted password
    var encrypt = [];
    var encrypted_password = "";
    for (var i = 0; i < password.length; i++) {
        encrypt.push(password.charCodeAt(i) + shift);
        encrypted_password += String.fromCharCode(encrypt[i]);
        //Goes through the passwords to save the new encrypted password
    }
    return encrypted_password;
    //Lookup online and inspired from https://www.youtube.com/watch?v=mgrAmgejz8A
}

//Taken and modified from lab12, exercise 5
app.use(myParser.urlencoded({ extended: true }));

//Start local server
app.listen(8080, () => console.log(`listening on port 8080`));

//Monitors and responds to all path requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to ' + request.path);
    if (typeof request.session.cart == 'undefined') {
        request.session.cart = {};
    }

    var backURL=request.header('referer');
    //Individual Requirement 1 - After login or register, the user is returned to the last page visited
    if (typeof backURL == "undefined") {backURL = '/invoice.html';}
    if (backURL.includes("login") == false && backURL.includes("register") == false && backURL.includes("update") == false) {
        request.session.lastpage = backURL;
        console.log(request.session.lastpage)
    }

    //Individual Requirement 1 - Going back to the last visited product page from an external website
    if (request.originalUrl.includes("products_display") == true) {
        request.session.lastproductpage = request.originalUrl;
        console.log("lastproductpage", request.session.lastproductpage)
    } 

    //Check if time since last activity on the website is greater than 15 minutes
    if (typeof request.session.activetime == "undefined") {
        request.session.activetime = Date.now();
    }                                           
    if (Date.now() - request.session.activetime > 15*60*1000 && typeof request.session.email != "undefined"){ // We input a automatic logout code that logs people out of 15 minutes
        request.session.email = undefined;
        request.session.activetime = undefined;
        var page_str = `<script>alert("You have been inactive for more than 15 minutes, so you have been logged out!"); location.href = "${request.session.lastpage}"</script>`
        response.send(page_str)
        return;
    } 
    next();
});

//Individual Requirement 1 - Route to get to the external page and back to the last visited product page
app.get('/', function (request, response, next) {
    console.log("at/", request.session.lastproductpage)
    if (typeof request.session.lastproductpage == "undefined") {
        response.redirect(request.session.lastpage)
    }
    else {response.redirect(request.session.lastproductpage)}
});

//Route all GET requests to static files in public directory
app.use(express.static(__dirname + '/public'));

//----------- Routing for Product Purchase -----------------------------
//Taken and modified from lab12, exercise 5
//This function serves to determine whether an entry of quantity is a number and a nonnegative integer before this input quantity gets saved and passed onto the login page.
function IsNonNegInt(q, returnErrors = false) {
var errors = [];
    if (q == "") {
        q = 0
            }
    else if (Number(q) != q) {
        errors.push('<font color="red"><h4><b>Not a number!</h4></b></font>');
            }// Check if string is a number value.
    else if (q < 0) {
        errors.push('<font color="red"><h4><b>Negative value!</b></h4></font>'); 
            }// Check if it is non-negative.
    else if (parseInt(q) != q) {
        errors.push('<font color="red"><h4><b>Not an integer!</b></h4></font>'); 
            }// Check if it is an integer.
    return (returnErrors ? errors : (errors.length == 0));
};

//Routing 
app.use(myParser.urlencoded({extended : true}));
app.post("/gotocart", function(request, response) {
    console.log(request.body);
    if (typeof request.body['purchase_submit'] != 'undefined') {
        // Assume the quantity is both valid and in stock
        var hasValidQuantities = true;
        var hasQuantities = false;
        var inStock = true;
        var this_product_key = request.body['this_product_key']; // Get the product key sent from the form post
        
    //Determine the validity of the input quantity based on the above logics and the IsNonNegInt and checkQuantities functions
    for (let i in products_array[this_product_key]){
        var qty = request.body[`quantity${i}`];
        hasQuantities = hasQuantities || qty > 0;
        hasValidQuantities = hasValidQuantities && IsNonNegInt(qty); 
        inStock = inStock && (Number(qty) <= products_array[this_product_key][i]["quantity_available"]);
        console.log (i, hasQuantities, hasValidQuantities, inStock)
    }

    console.log (products_array)

    let params = new URLSearchParams(request.body) // Attach purchase information in a query string

    if (hasQuantities == true && hasValidQuantities == true && inStock == true)
    {
    
     //Got help from Professsor Port   
        //Initialize the cart object if that cart object not initialized in session data, 
        if (typeof request.session.cart == 'undefined') {
            request.session.cart = {};
        }
        //Will input 0 as the value in the products array if there are no quantities are selected
        if (typeof request.session.cart[this_product_key] == 'undefined') {
            request.session.cart[this_product_key] = new Array(products_array[this_product_key].length).fill(0);
        }
        //Iterate through each product in the product key
        for (let i in request.session.cart[this_product_key]) {
        //Adds the quantity desired to the session informations and pairs it with the associated product key for the type of profuct
            request.session.cart[this_product_key][i] += Number(request.body[`quantity${i}`]);
        }
        alert_message = "Successfully Added to Cart"
    }
    else {
        alert_message = "Invalid Quantities. Please Enter Valid Quantities"
    }

    console.log('cart data: ', request.session.cart);
    //Redirect the user back to product display with query string params and if there are errors then the products page will alert them 
    var ref_URL = new URL(request.get('Referrer'));
    ref_URL.searchParams.set("msg", alert_message);
    response.redirect(ref_URL.toString());
};
})

//----------- Routing for User Login -----------------------------
//Code borrowed and modified from Kyle McWhirter's Assignment 2
var filename = "./user_data.json";

//Start with user logged out
var user_logged_in = false;

if (fs.existsSync(filename)) {
    data_str = fs.readFileSync(filename, 'utf-8');
    user_reg_info = JSON.parse(data_str);
    console.log(user_reg_info);// Outputs registered user information in the VS Code terminal
} else {
    console.log(filename + ' does not exist!');// Outputs "file does not exist" error message in the VS Code terminal
}

//Post purchase information to the login page; if the entered credential matches with what is stored in the user_data.json file, send to invoice.html; if not, send error messages to the user and stay in login.html.
app.post("/login", function (request, response) {
    let email = request.body.email.toLowerCase(); // Converts input email into lowercase format; as a result, the input email is case insensitive
    let login_password = encrypt(request.body['password']);
    var log_errors = []; // Start with no errors first

    console.log(login_password)

    //Check if user's email exists in the user_data.json file, if not alert the user
    if (typeof user_reg_info[email] == 'undefined') {
        log_errors['incorrect_email']=`${email} does not exist, Sign up! \n`
    }

    //If user email exists in the user_data.json file, then check whether the entered password also exists in the user_data.json file
    //If both entered email and password match with the currently stored information in the user_data.json file, then user login is successful
    //If entered password does not exist in the user_data.json file, alert the user and remain in login.html
    if (typeof user_reg_info[email] != 'undefined' && user_reg_info[email].password == login_password) {
        console.log('no log in errors');
    } else if(user_reg_info.password != login_password) {
        log_errors['incorrect_password']=`Incorrect password for ${email}. Please try again. \n`;
    }  

    let params = (new URLSearchParams(request.query)) // Search for the purchase information query string passed from products_display.html and continue to keep this string in login.html
    params.append('email', request.body.email) // In the same query string, attach the entered email after purchase information
    if (Object.keys(log_errors).length == 0) {
        params.append('username', user_reg_info[email].username) // In the same query string, attach the entered username after purchase information
        request.session['email'] = email;
        response.redirect(request.session.lastpage); // Direct the user to the referring page
        return
        } else {
            let log_error_string = '';
        for (err in log_errors) {
            log_error_string += log_errors[err]; // Accumulate all login errors
        }
        params.append("log_error_string", log_error_string)
        //In the same query string, attach all login errors after purchase information and the entered user email
        response.redirect('./login.html?' + params.toString());
        console.log(`${log_error_string}`);
    }
});

//----------- Routing for Logout----------------------
app.get("/logout", function (request, response, next) {
   //Logs the user out 
    request.session.email = undefined;
    //Redirect to the index.html page when user logs out
    response.redirect('./');
});

//----------- Routing for User Register -----------------------------
//Code borrowed and modified from Kyle McWhirter's Assignment 2
var user_logged_in = false;
app.post("/register", function (request, response) {
    //Define new email, name, password, and repeat password
    var email = request.body.email.toLowerCase(); // Registered email is case insensitive
    var username = request.body.username;
    var password = request.body.password;
    var confirm_password = request.body.password2;
    var reg_errors = {}; // Start with no errors

    //Validate email value
    //Email length must be between a minimum of 4 characters and a maximum of 30 characters
    if (email.length < 4 || email.length > 30) {
        reg_errors['email'] = 'Email must be between 4 and 30 characters.';
    } else if (email.length == 0) {
        reg_errors['email'] = 'Enter an email';
    };

    //Email can only have letters, numbers, and the @ symbol
    //.match from https://stackoverflow.com/questions/3853543/checking-input-values-for-special-symbols
    //Input pattern attributes for email validation from https://www.w3schools.com/TAGS/att_input_pattern.asp
    if (email.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/) == false) {
        reg_errors['email'] = `Email can only contain letters and numbers. `;
    }

    //Error: Email is already taken
    if (typeof user_reg_info[email] != 'undefined') {
        reg_errors['email'] = `Email is already taken.`;
    }

    //Validate user's full name
    //The user's full name cannot be more than 30 characters
    if (username == '') {
        reg_errors['username'] = `Enter your full name.`;
    }  else if (username.length > 30) {
        reg_errors['username'] = `Name cannot be more than 30 characters.`;
    }

    //Validate password value
    //Password must be at least 8 characters
    if (password == '') {
        reg_errors['password'] = `Enter a password.`;
    } else if (password.length < 8) {
        reg_errors['password'] = `Password is too short. \n`;
    }

    //Confirm and repeat entered password
    if (confirm_password == '') {
        reg_errors['password2'] = `Reenter your password.`;
    } else if (password == confirm_password) {
        console.log('passwords match');
    } else {
        reg_errors['password2'] = `Passwords do not match, please try again.`;
    }

    //Validate email value
    if (email == '') {
        reg_errors['email'] = `Enter your email.`; // If there is no email entered, then alert new user
    }
    //Email validation taken from https://www.w3resource.com/javascript/form/email-validation.php
    else if (email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        console.log(`email is ${email}`);
    } else {
        reg_errors['email'] = `Email is invalid.`;
    }

    //If there are no errors, then add new user's registration information to user_data.json and redirect new user to invoice.html
    let params = (new URLSearchParams(request.query))
    params.append('email', request.body.email);
    params.append('username', request.body.username);
    if (Object.keys(reg_errors).length == 0) {
        user_reg_info[email] = {};
        user_reg_info[email].username = request.body.username;
        user_reg_info[email].password = request.body.password;
        fs.writeFileSync(filename, JSON.stringify(user_reg_info));
        user_logged_in == true;
        request.session['email'] = email;
        response.redirect(request.session.lastpage); // Direct the user to the referring page
        return
    } else {
        let reg_error_string = ''
        // Generate log-in error message
        request.body.reg_errors= JSON.stringify(reg_errors)
        params.append('reg_error_string', JSON.stringify(reg_errors)) // Append all log-in errors to the same query string as the purchase information and the entered user email's
        response.redirect('./register.html?' + qs.stringify(request.body));
        console.log(`${reg_error_string}`);
    }
});

//----------- Routing for User Update -----------------------------
//Code borrowed and modified from Kyle McWhirter's Assignment 2
app.post("/update", function (request, response) {
    var email = request.body.email.toLowerCase();
    var username = request.body.username;
    var password = request.body.password;
    var confirm_password = request.body.password2;
    var upd_errors = {}; // Start with no errors

//If the entered email does not exist in the user_data.json file, then update is unsuccessful, and alert user
if (typeof user_reg_info[email] == 'undefined') {
    upd_errors[`incorrect_email`] = `${email} does not exist, Sign up! `;
}

//Input pattern attributes for email validation is taken from https://www.w3schools.com/TAGS/att_input_pattern.asp
if (email.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/) == false) {
    upd_errors[`email`] = `Email can only consist of letters and numbers. `;
}

//Validate email value
//Email length must be a minimum of 4 characters and a maximum of 30 characters
if (email.length < 4 || email.length > 30) {
    upd_errors[`email`] = `Email must be between 4 and 30 characters. `;
} else if (email.length == 0) {
    upd_errors[`email`] = `Enter an email. `;
}

//Validate password value
//Password must be at least 8 characters 
if (password == 'undefined') {
    upd_errors[`password`] = `Enter a password. `;
} else if (password.length < 8) {
    upd_errors[`password`] = `Password is too short. `;
}

//Confirm and repeat entered password
if (confirm_password == 'undefined') {
    upd_errors[`passwordReenter`] = `Reenter your password. `;
} else if (password == confirm_password) {
    console.log('passwords match');
} else {
    upd_errors[`passwordReenter`] = `Passwords do not match, please try again. `;
}

//Validate email value
if (email == 'undefined') {
    upd_errors[`email`] = `Enter your email. `;
}

//Validate user's full name
//The user's full name cannot be more than 30 characters
if (username == 'undefined') {
    upd_errors[`name`] = `Enter your full name. `;
} 
else if (username.length > 30) {
    upd_errors[`name`] = `Name cannot be more than 30 characters. `;
}

//If there are no errors, and the entered email matches with the stored email in the user_data.json file, then add the updated information to user_data.json and redirect user to invoice.html
let params = (new URLSearchParams(request.query));
if (Object.keys(upd_errors).length == 0 && typeof user_reg_info[email] != 'undefined') {
    user_reg_info[email] = {};
    user_reg_info[email].username = request.body.username;
    user_reg_info[email].password = request.body.password;
    fs.writeFileSync(filename, JSON.stringify(user_reg_info), "utf-8");
    user_logged_in == true;
    request.session['email'] = email;
    response.redirect(request.session.lastpage); // Direct the user to the referring page
        return
}  else {
        //Generate update error message
        let upd_error_string = '';
        for (err in upd_errors) {
            upd_error_string += upd_errors[err]; // Accumulate all update errors
        }
    params.append('upd_error_string', upd_error_string) 
    response.redirect('./update.html?' + params.toString()); // Append all update errors to the same query string as the purchase information and the entered user email's
    console.log(`${upd_error_string}`);
    } 
});

//---------Routing for Update Cart Button-----------
app.post("/updatecart", function (request, response, next) {
    //Makes the session cart equal to new the cart_update amount
    request.session.cart = request.body.cart_update;
    console.log(request.session.cart, request.body)
 //Redirect to the invoice page after updating the amounts
 response.redirect('./invoice.html');
 });

//----------- Routing for Final Purchase Button (Had help from Professor Port)----------------------
app.post('/finalize_purchase', function (request, response) {
    console.log(request.body);
    //Add Reviews from purchase (Got help from professor port)
    for (let pkey in request.body.reviews){
        for (let i in request.body.reviews[pkey]){
            let review = request.body.reviews[pkey][i];
            if (review > 0){
                products_array[pkey][i].stars.push(Number(review));
            }
        }
    }

    //For sending email to user 
    var invoice_str = `Thank you for shopping with Zenan's Sports Shop. Please come again!
    <table class="table custom-table m-0">
    <thead>
        <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Extended Price</th>
        </tr>
    </thead>`

    var cart_amount = request.session.cart;
    var subtotal = 0;
    var quantities = [];
    //go through items in cart
    for (let this_product_key in cart_amount) {
        quantities = cart_amount[this_product_key];
        for (let i in quantities) { //loops through all products to output product info of the purchased product(s)
            var extended_price = products_array[this_product_key][i]['price'] * quantities[i];
            subtotal = subtotal + extended_price;
                if (quantities[i] != 0) {
                    invoice_str +=` 
                        <tr>
                        <td>${products_array[this_product_key][i]['name']}</td>
                        <td>${quantities[i]}</td>
                        <td>$${products_array[this_product_key][i]['price'].toFixed(2)}</td>
                        <td>$${(products_array[this_product_key][i]['price'] * quantities[i]).toFixed(2)}</td>
                        </tr>`
                        }
                    }
                }
            var shipping = 0; //shipping
                if (subtotal < 99.99) { //subtotal if less than $99.99
                    shipping = 5;
                    } else if (subtotal >= 100 && subtotal < 199.99) { //subtotal if less than $199.99 and over $100
                    shipping = 8;
                    } else if (subtotal >= 200) { //subtotal if greater than or equal to $200
                    shipping = subtotal * 0.05;
                    }
            var tax = (subtotal * 0.04712); //tax
            var total = (subtotal + shipping + tax) //calculating grand total
            invoice_str += 
                `<tr>
                <td colspan='3'>Subtotal</td>
                <td>$${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                <td colspan='3'>Tax (4.712%)</td>
                <td>$${tax.toFixed(2)}</td>
                </tr>
                <tr>
                <td colspan='3'>Shipping</td>
                <td>$${shipping.toFixed(2)}</td>
                </tr>
                <tr>
                <th colspan='3'>Total</th>
                <td>$${total.toFixed(2)}</td>    
                </tr>`
        console.log(invoice_str);

            //For Tracking Inventory 
        var updated_quantity = request.session.cart
        for (let this_product_key in products_array) {
        for (let i in updated_quantity[this_product_key]) {
            if (typeof updated_quantity[this_product_key][i] != 'undefined') 
            //Make variable remove_quantitiy to remove the amount that was purchased
            remove_quantity= updated_quantity[this_product_key][i];
            //Deducts the remove_quantity from the current available quantity 
            products_array[this_product_key][i]["quantity_available"] -= remove_quantity;
        } 
    }

    
        var user_email = request.session.email; //Saves the user's email as a variable
        console.log(user_email);

        var user_name = user_reg_info[user_email].username; //Retrieving the username from user_reg_info and puts it as the email subject 
        console.log(user_name)

    
    //Stringify the Products_array object that has the updated inventory
    updated_inventory = JSON.stringify(products_array);
    //Rewrites the quantitiy available with the updated inventory into the products.json file
    fs.writeFileSync('./products.json', updated_inventory);
    
        //Borrowed from the code example on the class server)
        var transporter = nodemailer.createTransport({
            //Sets up a mail server and has it function only on the UH network for security
            host: "mail.hawaii.edu",
            port: 25,
            secure: false,
            tls: {
                //Do not fail on invalid certifications
                rejectUnauthorized: false
            }
        });
        
        var mailOptions = {
            from: 'kailin2@hawaii.edu',
            to: user_email,
            subject: `Thank you for your order, ${user_name}`, // Message in the email if invoice sent
            html: invoice_str
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                invoice_str = `<script>alert('An error has occured and a email could not be sent!');location.href="/index.html"</script>`;// Message if invoice could not be sent
            } else {
                invoice_str = `<script>alert('A copy of your invoice was sent to ${user_email}');location.href="/index.html"</script>`;
            }
            response.send(invoice_str);
        });

        //Deletes the session after email is sent
        request.session.destroy(); 
});

