/* 
Name: Tina Vo
Due Date: 11/30/2021
Description: Server for Assignment 2
*/

//express takes querystring and turns into an object
var express = require('express');
//assigns express to the app variable
var app = express();
var querystring = require("querystring");
//load file system module
var fs = require('fs')
// get data from json file to variable called products_array
var products_array = require('./product_data.json');
var qString;
// save user_data.json to user_data variable
var user_data = './user_data.json'; // get data from user_data.json

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

// code based on lab 13 ex3
app.use(express.urlencoded({ extended: true }));
// monitor requests using for loop then send it to next thing (app.get)
// based on lab 13
app.all('*', function (request, response, next) {
    for (i = 0; i < products_array.length; i++) {
        console.log(request.method + ' to path ' + request.path);
    }
    next();
});
// GET request from product_data.js then creates a string from a variable
app.get("/product_data.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products_array = ${JSON.stringify(products_array)};`;
    response.send(products_str);
});
//express executes this post
app.post('/purchase', function (request, response, next) {
    //variables for data validation
    let POST = request.body;
    let randomValue = false; //amount that is put into textbox
    var errors = {}; //empty shopping cart
    qString = querystring.stringify(POST); // string the query together
    // check all the posted quantities
    for (i in products_array) {
        q = POST['quantity' + i];
        //quantity is not valid (negative number, random letters)
        if (isNonNegInt(q) == false) {
            errors['invalid_quantity' + i] = `${q} ${products_array[i].name} is not a valid quantity`;
        }
        // quantity greater than 0 is true
        if (q > 0) {
            randomValue = true;
        }
        //quantity greater than quantity available
        if (q > products_array[i].quantity_available) {
            errors['quantity_available' + i] = `${q} of ${products_array[i].name} is not available. Only ${products_array[i].quantity_available} available.`;
        }
    }
    // if randomValue == false then no quantities were selected
    if (randomValue == false) {
        errors['no_quantities'] = `You need to select some quantities!`;
    }
    // if errors is empty, go to invoice. otherwise go back to order page with errors
    if (Object.keys(errors).length == 0) {
        // purchase is valid, remove quantity available
        //checking inventory and concatenate post['quantity' + i]
        //refresh page after going back to check new quantity available
        for (i in products_array) {
            products_array[i].quantity_available -= Number(POST['quantity' + i]);
        }
        response.redirect("./login.html?" + qString); // goes to login if correct
    }
    else {
        // make error message from all errors
        var errorMessage_str = '';
        for (err in errors) {
            errorMessage_str += errors[err] + '\n';
        }
        response.redirect(`./products_display.html?errorMessage=${errorMessage_str}&` + qString); //goes to product_display if wrong (add sticky!)
        //response.redirect(`./products_display.html?errorMessage=${errorMessage_str}&` + qString)

        //response.redirect(`./products_display.html?errorMessage=${errorMessage_str}&sticky_quantity=${q}`);
    }
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

    if (typeof users_reg_data[username] != 'undefined') { // username and password shouldn't be undefined
        if (users_reg_data[username].password == request.body.password) {
            request.query.username = username;
            console.log(users_reg_data[request.query.username].name);
            request.query.name = users_reg_data[request.query.username].name; // go to invoice if username and password are correct
            request.query.email = users_reg_data[request.query.username].email; // put email in query
            let more_qString = querystring.stringify(request.query); // generate new query

            loginMessage_str = `Welcome ${username}, you are logged in!`; //message that displays after login
            response.redirect(`./invoice.html?loginMessage=${loginMessage_str}&` + qString + '&' + more_qString);

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
    
    //make username sticky when there's an error
    //redirect to invoice with message
    response.redirect(`./login.html?loginMessage=${incorrectLogin_str}&wrong_pass=${username}`);

    //query string before wrong_pass in case of errors
    //response.redirect(`./login.html?loginMessage=${incorrectLogin_str}&` + qString);
});

// --------------- registration page ------------------------
app.post("/process_register", function (request, response) {

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

    // character limitations (only letters)
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
        
        // remember user information if there are no errors
        var username = POST["username"];
        // empty basket of future usernames
        users_reg_data[username] = {};
        //request name, password, and email
        users_reg_data[username].name = request.body.name;
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;

        // stringify user's information
        data = JSON.stringify(users_reg_data); 
        fs.writeFileSync(user_data, data, "utf-8");
        request.query.name = users_reg_data[request.query.username].name; 
        request.query.email = users_reg_data[request.query.username].email; // define email
        let more_qString = querystring.stringify(request.query); // new query to add to response
        
        //message display after successful registration
        loginMessage_str = `Welcome ${username}, you are registered!`;
        //redirect to invoice with message
        response.redirect(`./invoice.html?loginMessage=${loginMessage_str}&` + qString + '&' + more_qString);

        console.log(POST, "account information");
    }
    // check for errors
    else {
        console.log('in post register', errors, request.body)
        //errors object for error message (search params)
        request.body.errors_obj = JSON.stringify(errors);
        
        //make sticky 
        request.query.StickyUsername = register_user.username;
        request.query.StickyName = register_user.name;
        request.query.StickyEmail = register_user.email;
        // redirect to register.html
        response.redirect("./register.html?" + querystring.stringify(request.body)); 

    }
});
//this is a middleware (gets in the middle of request and response)
//document root, look for page in that directory (public)
app.use(express.static('./public'));
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
