const { readFileSync, lstatSync, existsSync, createReadStream } = require("fs");
const {
  normalize: normalizePath,
  resolve: resolvePath,
  basename,
} = require("path");
const { createServer } = require("http");
const terminal = require("./terminal.js");
const zlib = require("zlib");

function normalize(path, name) {
  if (typeof path !== "string" || path.replace(" ", "") == "") return "";
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
  return ++nLines;
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
  let name = basename(path);
  return withExtension ? name : name.replace(getFileExtension(name), "");
}

function getFolderName(path) {
  return normalize(path.match(/([^\/]*)\/*$/)[1]);
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

function convertFilePath(path = "", start) {
  if (typeof path !== "string") return;
  path = normalize(path);
  var name = getFileName(path);
  var objPath = path
    .substring(path.indexOf("/"), path.lastIndexOf("/"))
    .split("/");
  if (typeof start === "string")
    objPath = objPath.slice(objPath.indexOf(start));
  var ext = getFileExtension(name);
  return objPath.join(".") + "." + name.replace(ext, ext.replace(".", "?"));
}

// based from https://stackoverflow.com/a/54098693
var cmds = [
  "scan",
  "print",
  "inspect",
  "view",
  "closeView",
  "help",
  "packageInfo",
  "cleanup",
];
function parseArgs() {
  var args = {},
    argv = process.argv.slice(2);
  for (var i = 0; i < argv.length; i++) {
    let cmd = argv[i].replaceAll("-", "");
    if (cmds.includes(cmd) && !args["command"]) {
      //command
      args["command"] = cmd;
    } else if (argv[i].slice(0, 2) === "--") {
      // long arg
      let longArg = argv[i].split("=");
      args[longArg[0].slice(2)] = longArg.length > 1 ? longArg[1] : true;
    } else if (argv[i][0] === "-") {
      // flags
      args[argv[i].slice(1).replace("!", "")] = argv[i].indexOf("!") == -1;
    } else throw Error("Invalid Arguments");
  }
  return args;
}

function processExcludeString(string) {
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

function parseExclude(str) {
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
      throw Error("Could not find Exclude File on: " + path);
    }
    try {
      data = JSON.parse(JSON.stringify(readFileSync(path, "utf8")));
    } catch (error) {
      throw Error("Could not read Data from File:" + path);
    }
  }
  var opts = processExcludeString(str);
  if (opts.str.replaceAll(" ", "") != "") data.push(opts.str);
  if (!opts.noDefaults) {
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

var server;
function startViewer(port = 8080, ip = "127.0.0.1", args) {
  if (server) closeViewer();
  if (!validateIpAndPort(ip, (port = parseInt(port)))) {
    throw Error("Invalid IP or Port - " + ip + ":" + port);
  }
  server = createServer(function (req, response) {
    var path = normalize(req.url.replace(/[^a-z0-9/.]/gi, "_"));
    if (path === "/") path = "./viewer/viewer.html";
    else if (path === "/" + getFileName(args.path))
      path = "./" + getFileName(args.path);
    else if (path === "/src/displayEntry.mjs") path = "./src/displayEntry.mjs";
    else if (path == "/favicon.ico") path = "viewer/assets/favicon.ico";
    else if (path == "/args.data") {
      response.writeHead(200, {
        "Content-Type": "application/json",
      });
      response.write(JSON.stringify(args));
      response.end();
      return;
    } else path = "./viewer" + path;
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
      //"Cache-Control": "no-cache",
      "Cache-Control": "max-age=150",
    });
  }).listen(port, ip);
  console.log("Starting Viewer on", ip + ":" + port);
  console.log(
    terminal.link(
      terminal.color("View", terminal.colors.fg.green),
      "http://localhost:8080/"
    ),
    "from Server"
  );
  console.log("To Stop Viewer press STRG+C");
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

module.exports = {
  isObject,
  normalize,
  countLines,
  isFile,
  isFolder,
  isTextFile,
  existFile,
  getFileExtension,
  getFullPath,
  getFileName,
  getFolderName,
  convertFilePath,
  parseExclude,
  startViewer,
  validateIpAndPort,
  closeViewer,
  parseArgs,
};
