// load file system interface
var fs = require('fs');
var filename = __dirname + '/user_data.json';

// read in user data
var user_data = require(filename);

// get password for user kazman

var username = "kazman";
console.log(
	`The password for user ${username} is ${user_data[username].password}`
);
