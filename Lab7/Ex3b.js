require("./products_data.js");

var num_products = 5;

for (var prod_number = 1; eval("typeof name" + prod_number) != 'undefined'; prod_number++) {
	if (prod_number > 0.25 * num_products && prod_number < 0.75 * num_products) {
		console.log(`${eval('name' + prod_number)} is sold out!`)
		continue;
	}
	console.log(prod_number + '.' + eval("name" + prod_number));
	
	if (prod_number > num_products / 2) {
		console.log(`Don't ask for anything else!`);
		process.exit();
	}
}
console.log(`That's all we have!`);
