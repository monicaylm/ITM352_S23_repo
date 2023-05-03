var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var session = require('express-session'); 
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true})); 
 //Code from Lab FILEIO ex2b.js

    // load file system interface
    var fs = require('fs');
    var filename =  __dirname + '/user_data.json';

    //open file only if it exists
    if (fs.existsSync(filename)){
        //print object stat size
        var fsize = fs.statSync(filename)
        console.log(`user_data.json has ${fsize} characters.`);
        // read in user data
        var user_data_obj_JSON = fs.readFileSync(filename,'utf-8');
        // convert user data JSON to object 
        var user_data = JSON.parse(user_data_obj_JSON);
        // get password for user kazman
        var username = 'kazman';
        console.log(`The password for ${username} is ${user_data[username].password}`);
    }
    else {
        console.log(`Hey I couldn't find ${filename}`);
    }
//end of code from ex2b.js

// route to set a cookie
app.get("/use_session", function (request, response) {
    delete request.session[`lastLogin`];
    response.send(`Welcome, your session id is ${request.sessionID}`);
})
// route to set a cookie
app.get("/set_cookie", function (request, response) {
    var username = "Monica";
    response.cookie("user_id", username, {maxAge: 20000});
    response.send(`${username} cookie sent`)
})
// route to use a cookie
app.get("/use_cookie", function (request, response) {
    console.log(request.cookies);
    var the_name = request.cookies[`user_id`];//get name from the cookie
    response.send(`Welcome to the Use Cookie Page ${the_name}`)
})

//
app.get("/login", function (request, response) {
    // check if last login is in users session
    var lastTimeLogin = `First time!`;
    if(typeof request.session[`lastLogin`] != 'undefined') {
        lastTimeLogin = request.session[`lastLogin`];
    }
    if(request.cookies.hasOwnProperty('username')) {
        username_welcome = `Welcome ${username}`;
    }
app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    console.log(request.body);
    var username = request.body["username"];
    var password = request.body["password"];
    //check if username is in user_data
    if(user_data.hasOwnProperty(username)){
        //get users info
        var user_info = user_data[username];
        //check if password entered is the password saved
        if(password == user_info.password){
            var loginDate = (new Date()).toString();
        // add lastLogin to session
            request.session[`lastLogin`] = loginDate;
            response.send(` ${username} is logged in on ${loginDate}`);
            console.log(request.session);
        } else {
            response.send(`Invalid password`);
        }
        response.send(`Password for ${username} is ${user_info.password}`);
       // response.send(`Got ${username}`);
    } else{
        response.send(`${username} does not exist.`)
    }    // Give a simple login form
    str = `
<body>
<br>
You last logged in on ${lastTimeLogin} 
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



//post registration 
app.post("/registration", function (request, response) {

});
    
});

app.use(express.urlencoded({ extended: true }));

app.listen(8080, () => console.log(`listening on port 8080`));