const {
  statSync,
  readFileSync,
  promises: { opendir },
} = require("fs");
const {
  normalize,
  isFile,
  isFolder,
  getFileExtension,
  isTextFile,
  getFullPath,
  getFileName,
  getFolderName,
  isObject,
  ValidationError,
} = require("./utils.js");

var depth = 0;
var folderCount = 0;
var fileCount = 0;
var options;
var path = "";

function countLines() {
  var text = readFileSync(path, "utf8");
  var i = 0,
    nLines = 0,
    n = text.length;
  for (; i < n; ++i) if (text[i] === "\n") ++nLines;
  return ++nLines;
}

function scanFile() {
  fileCount++;
  var stats = statSync(path);
  return {
    lines: isTextFile(path) ? countLines(path) : 0,
    name: getFileName(path, options.withExtensions),
    path: getFolderName(path),
    fullPath: getFullPath(path),
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

async function scanFolder() {
  depth++;
  folderCount++;
  if (options.logging == true) console.log("Scanning Folder:", path);
  var stats = statSync(path);
  var currentPath = path;
  var children = await loopFolder();
  return {
    lines: children.reduce((n, { lines }) => n + lines, 0),
    name: getFolderName(currentPath),
    path: normalize(currentPath),
    fullPath: getFullPath(currentPath),
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

async function loopFolder() {
  var files = [];
  var dir = await opendir(path);
  for await (const dirent of dir) {
    path = normalize(dirent.parentPath, dirent.name);
    if (options.isExcluded(path)) continue;
    if (isFile(path)) {
      files.push(scanFile());
    } else files.push(await scanFolder());
  }
  depth--;
  return files;
}

async function scanDir(opts) {
  if (!isObject(opts)) throw new ValidationError("Invalid Options");
  options = opts;
  path = normalize(opts.path || "./");
  var time = Date.now();
  var contents = [];
  if (!options.isExcluded(path)) {
    if (isFile(path)) {
      contents.push(scanFile());
    } else if (isFolder(path)) contents.push(await scanFolder());
    else throw EvalError("Could not scan path");
  }
  return { contents, fileCount, folderCount, time: Date.now() - time };
}

module.exports = scanDir;
