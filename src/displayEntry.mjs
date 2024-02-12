var fileTree;
var cache = {};
var parsedTree = fileTree
  ? JSON.parse(JSON.stringify(fileTree)).default
  : undefined;

function displayEntry(name = "", tree) {
  if (cache.hasOwnProperty(name)) return cache[name];
  if (!fileTree)
    import("../fileTree.json").then(function (value) {
      fileTree = value;
      console.log(value);
    });
  if (!fileTree) throw EvalError("Could not find FileTree");
  if (!tree) {
    tree = parsedTree =
      parsedTree || JSON.parse(JSON.stringify(fileTree)).default;
  }

  var entry = findEntry(tree, "name", name);
  if (!entry) entry = findEntry(tree, "name", name, true);
  if (!entry) throw EvalError("Could not find Entry");

  var displayObj = {};
  for (const i of Object.keys(entry)) displayObj[i] = entry[i];
  if (entry.contents) displayObj.contents = entry.contents.map((a) => a.name);
  displayObj.size = convertSize(entry.size);

  var str = JSON.stringify(displayObj, null, 4).replaceAll('"', "");
  cache[name] = str;
  return str;
}

//Code from: https://stackoverflow.com/a/69700389
function findEntry(obj, key, value, loose = false) {
  if (!loose && obj[key] === value) return obj;
  if (loose && typeof obj[key] === "string" && obj[key].includes(value))
    return obj;
  var keys = Object.keys(obj);
  for (var i = 0, len = keys.length; i < len; i++) {
    // add "obj[keys[i]] &&" to ignore null values
    if (obj[keys[i]] && typeof obj[keys[i]] == "object") {
      var found = findEntry(obj[keys[i]], key, value, loose);
      if (found) return found;
    }
  }
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

export default displayEntry;
