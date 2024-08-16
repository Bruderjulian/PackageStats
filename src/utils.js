const { readFileSync, lstatSync, existsSync, createReadStream } = require("fs");
const {
  normalize: normalizePath,
  resolve: resolvePath,
  basename,
} = require("path");
const { createServer } = require("http");
const zlib = require("zlib");

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
  return normalize(getFullPath(path).match(/([^\/]*)\/*$/)[1]);
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

const mimeTypes = {
  ".ico": "image/x-icon",
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const filePathMap = {
  "/": "./viewer/viewer.html",
  "/file_tree.js": "./viewer/file_tree.js",
  "/doubleClick.js": "./viewer/doubleClick.js",
  "/src/displayEntry.mjs": "./src/displayEntry.mjs",
  "/assets/style.css": "./viewer/assets/style.css",
  "/assets/file_tree.css": "./viewer/assets/file_tree.css",
  "/assets/file.svg": "./viewer/assets/file.svg",
  "/assets/folder_open.svg": "./viewer/assets/folder_open.svg",
  "/assets/folder_close.svg": "./viewer/assets/folder_close.svg",
  "/assets/textformat.woff2": "./viewer/assets/textformat.woff2",

  "/favicon.ico": "viewer/assets/favicon.ico",
};

var server;
function startViewer(options, args) {
  if (server) closeViewer();
  server = createServer(function (req, response) {
    var path = normalize(req.url.replace(/[^a-z0-9/.]/gi, "_"));
    if (filePathMap.hasOwnProperty(path)) path = filePathMap[path];
    else if (path === "/" + getFileName(args.path)) {
      path = "./" + getFileName(args.path);
    } else if (path == "/args.data") {
      response.writeHead(200, {
        "Content-Type": "application/json",
      });
      response.write(JSON.stringify(args));
      response.end();
      return;
    } else path = undefined;
    if (!path) throw new EvalError("Could not start the viewer");

    let encoding = req.headers["accept-encoding"] || "";
    if (encoding.match(/\bgzip\b/)) encoding = "Gzip";
    else if (encoding.match(/\bdeflate\b/)) encoding = "Deflate";
    else encoding = "";
    createReadStream(path)
      .pipe(zlib["create" + encoding]())
      .pipe(response);

    response.writeHead(200, {
      "Content-Type": mimeTypes[getFileExtension(path)] || mimeTypes[".html"],
      "Content-Encoding": encoding.toLowerCase(),
      "Cache-Control": "no-cache",
      //"Cache-Control": "max-age=150",
    });
  }).listen(options.port, options.ip);
  console.log(openViewerMessage(options.ip, options.port));
  let onDataCallBack = (data) => {
    const byteArray = [...data];
    if (byteArray.length <= 0 || byteArray[0] !== 3) return;
    closeViewer();
    process.stdin.removeListener("data", onDataCallBack);
    process.stdin.setRawMode(false);
    process.exit(1);
  };
  process.stdin.setRawMode(true);
  process.stdin.on("data", onDataCallBack);
}

function closeViewer() {
  if (!server) return;
  console.log("Stopping Viewer...");
  server.close();
  setImmediate(function () {
    server.emit("close");
  });
}

const ColorRed = "\x1b[31m";
const ColorGreen = "\x1b[32m";
const coloredLink = (text, color, url) =>
  "\u001B]8;;" + url + "\u0007" + color + text + "\x1b[0m\u001B]8;;\u0007";

const openViewerMessage = function (ip, port) {
  return `  Starting Viewer on ${ip}:${port}
  ${coloredLink("Open Viewer", ColorGreen, `http://${ip}:${port}`)}
  To Stop Viewer press \x1b[1mCTRL+C\x1b[0m`;
};

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
    this.message = "Error at Validation: " + message;
  }
}

module.exports = {
  isObject,
  normalize,
  isFile,
  isFolder,
  isTextFile,
  existFile,
  getFileExtension,
  getFullPath,
  getFileName,
  getFolderName,
  convertFilePath,
  parseFileSpecificator,
  startViewer,
  validateIpAndPort,
  closeViewer,
  ValidationError,
  helpMenu,
};
