const { createServer } = require("http");
const zlib = require("zlib");
const { createReadStream } = require("fs");
const {
  getFileName,
  normalize,
  getFileExtension,
  coloredLink,
} = require("./utils.js");

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
  "/src/displayEntry.js": "./src/displayEntry.js",
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

    createReadStream(path).pipe(getEncoder(req)).pipe(response);
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

function getEncoder(req) {
  let encoding = req.headers["accept-encoding"] || "";
  if (encoding.match(/\bgzip\b/)) encoding = "Gzip";
  else if (encoding.match(/\bdeflate\b/)) encoding = "Deflate";
  else encoding = "";
  return zlib["create" + encoding]();
}

const ColorGreen = "\x1b[32m";
const openViewerMessage = function (ip, port) {
  return `  Starting Viewer on ${ip}:${port}
    ${coloredLink("Open Viewer", ColorGreen, `http://${ip}:${port}`)}
    To Stop Viewer press \x1b[1mCTRL+C\x1b[0m`;
};

function validateIP(ip) {
  if (typeof ip !== "string" || ip.length === 0) return false;
  ip = ip.split(".");
  return (
    ip.length == 4 &&
    ip.every(function (segment) {
      return validateNum(parseInt(segment), 0, 255);
    })
  );
}

function validatePort(port) {
  return validateNum(parseInt(port), 1, 65535);
}

function validateNum(num, min, max) {
  return typeof num === "number" && !isNaN(num) && num >= min && num <= max;
}

modele.exports = {
  validateIP,
  validatePort,
  startViewer,
  closeViewer,
};
