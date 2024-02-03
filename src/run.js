const printTree = require("./printTree.js");
const scanDir = require("./scan.js");

scanDir("H:/Meine_Daten/Source/VSCode/packageStats").then(function (tree) {
  console.log(printTree(tree[0], true));
});
