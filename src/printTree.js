const { isObject, ValidationError } = require("./utils.js");

function compose(tree, end, depths) {
  var i,
    ret = "\r\n";
  var c = end ? "└" : "├";
  if (tree.depth == 0) return tree.name;

  for (i = 1; i < tree.depth; ++i) ret += depths[i] ? "   " : "│  ";
  return ret + c + "─ " + tree.name;
}

function generate(tree, end, depths = []) {
  var result = compose(tree, end, depths);
  if (!tree.contents) return result;
  var last = tree.contents.length - 1;

  for (let i = 0; i < tree.contents.length; i++) {
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
