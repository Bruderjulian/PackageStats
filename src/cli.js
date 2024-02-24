const packageInfo = require("../package.json");
const { writeFile, unlinkSync, readFile } = require("fs");
const {
  isObject,
  existFile,
  convertFilePath,
  startViewer,
  parseExclude,
  closeViewer,
  validateIpAndPort,
} = require("./utils.js");
const printTree = require("./printTree.js");
const scanDir = require("./scan.js");
const terminal = require("./terminal.js");

var commands = {
  saveFilePath: "fileTree_saved.json",
  scan: function (options = "./", save = false, log = true, noprint = false) {
    if (!isObject(options)) options = { path: options };
    options.save = options.save || save;
    options.log = options.log || log;
    options.noprint =
      options.noprint ||
      (options.style || options.outputStyle) === -1 ||
      noprint;
    options.path = options.path || options.p || "./";
    options.exclude = options.exclude || "";

    if (typeof options.path !== "string" || typeof options.exclude !== "string")
      throw SyntaxError("Invalid Path");
    if (
      typeof options.save !== "boolean" ||
      typeof options.log !== "boolean" ||
      typeof options.noprint !== "boolean"
    )
      throw SyntaxError("Invalid Arguments");
    return new Promise(function (resolve, reject) {
      try {
        resolve(handleScan(options).catch(reject));
      } catch (err) {
        reject(err);
      }
    });
  },
  print: function (options, style) {
    if (!isObject(options)) options = { path: options };
    options.style = options.style || style || 0;
    options.path = options.path || options.p || commands.saveFilePath;
    readFileTree(options.path)
      .then(function (data) {
        try {
          handlePrint(options, data);
        } catch (err) {
          throw EvalError("Could not print FileTree");
        }
      })
      .catch(function () {
        throw Error("Could not find FileTree on path: " + options.path);
      });
  },
  inspect: function (options = {}, format = true, path) {
    if (typeof options == "string") options = { select: options };
    else if (isObject(options)) {
      options.path = options.path || options.p || path || commands.saveFilePath;
      options.select = options.select || options.sel || "";
      options.format = options.format ? true : format || false;
    } else throw Error("Invalid Argument");
    return handleInspect(options);
  },
  view: function (options = 8080, ip = "127.0.0.1") {
    args = { loose: false, path: commands.saveFilePath };
    if (!isObject(options)) options = { port: options };
    options.ip = options.ip || ip || "127.0.0.1";
    options.port = options.port || 8080;
    if (isObject(options.args)) {
      for (const i of Object.keys(options.args)) {
        if (typeof options.args[i] === typeof args[i] || !args[i]) {
          args[i] = options.args[i];
        }
      }
    }
    if (!validateIpAndPort(ip, options)) {
      throw Error("Invalid Viewer Address: " + ip + ":" + options);
    }
    if (!existFile(commands.saveFilePath)) throw Error("Nothing scanned yet");
    startViewer(options, ip, args);
  },
  closeViewer: function () {
    closeViewer();
  },
  help: function () {
    console.log(terminal.helpMenu);
    return terminal.helpMenu;
  },
  packageInfo: function (selector = "version") {
    selector = isObject(selector)
      ? selector.select || selector.sel
      : typeof selector === "string"
      ? selector
      : undefined;
    let info = selector ? packageInfo[selector] : packageInfo;
    info = JSON.stringify(info, null, 2).replaceAll('"', "");
    console.log(info);
    return info;
  },
  cleanup: function (path) {
    if (existFile(path)) unlinkSync(path);
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
  handlePrint(options, tree.contents[0]);
  if (options.save !== true) return tree;
  writeFile(
    commands.saveFilePath,
    JSON.stringify(tree.contents[0]),
    "utf8",
    function (err) {
      if (err) throw Error("Could not save File");
    }
  );
  return tree;
}

function handlePrint(options, tree) {
  if (!!options.noprint || !!options.npr) return;
  if (!tree.hasOwnProperty("folderCount")) {
    console.log(printTree(tree, !!+options.style || false));
    return;
  }
  console.log(printTree(tree.contents[0], !!+options.style || false));
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
  if (tree.folderCount == 0 || (tree.folderCount == 1 && tree.fileCount == 0)) {
    return;
  }
  console.log(printTree(tree.contents[0], !!+options.style || false));
}

function handleInspect(options) {
  if (!existFile(commands.saveFilePath)) var tree = commands.scan(options);
  else
    var tree = readFileTree(options.path || options.p || commands.saveFilePath);
  var displayEntry = import("./displayEntry.mjs");
  Promise.all([displayEntry, tree])
    .then(function (data) {
      if (!data || !data[0].displayEntry || !data[1])
        throw Error("Could not display Entry");
      let path = convertFilePath(options.select);
      let out = data[0].displayEntry(data[1], path, options.format);
      console.log(out);
      return out;
    })
    .catch(function () {
      throw Error("Could not Inspect Entry");
    });
}

function readFileTree(path) {
  return new Promise(function (resolve, reject) {
    readFile(path, "utf8", function (err, data) {
      data = JSON.parse(data);
      if (
        err ||
        !isObject(data) ||
        !data.contents ||
        !isObject(data.contents[0])
      ) {
        reject(err);
      }
      resolve(data);
    });
  });
}

module.exports = commands;
