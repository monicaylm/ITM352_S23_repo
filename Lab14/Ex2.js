var express = require('express');
var app = express();

// load file system interface
var fs = require('fs');
var filename = __dirname + '/user_data.json';
//var user_data = require(filename);


if (fs.existsSync(filename)) {
    var fsize = fs.statSync(filename).size;
    console.log(` user_data.json has ${fsize} characters`);
    // read in user data
    var user_data_obj_JSON = fs.readFileSync(filename, 'utf-8');
    // covert user data JSON to object
    var user_data = JSON.parse(user_data_obj_JSON);
    // get password for user kazman
    var username = 'kazman';
    console.log(`The password for user ${username} is ${user_data[username]['password']}`);
} else {
    console.log(`Hey! I couldn't find ${filename}`);
}

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var session = require('express-session');

app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

app.use(express.urlencoded({ extended: true }));

// route to set a cookie 
app.get("/use_session", function (request, response) {
    response.send(`Welcome, your session ID is ${request.sessionID}`)
 });

 // route to use a cookie 
app.get("/use_cookie", function (request, response) {
    console.log(request.cookies);
    // get name from cookie 
    var the_name = request.cookies["users_name"]; 

    response.send(`Welcome to the Use Cookie page ${the_name}`);
 });

app.get("/login", function (request, response) {
    console.log(request.session);
    // check if last login is in requester's session
    var lastlogin = "first login!"
    if (typeof request.session["lastlogin"] != "undefined"){
        lastlogin = request.session["lastlogin"]
    };
    // Give a simple login form
    str = `
<body>
You last logged in on ${lastlogin}!
<br>
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
 });

app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    console.log(request.body);
    var username = request.body["username"];
    var password = request.body["password"];
    // check if username is in user_data
    if(user_data.hasOwnProperty(username)) {
        // get users info
        var user_info = user_data[username];
        // check is password entered is the password saved
        if(password == user_info.password) {
            var loginDate = [new Date()].toString();
            response.send(` ${username} logged in on ${loginDate}`);
            // add lastlogin to session
            request.session["lastlogin"] = loginDate;
            console.log(request.session);
        } else {
            response.send(`invalid password`);
        }

    } else {
        response.send(`${username} does not exist`);
    }
});

app.listen(8080, () => console.log(`listening on port 8080`));