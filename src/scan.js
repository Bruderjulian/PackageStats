const fs = require("fs");
const {
  normalize,
  countLines,
  isFile,
  isFolder,
  getFileExtension,
  roundTo,
} = require("./utils.js");

var depth = 0;

function scanFile(path, withExtension = true) {
  var stats = fs.statSync(path);
  var name = normalize(path).split("/").at(-1);
  return {
    lines: countLines(path),
    name: withExtension ? name : name.split(".")[0],
    path: path.substring(0, path.lastIndexOf("/")),
    fullPath: path,
    extension: getFileExtension(path), //name.substring(name.lastIndexOf(".") + 1),
    isFile: true,
    isFolder: false,
    type: "file",
    size: roundTo(stats.size / 1000),
    lastModified: stats.mtime,
    birthtime: stats.birthtime,
    depth: depth,
  };
}

async function scanFolder(path) {
  depth++;
  var stats = fs.statSync(path);
  var children = await loopFolder(path);
  return {
    lines: children.reduce((n, { lines }) => n + lines, 0),
    name: path.split("/").at(-1),
    path: path,
    isFile: false,
    isFolder: true,
    type: "folder",
    size: roundTo(children.reduce((n, { size }) => n + size, 0)),
    lastModified: stats.mtime,
    birthtime: stats.birthtime,
    contents: children,
    depth: depth,
  };
}

async function loopFolder(path) {
  var dir = await fs.promises.opendir(path);
  var files = [];
  for await (const dirent of dir) {
    var path = normalize(dirent.path, dirent.name);
    if (isFile(path)) {
      files.push(scanFile(path));
    } else files.push(await scanFolder(path));
  }
  depth--;
  return files;
}

async function scanDir(path) {
  if (typeof path == "string") path = [path];
  else if (!Array.isArray(path)) return;
  var i,
    files = [];
  for (i = 0; i < path.length; i++) {
    path[i] = normalize(path[i]);
    if (isFile(path[i])) {
      files.push(scanFile(path[i]));
    } else if (isFolder(path[i])) files.push(await scanFolder(path[i]));
  }
  return files;
}

module.exports = scanDir;
