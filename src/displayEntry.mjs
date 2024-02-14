var cache = {};

async function displayEntry(path = "", tree) {
  if (cache.hasOwnProperty(path)) return cache[path];
  if (!tree) {
    tree = await import("../fileTree.json", { assert: { type: "json" } });
    if (!tree) throw EvalError("Could not find FileTree");
    tree = JSON.parse(JSON.stringify(tree)).default;
  }

  var entry = findEntrybyPath(tree, path);
  if (!entry) entry = findEntrybyPath(tree, path, true);
  if (!entry) throw EvalError("Could not find Entry");
  console.log(entry);

  var displayObj = {};
  for (const i of Object.keys(entry)) displayObj[i] = entry[i];
  if (entry.contents) displayObj.contents = entry.contents.map((a) => a.name);
  displayObj.size = convertSize(entry.size);

  var str = JSON.stringify(displayObj, null, 4)
    .replaceAll('"', "")
    .replaceAll(",", "")
  str = str.substring(2, str.length - 1);
  cache[path.slice(1)] = str;
  return str;
}

///Code from: stackoverflow.com/a/22129960
function findEntrybyPath(tree = {}, path) {
  var properties = Array.isArray(path) ? path : path.split(".").slice(1);
  var entry = tree;
  for (let i = 0; i < properties.length; i++) {
    for (let j = 0; j < entry.contents.length; j++) {
      if (!entry.contents[j]) continue;
      if (entry.contents[j].name.replace(/\.[^/.]+$/, "") === properties[i]) {
        entry = entry.contents[j];
        break;
      }
    }
  }
  return entry;
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
