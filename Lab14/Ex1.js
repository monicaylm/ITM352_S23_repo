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

app.use(express.urlencoded({ extended: true }));

// route to set a cookie 
app.get("/set_cookie", function (request, response) {
    var myname = "Dan";
    response.cookie('users_name', myname, {'maxAge': 10*1000});
    response.send(`${myname} coookei sent!`);
 });

 // route to use a cookie 
app.get("/use_cookie", function (request, response) {
    console.log(request.cookies);
    // get name from cookie 
    var the_name = request.cookies["users_name"]; 

    response.send(`Welcome to the Use Cookie page ${the_name}`);
 });

app.get("/login", function (request, response) {
    // Give a simple login form
    str = `
<body>
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
            response.send(` ${username} logged in`);
        } else {
            response.send(`invalid password`);
        }

    } else {
        response.send(`${username} does not exist`);
    }
});

app.listen(8080, () => console.log(`listening on port 8080`));