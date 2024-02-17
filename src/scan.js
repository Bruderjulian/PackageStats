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
  getFileName,
  getFolderName,
} = require("./utils.js");

var depth = 0;
var folderCount = 0;
var fileCount = 0;

function scanFile(path, withExtension = true) {
  fileCount++;
  var stats = statSync(path);
  return {
    lines: isTextFile(path) ? countLines(path) : 0,
    name: getFileName(path, withExtension),
    path: getFolderName(path),
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

async function scanFolder(path, logging, withExtension) {
  depth++;
  folderCount++;
  if (logging == true) console.log("Scanning Folder:", path);
  var stats = statSync(path);
  var children = await loopFolder(path, logging, withExtension);
  return {
    lines: children.reduce((n, { lines }) => n + lines, 0),
    name: getFolderName(path),
    path: normalize(path),
    fullPath: normalize(getFullPath(path)),
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

async function loopFolder(path, logging, withExtension) {
  var dir = await opendir(path);
  var files = [];
  for await (const dirent of dir) {
    var path = normalize(dirent.path, dirent.name);
    if (path.includes("node_modules") || path.includes(".git")) continue;
    if (isFile(path)) {
      files.push(scanFile(path, withExtension));
    } else files.push(await scanFolder(path, logging, withExtension));
  }
  depth--;
  return files;
}

async function scanDir(path, isExclude, logging = false, withExtension) {
  var time = Date.now();
  var contents = [];
  path = normalize(path);
  if (isFile(path) && !isExclude(path)) {
    contents.push(scanFile(path, withExtension));
  } else if (isFolder(path))
    contents.push(await scanFolder(path, logging, withExtension));
  else throw Error("Could not scan Path");

  return { contents, fileCount, folderCount, time: Date.now() - time };
}

module.exports = scanDir;
