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
const { fileURLToPath } = require("url");

var server;
var commands = {
  scan: function (options = {}) {
    options.path ||= options.p ||= "./";
    if (typeof options.path !== "string") {
      throw Error("Invalid Path");
    }
    return new Promise(function (resolve, reject) {
      try {
        resolve(handleScan(options));
      } catch (err) {
        reject(err);
      }
    });
  },
  print: function (options, tree) {
    if (!tree) {
      if (!existFile("./fileTree.json")) tree = commands.scan(options);
      else {
        tree = import("../fileTree.json", { assert: { type: "json" } });
        if (!tree) throw EvalError("Could not find FileTree");
        tree = JSON.parse(JSON.stringify(tree)).default;
      }
    }
    Promise.resolve(tree)
      .then(handlePrint.bind(null, options))
      .catch(function (err) {
        throw Error(err);
      });
  },
  inspect: function (options) {
    if (!existFile("./fileTree.json")) var tree = commands.scan(options);
    import("./displayEntry.mjs").then(function (val) {
      if (!val || !val.default) throw Error("Could not display Entry");
      var displayEntry = val.default;
      displayEntry(options.select || options.sel || "").then(function (out) {
        console.log(out);
      });
    });
  },
  help: function () {
    console.log(terminal.helpMenu);
  },
  packageInfo: function (options) {
    let info = packageInfo[options.select || options.sel] || packageInfo;
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

async function handleScan(options) {
  var tree = await scanDir(options.path, !!options.log);
  if (
    !isObject(tree) ||
    !Array.isArray(tree.contents) ||
    !isObject(tree.contents[0]) ||
    !tree.contents[0].hasOwnProperty("name")
  ) {
    throw Error("Could not scan Folder Tree correctly");
  }
  handlePrint(options, tree);
  if (options.save === true) {
    writeFile(
      "fileTree.json",
      JSON.stringify(tree.contents[0]),
      "utf8",
      function (err) {
        if (err) throw Error("Could not save File");
      }
    );
  }
  return tree;
}

function handlePrint(options, tree) {
    if (!!options.log == true) {
      console.log(
        "Scanned",
        tree.folderCount,
        "Folders with",
        tree.fileCount,
        "Files in",
        tree.time,
        "ms\nTotal Lines:",
        tree.contents[0].lines
      );
    }
  if (!options.noprint && !options.npr) {
    console.log(
      printTree(
        tree.contents[0],
        !!+options.outputStyle || !!+options.style || false
      )
    );
  }
}

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
      args[argv[i].slice(1).replace("!", "")] = argv[i].indexOf("!") == -1;
    } else throw Error("Invalid Arguments");
  }
  return args;
}

const mimeTypes = {
  ".ico": "image/x-icon",
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};

function startViewer(port = 8080, ip = "127.0.0.1") {
  if (!validateIpAndPort(ip, (port = parseInt(port)))) {
    throw Error("Invalid IP or Port - " + ip + ":" + port);
  }
  server = createServer(function (req, response) {
    var path = req.url.replace(/[^a-z0-9/.]/gi, "_");
    if (path === "/") path = "./viewer/viewer.html";
    else if (path === "/fileTree.json") path = "./fileTree.json";
    else if (path === "/src/displayEntry.mjs") path = "./src/displayEntry.mjs";
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
