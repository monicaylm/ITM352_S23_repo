//Description!
//Author: Zenan Li & Kai Lin
//Date: May 13, 2022
//Description: File to write and store functions that are used for our website

// This function asks the server for a "service" and converts the response to text. 
function loadJSON(service, callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('POST', service, false);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
}

// This function makes a navigation bar from a products_data object
function nav_bar (this_product_key, products_array) {
    // This makes a navigation bar to other product pages
    for (let products_key in products_array) {
        if (products_key == this_product_key);
        document.write(`<li><a href='./products_display.html?products_key=${products_key}'>${products_key}<a></li>`);
    }
}
//Function takes all the items that are added to cart and makes it into a number for the total number of items which is then displayed in the nav bar
function cart_total (the_cart) {
    var total_items = 0
    for (let pkey in the_cart) {
        for (let i in the_cart[pkey]) {
            total_items += Number(the_cart[pkey][i]);
        }
    } 
    return total_items;
}

//Function to guard so that a user can't complete purchase with 0 items in their cart. If they are logged in and that cart has atleast one item then they are redirected to purchase.html
function checkinvoice() {
    if (cart_total(cart_amount) == 0) {
            window.alert("Please add items to cart for purchase")
        } else  {
            window.location = './purchase.html'
        }
    };

