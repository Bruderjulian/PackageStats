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

class Scanner {
  static #depth = 0;
  static #folderCount = 0;
  static #fileCount = 0;
  static #logging = false;
  static #isExcluded;
  static #withExtensions = true;
  static #path = "";

  static async scan(opts) {
    if (!isObject(opts)) throw new ValidationError("Invalid Options");
    this.#path = opts.path;
    this.#logging = opts.logging;
    this.#withExtensions = opts.withExtensions;
    this.#isExcluded = opts.isExcluded;
    var time = Date.now();
    var contents = [];
    if (!this.#isExcluded(this.#path)) {
      if (isFile(this.#path)) {
        contents.push(this.#scanFile());
      } else if (isFolder(this.#path)) contents.push(await this.#scanFolder());
      else throw EvalError("Could not scan path");
    }
    return {
      contents,
      fileCount: this.#fileCount,
      folderCount: this.#folderCount,
      time: Date.now() - time,
    };
  }

  static async #loopFolder() {
    var files = [];
    var dir = await opendir(this.#path);
    for await (const dirent of dir) {
      this.#path = normalize(dirent.parentPath, dirent.name);
      if (this.#isExcluded(this.#path)) continue;
      if (isFile(this.#path)) {
        files.push(this.#scanFile());
      } else files.push(await this.#scanFolder());
    }
    this.#depth--;
    return files;
  }

  static async #scanFolder() {
    this.#depth++;
    this.#folderCount++;
    if (this.#logging == true) console.log("Scanning Folder:", this.#path);
    var stats = statSync(this.#path);
    var currentPath = this.#path;
    var children = await this.#loopFolder();
    return {
      lines: children.reduce((n, { lines }) => n + lines, 0),
      name: getFileName(currentPath, true),
      path: getFolderName(currentPath),
      fullPath: getFullPath(currentPath),
      isFile: false,
      isFolder: true,
      type: "folder",
      size: children.reduce((n, { size }) => n + size, 0),
      lastModified: stats.mtime,
      birthtime: stats.birthtime,
      depth: this.#depth,
      contents: children,
    };
  }

  static #scanFile() {
    this.#fileCount++;
    var stats = statSync(this.#path);
    return {
      lines: isTextFile(this.#path) ? this.#countLines(this.#path) : 0,
      name: getFileName(this.#path, this.#withExtensions),
      path: getFolderName(this.#path),
      fullPath: getFullPath(this.#path),
      extension: getFileExtension(this.#path),
      isFile: true,
      isFolder: false,
      type: "file",
      size: stats.size,
      lastModified: stats.mtime,
      birthtime: stats.birthtime,
      depth: this.#depth,
    };
  }

  static #countLines() {
    var text = readFileSync(this.#path, "utf8");
    var i = 0,
      nLines = 0,
      n = text.length;
    for (; i < n; ++i) if (text[i] === "\n") ++nLines;
    return ++nLines;
  }
}

module.exports = Scanner;
