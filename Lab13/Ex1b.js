// load file system interface
var fs = require("fs");
var filename = __dirname + "/user_data.json";

// read in user data
var user_data_obj_JSON = fs.readFileSync(filename, "utf-8");

// convert user data JSON to object
var user_data = JSON.parse(user_data_obj_JSON);

// get password for user kazman
var username = "kazman";
console.log(
	`The password for user ${username} is ${user_data[username].password}`
);
