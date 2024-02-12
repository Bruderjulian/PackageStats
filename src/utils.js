const { readFileSync, lstatSync } = require("fs");
const { normalize: normalizePath, resolve } = require("path");

function normalize(path, name) {
  path = normalizePath(path);
  if (name) path += "/" + name;
  return path.replaceAll("\\", "/").replaceAll("//", "/");
}

function countLines(path) {
  var text = readFileSync(path, "utf8");
  var i = 0,
    nLines = 0,
    n = text.length;
  for (; i < n; ++i) if (text[i] === "\n") ++nLines;
  return nLines;
}

function existFile(p) {
  try {
    return lstatSync(p) ? true : false;
  } catch (e) {
    return false;
  }
}

function isFile(p) {
  try {
    return lstatSync(p).isFile();
  } catch (e) {
    return false;
  }
}

function isFolder(p) {
  try {
    return lstatSync(p).isDirectory();
  } catch (e) {
    return false;
  }
}

function getFileExtension(str) {
  if (typeof str !== "string") return;
  return "." + str.split(".").filter(Boolean).slice(1).join(".");
}

function isObject(obj) {
  return typeof obj == "object" && !Array.isArray(obj) && obj !== null;
}

const extensions = new Set(require("./text-extensions.json"));
function isTextFile(path) {
  return extensions.has(getFileExtension(path).slice(1).toLowerCase());
}

function getFullPath(path) {
  return resolve(path);
}

function validateIpAndPort(ip, port) {
  ip = ip.split(".");
  return (
    validateNum(port, 1, 65535) &&
    ip.length == 4 &&
    ip.every(function (segment) {
      return validateNum(parseInt(segment), 0, 255);
    })
  );
}

function validateNum(num, min, max) {
  return typeof num === "number" && !isNaN(num) && num >= min && num <= max;
}

module.exports = {
  isObject,
  normalize,
  countLines,
  isFile,
  isFolder,
  existFile,
  getFileExtension,
  isTextFile,
  getFullPath,
  validateIpAndPort,
};
