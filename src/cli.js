const packageInfo = require("../package.json");
const { readFile, writeFile, unlinkSync } = require("fs");
const { createServer } = require("http");
const {
  getFileExtension,
  normalize,
  isObject,
  existFile,
  validateIpAndPort,
} = require("./utils.js");
const printTree = require("./printTree.js");
const scanDir = require("./scan.js");
const terminal = require("./terminal.js");


var server;
var help = `
        ${terminal.link(
          terminal.color("Usage", terminal.colors.fg.red),
          "https://github.com/Bruderjulian/PackageStats"
        )}
	  node packageStats.js <command> <args>
          npm run cli <command> <args>
          npm run version 
          npm run view <args>
          npm run help

        ${terminal.link(
          terminal.color("Commands", terminal.colors.fg.red),
          "https://github.com/Bruderjulian/PackageStats"
        )}
          scan            scans the dictorary
          inspect         inspect a single entry
          view            opens the Viewer
          help            shows the help menu
          packageInfo     outputs the package.json
          cleanup         removes saved scannes

	${terminal.link(
    terminal.color("Options", terminal.colors.fg.red),
    "https://github.com/Bruderjulian/PackageStats"
  )}
	  --path, --p                Path to Package (default is ./)
          --select, --sel            File or Folder to inspect
          --port,                    Port to open the File Tree Viewer (default is 8080)
          --outputStyle, --style     Style to print the Tree (default is 0)
          -save, -s                  save the ouput to file. (default is false)
          -log, -l                   log Information about the scan (default is false)
          -noprint, -npr             disables the printing of the scanned File Tree (default is false)

	${terminal.link(
    terminal.color("Examples", terminal.colors.fg.red),
    "https://github.com/Bruderjulian/PackageStats"
  )}
          node packageStats.js packageInfo
	  node packageStats.js scan
	  node packageStats.js inspect --select=someFile.js
          node packageStats.js view --port=8080
`;

var commands = {
  scan: function (options = {}) {
    options.path ||= options.p ||= "./";
    if (typeof options.path !== "string") {
      throw Error("Invalid Path");
    }
    scanDir(options.path, !!options.log).then(function (tree) {
      if (
        !Array.isArray(tree) ||
        !isObject(tree[0]) ||
        !tree[0].hasOwnProperty("name")
      ) {
        throw Error("Could not scan Folder Tree correctly");
      }
      if (!options.noprint && !options.npr) {
        console.log(
          printTree(
            tree[0],
            !!+options.outputStyle || !!+options.style || false
          )
        );
      }
      if (options.save === true) {
        writeFile(
          "fileTree.json",
          JSON.stringify(tree[0]),
          "utf8",
          function (err) {
            if (err) throw Error("Could not save File");
          }
        );
      }
    });
  },
  inspect: function (options) {
    if (existFile("fileTree.json")) {
      import("./displayEntry.mjs").then(function (val) {
        if (!val || !val.default) throw Error("Could not display Entry");
        var displayEntry = val.default;
        var tree = require("../fileTree.json");
        console.log(displayEntry(options.select || options.sel || "", tree));
      });
    } else {
      // auto scan
    }
  },
  help: function () {
    console.log(help);
  },
  packageInfo: function (options) {
    let info = packageInfo[options.select] || packageInfo;
    console.log(JSON.stringify(info, null, 2).replaceAll('"', ""));
  },
  view: function (options) {
    startViewer(options.port);
  },
  closeView: function () {
    console.log("closed");
    server.close();
  },
  cleanup: function () {
    if (existFile("fileTree.json")) unlinkSync("fileTree.json");
  },
};

// based from https://stackoverflow.com/a/54098693
function parseArgs() {
  var args = {},
    argv = process.argv.slice(2);
  var i, cmd;
  for (i = 0; i < argv.length; i++) {
    cmd = argv[i].replaceAll("-", "");
    if (commands.hasOwnProperty(cmd) && !args["command"]) {
      //command
      args["command"] = cmd;
    } else if (argv[i].slice(0, 2) === "--") {
      // long arg
      let longArg = argv[i].split("=");
      args[longArg[0].slice(2)] = longArg.length > 1 ? longArg[1] : true;
    } else if (argv[i][0] === "-") {
      // flags
      args[argv[i].slice(1)] = true;
    } else throw Error("Invalid Arguments");
  }
  return args;
}

const mimeTypes = {
  ".ico": "image/x-icon",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};

function startViewer(port = 8080, ip = "127.0.0.1") {
  if (!validateIpAndPort(ip, (port = parseInt(port)))) {
    throw Error("Invalid IP or Port - " + ip + ":" + port);
  }
  server = createServer(function (req, response) {
    var path = req.url.replace(/[^a-z0-9/.]/gi, "_").toLowerCase();
    if (path === "/") path = "./viewer/viewer.html";
    else if (path === "/filetree.json") path = "./fileTree.json";
    else path = "./viewer" + path;
    path = normalize(path);
    readFile(path, function (error, data) {
      if (error) {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.write("404 Could not find File\n");
        response.end();
      } else {
        var mimetype = mimeTypes[getFileExtension(path)] || mimeTypes[".html"];
        response.writeHead(200, {
          "Content-Type": mimetype,
        });
        response.write(data);
        response.end();
      }
    });
  }).listen(port, ip);
  console.log("Starting Viewer on", ip + ":" + port);
  console.log(
    terminal.link(
      terminal.color("View", terminal.colors.fg.red),
      "http://localhost:8080/"
    ),
    "from Server or",
    terminal.link(
      terminal.color("View", terminal.colors.fg.red),
      "http://127.0.0.1:5500/viewer/viewer.html"
    ),
    "directly"
  );
}

module.exports = { commands, parseArgs, startViewer };
