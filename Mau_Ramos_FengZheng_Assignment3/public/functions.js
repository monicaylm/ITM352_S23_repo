/*
Authors: Monica Mau, Le Yi Feng Zheng, Brandon Ramos
Assignment 3
Date: 5/12/2023
Description: js file to hold functions
 */

// functions referenced from Assignment 3 code examples
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

function nav_bar(products_key, products) {
    // This makes a navigation bar to other product pages
    for (let products_key in products) {
        if (products_key == this_product_key) continue;
        document.write(`<a href='./display_products.html?products_key=${products_key}'>${products_key}<a>&nbsp&nbsp&nbsp;`);
    }
}

function navbar(key, products) {
    document.write(`<div id="nav"><ul style="list-style-type: none;">`);
    for(let key in products) {
        document.write(`<li style="list-style-type: none;"><a href="./products_display.html?product_type=${key}">${key}</a></li>`)};
};