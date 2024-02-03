const packageInfo = require("../package.json");
var http = require("http");
var fs = require("fs");
const { getFileExtension, normalize } = require("./utils.js");
/*
args
yargs
minimist
commander
caporal 
oclif
Vorpal

findup-sync

*/

var help = `        Usage
	  node packageStats.js <command> <args>

	Options
	  --path, --p  Path to Package (default is ./)
	  --file, --f  Id of file to Inspect
	  --folder     Id of folder to Inspect
          --port,      Port to open the File Tree Viewer (default is 8080)

	Examples
    node packageStats.js packageInfo
	  node packageStats.js scan
          node packageStats.js scan --path=./
	  node packageStats.js inspect --file=someFile.js
	  node packageStats.js inspect --folder=someFolder
          node packageStats.js view --port=8080
`;

var commands = {
  scan: function (options) {
    console.log(options);
  },
  inspect: function (options) {
    console.log(options);
  },
  help: function () {
    console.log(help);
  },
  packageInfo: function (options) {
    let info = packageInfo[options["id"]] || packageInfo;
    console.log(JSON.stringify(info, null, 2).replaceAll('"', ""));
  },
  view: function (options) {
    startViewer(options["port"]);
  },
};

//Code from https://stackoverflow.com/a/54098693
function parseArgs() {
  var args = {},
    argv = process.argv.slice(2);
  var i, cmd;
  for (i = 0; i < argv.length; i++) {
    cmd = argv[i].replaceAll("-", "");
    if (commands.hasOwnProperty(cmd) && !args["command"]) {
      args["command"] = cmd;
    } else if (argv[i].slice(0, 2) === "--") {
      // long arg
      let longArg = argv[i].split("=");
      args[longArg[0].slice(2)] = longArg.length > 1 ? longArg[1] : true;
    } else if (argv[i][0] === "-") {
      // flags
      let flags = argv[i].slice(1).split("");
      flags.forEach((flag) => {
        args[flag] = true;
      });
    } else throw Error("Invalid Arguments");
  }
  return args;
}
//heavily modified code from https://www.npmjs.com/package/ansi-escapes
const isWindows =
  (typeof window == "undefined" || typeof window.document == "undefined") &&
  require("node:process").platform === "win32";
const terminal = {};
terminal.clearScreen = "\u001Bc";

terminal.clearTerminal = isWindows
  ? `\u001B[2J\u001B[0f`
  : `\u001B[2J\u001B[3J\u001B["H`;

terminal.link = (text, url) =>
  ["\u001B]8;;", url, "\u0007", text, "\u001B]8;;\u0007"].join("");

const mimeTypes = {
  ".ico": "image/x-icon",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function startViewer(port, ip) {
  var dirPath = "viewer\\out";
  http
    .createServer(function (req, response) {
      var path = req.url.replace(/[^a-z0-9/.]/gi, "_").toLowerCase();
      if (path === "/") path = "\\out.html";
      console.log(dirPath + path);
      path = normalize(dirPath + path);
      console.log(path)
      fs.readFile(path, function (error, data) {
        if (error) {
          response.writeHead(404, { "Content-Type": "text/plain" });
          response.write("404 Could not find File\n");
          response.end();
        } else {
          var mimetype =
            mimeTypes[getFileExtension(path)] || mimeTypes[".html"];
          response.writeHead(200, {
            "Content-Type": mimetype,
          });
          response.write(data);
          response.end();
        }
      });
    })
    .listen(parseInt(port) || 8080, ip || "127.0.0.1");
}

module.exports = { commands, parseArgs, terminal, startViewer };
