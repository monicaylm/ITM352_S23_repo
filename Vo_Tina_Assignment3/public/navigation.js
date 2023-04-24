/*
Author: Tina Vo 
Date Due: 12/14/2021 
Description: javascript for navigation bar -> products_display
 */


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

 //load the navigation bar as a function
function navigationbar() {

//nav of products
    document.write(`
   <div id="nav">
    <ul style="list-style-type: none;">`);

    for(let p_key in products_array) {
        document.write(`
    <li style="list-style-type: none;"><a href="./products_display.html?prod_key=${p_key}">${p_key}</a></li>
  
    `);
    }
} 

function navigationbar2() {
//nav of login, logout, and cart
  //get total quantities in cart
    //make p_key local
   var num_of_items_cart = 0;
    for(let p_key in cart) {
        for(let i in cart[p_key]) {
            num_of_items_cart += Number(cart[p_key][i]);
        }
    }

    if (getCookie('user_info') == false) {
        document.write(`
    
        </ul>
        </div>
    
       
        <div id="topnav_right">
    
            <a href="./login.html"><i class="fa fa-user-o" aria-hidden="true"></i></i> </a>
            <a href="./shopping_cart.html"><i class="fa fa-fw fa-shopping-cart"></i>(${num_of_items_cart})</a>
            </div>
            `);
        }
        else {
            document.write(`
            <div id="topnav_right2">

            <a href="/logout"><i class="fa fa-sign-out" aria-hidden="true"></i></a>
            <a href="./shopping_cart.html"><i class="fa fa-fw fa-shopping-cart"></i>(${num_of_items_cart})</a>
      
          
                </div>
                `);
        }
    }

