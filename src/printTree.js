const { isObject } = require("./utils.js");

function flatten(arr, result = []) {
  for (let i = 0, length = arr.length; i < length; i++) {
    if (Array.isArray(arr[i])) flatten(arr[i], result);
    else result.push(arr[i]);
  }
  return result;
}

function prefixChild(strs, last) {
  return strs.map(function (s, i) {
    var prefix = i === 0 ? (last ? "└─" : "├─") : last ? "  " : "│ ";
    return prefix + s;
  });
}

function stringifyTree(tn) {
  var contents = (tn.contents || []).slice();
  if (contents.length === 0) return ["─ " + tn.name];
  return ["┬ " + tn.name].concat(
    flatten(
      contents.map(function (c, i) {
        var strs = stringifyTree(c);
        return prefixChild(strs, i === contents.length - 1);
      })
    )
  );
}

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

module.exports = function printTree(tree, connect = false) {
  if (!isObject(tree)) throw Error("Invalid FileTree");
  if (!connect) var out = generate(tree);
  else var out = stringifyTree(tree).join("\n");
  if (typeof out !== "string") throw Error("Could not print FileTree");
  return out;
};
