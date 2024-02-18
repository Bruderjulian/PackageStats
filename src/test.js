const { parseExclude } = require("./utils");

console.log(parseExclude("some.js").toString());
console.log(parseExclude("%some.js").toString());
console.log(parseExclude("%!some.js").toString());
console.log(parseExclude("!some.js").toString());
console.log(parseExclude("regex:some.js").toString());
console.log(parseExclude("file:/./ignore.json").toString());
console.log(parseExclude("%file:/./ignore.json").toString());
