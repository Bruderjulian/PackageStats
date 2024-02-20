
var PathCache = {};
var EntryCache = {};

export async function displayEntry(entry, path) {
  if (arguments.length == 2) {
    if (typeof path !== "string") throw SyntaxError("Invalid Object path");
    if (!isObject(entry)) throw SyntaxError("Invalid Tree Object");
    if (PathCache.hasOwnProperty(path)) return PathCache[path];
    entry = findEntry(entry, path);
    if (!isObject(entry)) throw Error("Could not find Entry at:" + path);
    var out = format(entry);
    PathCache[path] = out;
  } else if (arguments.length == 1) {
    if (EntryCache.hasOwnProperty(entry.fullPath)) return EntryCache[entry.fullPath];
    var out = format(entry);
    EntryCache[entry.fullPath] = out;
  }
  return out;
}

export function format(entry) {
  if (!isObject(entry)) throw SyntaxError("Invalid Entry to display");
  var displayObj = {};
  for (const i of Object.keys(entry)) displayObj[i] = entry[i];
  if (entry.contents) displayObj.contents = entry.contents.map((a) => a.name);
  displayObj.size = convertSize(entry.size);
  var str = JSON.stringify(displayObj, null, 4)
    .replaceAll('"', "")
    .replaceAll(",", "");
  str = str.substring(2, str.length - 1);
  return str;
}

var SizeNames = ["B", "KB", "MB", "GB", "TB"];
function convertSize(size) {
  if (typeof size !== "number" || isNaN(size)) return size;
  var i = Math.floor(Math.max(Math.log10(size), 0) / 3);
  var num = roundTo(size / 1000 ** i, 3);
  return num + " " + (SizeNames[i] || "10^" + i + " B");
}

function roundTo(num, percision = 3) {
  if (typeof num !== "number" || typeof percision !== "number") return num;
  let exponent = 10 ** percision;
  return Math.round(num * exponent) / exponent;
}


function findEntry(tree = {}, path = "") {
  var properties = path.split(".").slice(1);
  if (properties.at(-1).includes("?")) {
    properties[properties.length - 1] = properties[properties.length - 1].replaceAll("?", ".");
  }
  if (!tree || !tree.contents || !properties || properties.length == 0) return;
  if (properties[0].replaceAll(" ", "") == "") return tree.contents;
  if (!tree.contents.map(a => a.name).includes(properties[0])) return filterTree(tree, properties[0]);
  return findEntryByPath(tree, properties);
}

function filterTree(obj, name) {
  if (!isObject(obj)) return undefined;
  if (isEqual(obj.name, name)) return obj;
  if (!Array.isArray(obj.contents)) return undefined;
  let i, entry, len = obj.contents.length;
  for (i = 0; i < len; i++) {
    if (!isObject(obj.contents[i])) continue;
    entry = filterTree(obj.contents[i], name);
    if (entry) return entry;
  }
}

function findEntryByPath(tree, properties) {
  let i, j;
  let len = tree.contents.length;
  for (i = 0; i < properties.length; i++) {
    if (properties[i] == "") {
      tree = tree.contents[0];
      continue;
    }
    for (j = 0, len = tree.contents.length; j < len; j++) {
      if (!isObject(tree.contents[j]) || !isEqual(tree.contents[j].name, properties[i])) continue;
      tree = tree.contents[j];
      break;
    }
  }
  return tree;
}

function isObject(obj) {
  return typeof obj == "object" && !Array.isArray(obj) && obj !== null;
}

function isEqual(str1, str2) {
  if (typeof str1 !== "string" || typeof str2 !== "string") return false;
  return str1.toString().toLowerCase() == str2.toString().toLowerCase();
}