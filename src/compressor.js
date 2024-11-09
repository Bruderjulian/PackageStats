const keysFolder = [
  "lines",
  "name",
  "path",
  "fullPath",
  "isFile",
  "isFolder",
  "type",
  "size",
  "lastModified",
  "birthtime",
  "depth",
  "contents",
];
const keysFile = [
  "lines",
  "name",
  "path",
  "fullPath",
  "extension",
  "isFile",
  "isFolder",
  "type",
  "size",
  "lastModified",
  "birthtime",
  "depth",
];

function compress(obj) {
  var values = Object.values(obj);
  if (obj.hasOwnProperty("contents")) {
    values.unshift(true);
    values[values.length - 1] =
      "{," +
      values[values.length - 1]
        .map(function (v) {
          return compress(v);
        })
        .join(",") +
      ",}";
  } else values.unshift(false);
  return values.join(",");
}

function decompress(str = "") {
  if (typeof str !== "string" || str.length === 0) {
    throw new TypeError("Invalid Save String Type");
  }
  return createEntry(str.split(","))[0];
}

function createEntry(arr = [], start = 0) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  var keys = arr[start] === "true" ? keysFolder : keysFile;
  var out = {};
  var list;
  for (let i = 0; i < 12; i++) {
    if (keys[i] === "contents") {
      list = arr.slice(i + start + 2, getClosingBracket(arr, i + start));
      out.contents = extractEntries(list);
    } else out[keys[i]] = convertValue(arr[i + start + 1]);
  }
  return [out, (list || []).length];
}

function extractEntries(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  var total = arr.length - 1;
  var left = total;
  var list = [];
  var entry;
  while (left >= 12) {
    entry = createEntry(arr, total - left);
    left -= 13 + entry[1];
    list.push(entry[0]);
  }
  return list;
}

function getClosingBracket(arr, start = 0) {
  var i = arr.indexOf("{", start);
  if (i === -1) return null;
  var len = arr.length;
  var count = 0;
  for (; i < len; i++) {
    if (arr[i] === "{") count++;
    else if (arr[i] === "}") count--;
    if (count === 0) return i + 1;
  }
  return null;
}

function convertValue(value) {
  if (value === "false") return false;
  else if (value === "true") return true;
  if (value.includes("-")) return value;
  let number = parseInt(value, 10);
  if (typeof number === "number" && !isNaN(number)) return number;
  return value;
}

module.exports = { compress, decompress };
