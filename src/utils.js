const fs = require("fs");

var illegalRe = /[\/\?<>\\:\*\|":]/g;
var controlRe = /[\x00-\x1f\x80-\x9f]/g;
var reservedRe = /^\.+$/;
var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
var TextCoder = [new TextDecoder(), new TextEncoder()];

function normalize(path, name) {
  if (name) path += "/" + name;
  path = path.replaceAll("\\", "/").replaceAll("//", "/");
  path = path
    .replace(illegalRe, "")
    .replace(controlRe, "")
    .replace(reservedRe, "")
    .replace(windowsReservedRe, "");
  return TextCoder[0].decode(TextCoder[1].encode(path).slice(0, 255));
}

function countLines(path) {
  var nLines = 0;
  var i = 0;
  var text = fs.readFileSync(path, "utf8");
  for (i = 0, n = text.length; i < n; ++i) {
    if (text[i] === "\n") ++nLines;
  }
  return nLines;
}

function existFile(p) {
  try {
    return fs.lstatSync(p) ? true : false;
  } catch (e) {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.lstatSync(p).isFile();
  } catch (e) {
    return false;
  }
}

function isFolder(p) {
  try {
    return fs.lstatSync(p).isDirectory();
  } catch (e) {
    return false;
  }
}

function getFileExtension(str) {
  try {
    return str.match(/\.[0-9a-z]+$/gi)[0];
  } catch (e) {
    return str;
  }
}

function isObject(obj) {
  return typeof obj == "object" && !Array.isArray(obj) && obj !== null;
}

function roundTo(num, percision = 3) {
  if (typeof num !== "number" || typeof percision !== "number") return num;
  let exponent = 10 ** percision;
  return Math.round(num * exponent) / exponent;
}

module.exports = {
  isObject,
  roundTo,
  normalize,
  countLines,
  isFile,
  isFolder,
  existFile,
  getFileExtension,
};
