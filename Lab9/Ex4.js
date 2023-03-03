var attributes = "Monica;19;19+0.5;0.5-19";
var pieces = attributes.split(";");
for(let part of pieces) {
    console.log(part, isNonNegIint(part));
}

function isNonNegInt(q){
    errors = []; // assume no errors at first
if(Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
if(q < 0) errors.push('Negative value!'); // Check if it is non-negative
if(parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer

return (errors.length == 0);
}

