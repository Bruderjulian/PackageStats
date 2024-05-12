var PathCache = {};
var EntryCache = {};

export function displayEntry(entry, path) {
  if (arguments.length >= 2) {
    if (typeof path !== "string")
      throw new ValidationError("Invalid Object path");
    if (!isObject(entry)) throw new ValidationError("Invalid Tree Object");
    if (PathCache.hasOwnProperty(path)) return PathCache[path];
    entry = findEntry(entry, path);
    if (!isObject(entry)) throw EvalError("Could not find Entry at:" + path);
    var out = format(entry);
    PathCache[path] = out;
  } else if (arguments.length == 1) {
    if (EntryCache.hasOwnProperty(entry.fullPath))
      return EntryCache[entry.fullPath];
    var out = format(entry);
    EntryCache[entry.fullPath] = out;
  }
  return out;
}

export function format(entry) {
  if (!isObject(entry)) throw new ValidationError("Invalid Entry to display");
  var displayObj = {};
  for (const i of Object.keys(entry)) displayObj[i] = entry[i];
  if (entry.contents) displayObj.contents = entry.contents.map((a) => a.name);
  displayObj.size = convertSize(entry.size);
  var str = JSON.stringify(displayObj, null, 4)
    .replaceAll('"', "")
    .replaceAll(",", "")
    .replaceAll("    ", "  ");
  str = str.substring(2, str.length - 1);
  return str;
}

var SizeNames = ["B", "KB", "MB", "GB", "TB"];
function convertSize(size) {
  if (typeof size !== "number" || isNaN(size)) return size;
  var i = Math.floor(Math.max(Math.log10(size), 0) / 3);
  var num = roundTo(size / 1000 ** i, 1);
  return num + " " + (SizeNames[i] || "10^" + i + " B");
}

function roundTo(num, percision = 3) {
  if (typeof num !== "number" || typeof percision !== "number") return num;
  let exponent = 10 ** percision;
  return Math.round(num * exponent) / exponent;
}

function findEntry(tree = {}, path = "") {
  var properties = path.split(".").slice(1);
  properties = properties.map((val) => {
    return val.replaceAll("?", ".");
  });
  if (!tree || !tree.contents || !properties || properties.length == 0) return;
  if (properties[0].replaceAll(" ", "") == "") return tree;
  if (!tree.contents.map((a) => a.name).includes(properties[0])) {
    let out = filterTree(tree, properties[0]);
    if (out) return out;
    return filterTree(tree, properties[0], true);
  }
  return findEntryByPath(tree, properties);
}

function filterTree(obj, name, checkloose = false) {
  if (!isObject(obj)) return;
  if (isEqual(obj.name, name, checkloose)) return obj;
  if (!Array.isArray(obj.contents)) return;
  let i, entry, len;
  for (i = 0, len = obj.contents.length; i < len; i++) {
    if (!isObject(obj.contents[i])) continue;
    entry = filterTree(obj.contents[i], name, checkloose);
    if (entry) return entry;
  }
}

function findEntryByPath(tree, properties) {
  let i, j, len2, len;
  for (i = 0, len = properties.length; i < len; i++) {
    if (properties[i] == "") {
      tree = tree.contents[0];
      continue;
    }
    for (j = 0, len2 = tree.contents.length; j < len2; j++) {
      if (
        !isObject(tree.contents[j]) ||
        !isEqual(tree.contents[j].name, properties[i])
      ) {
        continue;
      }
      tree = tree.contents[j];
      break;
    }
  }
  return tree;
}

function isObject(obj) {
  return typeof obj == "object" && !Array.isArray(obj) && obj !== null;
}

function isEqual(str1, str2, checkloose = false) {
  if (typeof str1 !== "string" || typeof str2 !== "string") return false;
  str1 = str1.toString().toLowerCase();
  str2 = str2.toString().toLowerCase();
  if (!checkloose) return str1 == str2;
  else return str1.includes(str2) || str2.includes(str1);
}

class ValidationError extends Error {
  constructor(message = "", ...args) {
    super(message, ...args);
    this.message = "Error at Validation: " + message;
  }
}
