var express = require('express');
var app = express();

app.use(express.urlencoded({ extended: true}));

app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + ' with qs ' + JSON.stringify(request.query));
    next();
});

app.post('/process_purchase', function (request, response, next) { 
    console.log(request.body);
    //validate quantities
    var q = request.body['quantity_textbox']; 
    if (typeof q != 'undefined') { 
    response.send(`Thank you for purchasing ${q} things!`); 
    } 
    // if valid, complete the purchase 

    // if not valid, send errors and go back to order page
    next();
}); 


app.use(express.static(__dirname + '/public')); 
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback