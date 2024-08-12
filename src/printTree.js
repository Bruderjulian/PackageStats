const { isObject, ValidationError } = require("./utils.js");

function compose(tree, end, depths) {
  var result = "\r\n";
  if (tree.depth == 0) return tree.name;
  for (let i = 1, depth = tree.depth; i < depth; ++i) {
    result += depths[i] ? "   " : "│  ";
  }
  return result + (end ? "└" : "├") + "─ " + tree.name;
}

function generate(tree, end, depths = []) {
  var result = compose(tree, end, depths);
  if (!tree.contents) return result;
  var last = tree.contents.length - 1;
  var len = tree.contents.length;
  for (let i = 0; i < len; i++) {
    depths[tree.contents[i].depth] = i == last;
    result += generate(tree.contents[i], i == last, depths);
  }
  return result;
}

module.exports = function printTree(tree) {
  if (!isObject(tree)) throw new ValidationError("Invalid FileTree");
  var out = generate(tree);
  if (typeof out !== "string") throw new ValidationError("Could not print FileTree");
  return out;
};
