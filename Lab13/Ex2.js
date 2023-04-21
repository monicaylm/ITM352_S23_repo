// load file system interface
var fs = require("fs");
var filename = __dirname + "/user_data.json";

if (fs.existsSync(filename)) {
	var fsize = fs.statSync(filename).size;
	console.log(`user_data.json has ${fsize} characters!`)
	// read in user data
	var user_data_obj_JSON = fs.readFileSync(filename, "utf-8");

	// convert user data JSON to object
	var user_data = JSON.parse(user_data_obj_JSON);

	// get password for user kazman
	var username = "kazman";
	console.log(
		`The password for user ${username} is ${user_data[username].password}`
	);
} else {
	console.log(`Hey! I couldn't find ${filename} :(`);
}
