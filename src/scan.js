const {
  statSync,
  promises: { opendir },
} = require("fs");
const {
  normalize,
  countLines,
  isFile,
  isFolder,
  getFileExtension,
  isTextFile,
  getFullPath,
} = require("./utils.js");

var depth = 0;
var folderCount = 0;
var fileCount = 0;

function scanFile(path, withExtension = true) {
  fileCount++;
  var stats = statSync(path);
  var name = normalize(path).split("/").at(-1);
  return {
    lines: isTextFile(path) ? countLines(path) : 0,
    name: withExtension ? name : name.split(".")[0],
    path: path.substring(0, path.lastIndexOf("/") + 1),
    fullPath: normalize(getFullPath(path)),
    extension: getFileExtension(path),
    isFile: true,
    isFolder: false,
    type: "file",
    size: stats.size,
    lastModified: stats.mtime,
    birthtime: stats.birthtime,
    depth: depth,
  };
}

async function scanFolder(path, logging) {
  depth++;
  folderCount++;
  if (logging == true) console.log("Scanning Folder:", path);
  var stats = statSync(path);
  var children = await loopFolder(path, logging);
  var fullPath = normalize(getFullPath(path));
  return {
    lines: children.reduce((n, { lines }) => n + lines, 0),
    name: path.split("/").at(-1),
    path: normalize(path),
    fullPath: fullPath,
    isFile: false,
    isFolder: true,
    type: "folder",
    size: children.reduce((n, { size }) => n + size, 0),
    lastModified: stats.mtime,
    birthtime: stats.birthtime,
    depth: depth,
    contents: children,
  };
}

async function loopFolder(path, logging) {
  var dir = await opendir(path);
  var files = [];
  for await (const dirent of dir) {
    var path = normalize(dirent.path, dirent.name);
    if (path.includes("node_modules") || path.includes(".git")) continue;
    if (isFile(path)) {
      files.push(scanFile(path));
    } else files.push(await scanFolder(path, logging));
  }
  depth--;
  return files;
}

async function scanDir(path, logging = false) {
  var time = Date.now();
  var contents = [];
  path = normalize(path);
  if (isFile(path)) {
    contents.push(scanFile(path));
  } else if (isFolder(path)) contents.push(await scanFolder(path, logging));
  else throw Error("Could not scan Path");

  return { contents, fileCount, folderCount, time: Date.now() - time};
}

module.exports = scanDir;
