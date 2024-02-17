const packageInfo = require("../package.json");
const { writeFile, unlinkSync } = require("fs");
const {
  isObject,
  existFile,
  startViewer,
  parseExclude,
} = require("./utils.js");
const printTree = require("./printTree.js");
const scanDir = require("./scan.js");
const terminal = require("./terminal.js");

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
    console.log("Stopping Viewer...");
    server.close();
  },
  cleanup: function () {
    if (existFile("fileTree.json")) unlinkSync("fileTree.json");
  },
};

async function handleScan(options) {
  let isExcluded = parseExclude(options.exclude);
  var tree = await scanDir({
    path: options.path,
    isExcluded: isExcluded,
    logging: !!options.log,
    withExtensions: !!options.withExtensions,
  });
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
  if (!!options.noprint || !!options.npr) return;
  console.log(
    printTree(
      tree.contents[0],
      !!+options.outputStyle || !!+options.style || false
    )
  );
}

module.exports = commands;
