var attributes = "Monica;19;19+0.5;0.5-19";
var pieces = attributes.split(";");
for(let part of pieces) {
    console.log(part, findNonNegInt(part));
}

function findNonNegInt(q, returnErrors = false){ //the function returns non-negative integers in the object.
    errors = []; // assume no errors at first
if(Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
if(q < 0) errors.push('Negative value!'); // Check if it is non-negative
if(parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer

return returnErrors ? errors : (errors.length == 0);
}

