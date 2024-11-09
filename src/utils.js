const { readFileSync, lstatSync, existsSync } = require("fs");
const {
  normalize: normalizePath,
  resolve: resolvePath,
  basename,
  join: joinPath,
  dirname,
  isAbsolute,
} = require("path");
const pathValidator = require("path-validation");

function normalize(path, name) {
  if (typeof path !== "string" || path.replace(" ", "") == "") return "";
  path = normalizePath(path);
  if (name) path += "/" + name;
  return path.replaceAll("\\", "/").replaceAll("//", "/");
}

function existFile(path) {
  if (typeof path !== "string") return false;
  try {
    return existsSync(path) || false;
  } catch (e) {
    return false;
  }
}

function isFile(path) {
  if (typeof path !== "string") return false;
  try {
    return lstatSync(path).isFile();
  } catch (e) {
    return false;
  }
}

function isFolder(path) {
  if (typeof path !== "string") return false;
  try {
    return lstatSync(path).isDirectory();
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

const extensions = new Set(require("text-extensions"));
function isTextFile(path) {
  if (typeof path !== "string") return;
  return extensions.has(getFileExtension(path).slice(1).toLowerCase());
}

function getFullPath(path) {
  return normalize(resolvePath(path));
}

function getFileName(path, withExtension = true) {
  let name = normalize(basename(path));
  return withExtension ? name : name.replace(getFileExtension(name), "");
}

function getFolderName(path) {
  let dir = normalize(dirname(path)) + "/";
  if (dir === "./" || isAbsolute(dir)) return dir;
  return "./" + dir;
}

function parseSavePath(path) {
  if (typeof path !== "string" || path.length === 0 || path === "$") {
    throw new ValidationError("Invalid Save File Path");
  }
  if (path.charAt(0) == "$") {
    path = joinPath(__dirname, "../saves", path.substring(1));
  }
  path = getFullPath(path);

  var ext = getFileExtension(path);
  if (ext === "") path += ".json";
  else if (ext === ".") path += "json";
  else if (ext !== ".json") {
    throw new ValidationError("Invalid Save File Extension");
  }

  if (!pathValidator.isAbsoluteWindowsPath(path.replaceAll("/", "\\"))) {
    throw new ValidationError("Invalid absolute Save File Path");
  }
  if (!existFile(getFolderName(path))) {
    throw new ValidationError("Folder doesn't exist at path: " + path);
  }
  return path;
}

function convertFilePath(path = "") {
  if (typeof path !== "string") return;
  path = normalize(path);
  var paths = path.split("/");
  paths = paths.map((val) => {
    return val.replaceAll(".", "?");
  });
  return "." + paths.join(".");
}

function processString(string) {
  let strict = string[0] === "%" || string[1] === "%";
  let noDefaults = string[0] === "!" || string[1] === "!";
  let str =
    strict && noDefaults
      ? string.slice(2)
      : strict || noDefaults
      ? string.slice(1)
      : string;
  return { str, strict, noDefaults };
}

function parseFileSpecificator(str, skipDefaults = false) {
  if (typeof str !== "string") return;
  var data = [];
  if (str.includes("regex:")) {
    str = new RegExp(str.substring(str.indexOf("regex:") + 6));
    return function (name) {
      return str.test(normalize(name));
    };
  } else if (str.includes("file:/")) {
    let path = resolvePath(str.substring(str.indexOf("file:/") + 6));
    if (!existFile(path) || getFileExtension(path) !== ".json") {
      throw new EvalError("Could not find File on: " + path);
    }
    try {
      data = JSON.parse(JSON.stringify(readFileSync(path, "utf8")));
    } catch (error) {
      throw new EvalError("Could not read data from File:" + path);
    }
  }
  var opts = processString(str);
  if (opts.str.replaceAll(" ", "") != "") data.push(opts.str);
  if (!opts.noDefaults && !skipDefaults) {
    let ignoreDefault = JSON.parse(JSON.stringify(require("../ignore.json")));
    data = data.concat(
      ignoreDefault.filter(function (i) {
        return data.indexOf(i) == -1;
      })
    );
  }
  if (opts.strict) {
    return function (name) {
      return data.includes(normalize(name));
    };
  }
  return function (name) {
    name = normalize(name);
    return data.some((val) => name.includes(val));
  };
}

function throwOptionError(key) {
  if (typeof key !== "string") key = "";
  throw new ValidationError(
    "Invalid Type for Option '" + key[0].toUpperCase() + key.substring(1) + "'"
  );
}

function setDefault(defaultValue, ...args) {
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] !== "undefined") return args[i];
  }
  return defaultValue;
}

const ColorRed = "\x1b[31m";
const coloredLink = (text, color, url) =>
  "\u001B]8;;" + url + "\u0007" + color + text + "\x1b[0m\u001B]8;;\u0007";

const helpMenu = `    ${coloredLink(
  "Usage",
  ColorRed,
  "https://github.com/Bruderjulian/PackageStats#usage"
)}
      packageStats <command> <args>
      packageStats scan --path=./ -l
      packageStats help

    ${coloredLink(
      "Commands",
      ColorRed,
      "https://github.com/Bruderjulian/PackageStats#cli"
    )}
      scan                 scans the dictorary
      inspect              inspect a single entry
      view                 opens the Viewer
      help                 shows the help menu
      version              outputs version
      cleanup              removes saved scannes

    ${coloredLink(
      "Options",
      ColorRed,
      "https://github.com/Bruderjulian/PackageStats#cli"
    )}
      --path, --p          Path to Package (default is ./)
      --select, --sel      File or Folder to inspect
      --port,              Port to open the File Tree Viewer (default is 8080)
      --ip                 IP to open the File Tree Viewer (default is localhost (127.0.0.1))
      -save, -s            save the ouput to file. (default is false)
      -log, -l             log information about the scan (default is false)

    ${coloredLink(
      "Examples",
      ColorRed,
      "https://github.com/Bruderjulian/PackageStats"
    )}
      node packageStats.js scan --path=./src -s -l
      node packageStats.js inspect --select=someFile.js
      node packageStats.js view --port=8080 --ip=127.0.0.1
`;

class ValidationError extends Error {
  constructor(message = "", ...args) {
    super(message, ...args);
    this.message = message;
  }
}

class FileError extends Error {
  constructor(message = "", ...args) {
    super(message, ...args);
    this.message = message;
  }
}

module.exports = {
  normalize,
  isFile,
  isFolder,
  isTextFile,
  existFile,
  getFileExtension,
  getFullPath,
  getFileName,
  getFolderName,

  parseSavePath,
  convertFilePath,
  parseFileSpecificator,

  isObject,
  setDefault,
  coloredLink,
  ValidationError,
  FileError,
  throwOptionError,
  helpMenu,
};
