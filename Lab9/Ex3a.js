var attributes = "Monica;19;19+0.5;0.5-19";
var pieces = attributes.split(";");

for(let part of pieces) {
console.log(part, typeof part);
}
console.log(pieces.join(","))