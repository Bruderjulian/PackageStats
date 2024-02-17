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
  isObject,
} = require("./utils.js");

var depth = 0;
var folderCount = 0;
var fileCount = 0;

function scanFile(options) {
  fileCount++;
  var path = options.path;
  var stats = statSync(path);
  return {
    lines: isTextFile(path) ? countLines(path) : 0,
    name: getFileName(path, options.withExtensions),
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

async function scanFolder(options) {
  depth++;
  folderCount++;
  var path = options.path;
  if (options.logging == true) console.log("Scanning Folder:", path);
  var stats = statSync(path);
  var children = await loopFolder(options);
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

async function loopFolder(options) {
  var dir = await opendir(options.path);
  var files = [];
  for await (const dirent of dir) {
    options.path = normalize(dirent.path, dirent.name);
    if (options.isExcluded(options.path)) continue;
    if (isFile(options.path)) {
      files.push(scanFile(options));
    } else files.push(await scanFolder(options));
  }
  depth--;
  return files;
}

async function scanDir(options = {}) {
  var time = Date.now();
  var contents = [];
  if (typeof options == "string") options = { path: options || "./" };
  else if (!isObject(options)) throw SyntaxError("Invalid Options");
  options.path = normalize(options.path || "./");
  options.isExcluded =
    options.isExcluded ||
    function () {
      return false;
    };
  options.logging = options.logging || false;
  options.withExtensions = options.withExtensions || true;
  if (!options.isExcluded(options.path)) {
    if (isFile(options.path)) {
      contents.push(scanFile(options));
    } else if (isFolder(options.path)) contents.push(await scanFolder(options));
    else throw Error("Could not scan Path");
  }
  return { contents, fileCount, folderCount, time: Date.now() - time };
}

module.exports = scanDir;
