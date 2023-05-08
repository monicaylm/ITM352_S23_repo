/*
Authors: Monica Mau, Le Yi Feng Zheng, Brandon Ramos
Assignment 3
Date: 5/12/2023
Description: js file to hold functions
 */

// This function asks the server for a "service" and converts the response to text - referenced from Assignment 3 code examples
function loadJSON(service, callback) {
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open("POST", service, false);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {
			// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
			callback(xobj.responseText);
		}
	};
	xobj.send(null);
}

function navBar() {
	document.write(`
    <img src="./images/logo.png" class="logo">
    <script>
        for (let key in products) {
            document.write(\`<li style="list-style-type: none;"><a href="./products_display.html?product_type=\${key}">\${key}</a></li>
            \`);
        }
    </script>
`);
}

// function to get cookies - referenced from w3 schools
function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function loginButton() { // assisted by Prof Port & ChatGPT
	var cart;
    loadJSON('get_cart', function (response) {
      // Parsing JSON string into object
      cart = JSON.parse(response);
    });

    var cart_qty = 0;
    for (let product_type in cart) {
        for (let i = 0; i < cart[product_type].length; i++) {
            cart_qty += Number(cart[product_type][i]);
        }
    };

    document.write(`
        <div class="login">
            <script>
                if (getCookie("name") == "") {
                    document.write(\`<a href = 'login.html'">Login</a>\`);
                } else {
                    document.write(\`<a onclick='
                    document.cookie = "userid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    href = "/logout"'>Logout \${getCookie("name")}</a>\`);
                }
            </script>
            <a href="./cart.html">
                <i class='fas fa-shopping-cart'></i>
                (${cart_qty})
            </a>
        </div>
    `);
}
