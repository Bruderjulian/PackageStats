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
  ValidationError,
  getFileExtension,
} = require("./utils.js");
const printTree = require("./printTree.js");
const scanDir = require("./scan.js");
const terminal = require("./terminal.js");

var commands = {
  saveFilePath: "fileTree_saved.json",
  scan: function (options = "./", save = false, log = true) {
    if (!isObject(options)) options = { path: options };
    options.save = options.save || save;
    options.log = !!(options.log || log) || false;
    if (options.style === "-1") options.log = false;
    options.path = options.path || options.p || "./";
    options.exclude = options.exclude || "";
    options.withExtensions = !!options.withExtensions || true;

    if (typeof options.path !== "string")
      throw new ValidationError("Invalid Path");
    if (typeof options.exclude !== "string")
      throw new ValidationError("Invalid Exclude String");
    if (typeof options.save !== "boolean" || typeof options.log !== "boolean")
      throw new ValidationError("Invalid Arguments");
    return new Promise(function (resolve, reject) {
      try {
        resolve(handleScan(options).catch(reject));
      } catch (err) {
        reject(err);
      }
    });
  },
  print: function (options, path) {
    if (!isObject(options)) options = { style: options };
    options.style = parseInt(options.style, 10) || 0;
    options.path = options.path || options.p || path || commands.saveFilePath;
    if (typeof options.path !== "string" || options.path == "")
      throw new ValidationError("Invalid SaveFile Path");
    if (
      typeof options.style !== "number" ||
      isNaN(options.style) ||
      options.style < 0 ||
      options.style > 1
    ) {
      throw new ValidationError("Invalid Style: " + options.style);
    }
    readFileTree(options.path)
      .then(function (data) {
        handlePrint(options, data);
      })
      .catch(function () {
        throw EvalError("Could not print FileTree on path: " + options.path);
      });
  },
  inspect: function (options = {}, path) {
    if (typeof options == "string") options = { select: options };
    else if (!isObject(options)) throw new ValidationError("Invalid Argument");
    options.path = options.path || options.p || path || commands.saveFilePath;
    options.select = options.select || options.sel || "";
    if (typeof options.path !== "string" || options.path == "")
      throw new ValidationError("Invalid SaveFile Path");
    if (typeof options.select !== "string")
      throw new ValidationError("Invalid Selector to inspect");
    return handleInspect(options);
  },
  view: function (options = 8080, ip) {
    args = { loose: false, path: commands.saveFilePath };
    if (!isObject(options)) options = { port: options };
    options.ip = options.ip || ip || "127.0.0.1";
    options.port = options.port || 8080;
    if (!validateIpAndPort(options.ip, options.port)) {
      throw new ValidationError(
        "Invalid Viewer Address: " + options.ip + ":" + options.port
      );
    }
    if (isObject(options.args)) {
      for (const i of Object.keys(options.args)) {
        if (typeof options.args[i] === typeof args[i] || !args[i]) {
          args[i] = options.args[i];
        }
      }
    }
    if (!existFile(commands.saveFilePath))
      throw new Error("Nothing scanned yet");
    startViewer(options, args);
  },
  closeViewer: function () {
    closeViewer();
  },
  help: function (options = {}) {
    if (!isObject(options)) options = { log: options };
    options.log = !!options.log || false;
    if (options.log) console.log(terminal.helpMenu);
    return terminal.helpMenu;
  },
  packageInfo: function (options = {}) {
    if (typeof options === "string") options = { select: options };
    else if (!isObject(options)) throw new ValidationError("Invalid Argument");

    options.select = options.select || options.sel || undefined;
    if (typeof options.select !== "string" && options.select !== undefined)
      throw new ValidationError("Invalid Selector: " + options.select);
    if (options.select === "") options.select = undefined;

    let info = options.select ? packageInfo[options.select] : packageInfo;
    info = JSON.stringify(info, null, 2).replaceAll('"', "");
    if (!!options.log) console.log(info);
    return info;
  },
  cleanup: function (options) {
    if (typeof options === "string") options = { path: options };
    if (!isObject(options)) throw new ValidationError("Invalid Options");

    options.path = options.path || options.p || commands.saveFilePath;
    if (typeof options.path !== "string")
      throw new ValidationError("Invalid Path!");

    if (existFile(path)) unlinkSync(options.path);
  },
  setSaveFilePath: function (options = {}) {
    if (typeof options == "string") options = { path: options };
    if (!isObject(options)) throw new ValidationError("Invalid Options");

    options.path = path.path || path.p || commands.saveFilePath;
    if (typeof options.path !== "string" || options.path === "")
      throw new ValidationError("Invalid SaveFile Path");

    let ext = getFileExtension(path);
    if (ext == "" || ext == ".") path += ".json";
    else if (ext !== ".json")
      throw new ValidationError("Invalid SaveFile Extension: " + ext);
    if (!!options.log) console.log("Setting SaveFile Path to:", path);
    commands.saveFilePath = path;
  },
};

async function handleScan(options) {
  let isExcluded = parseExclude(options.exclude);
  var tree = await scanDir({
    path: options.path,
    isExcluded:
      isExcluded ||
      function () {
        return false;
      },
    logging: options.log,
    withExtensions: options.withExtensions,
  });
  if (
    !isObject(tree) ||
    !Array.isArray(tree.contents) ||
    !isObject(tree.contents[0]) ||
    !tree.contents[0].hasOwnProperty("name")
  ) {
    throw new ValidationError("Could not scan Folder Tree correctly");
  }
  if (options.log) handlePrint(options, tree);
  if (!options.save) return tree;
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
  if (!tree.hasOwnProperty("folderCount")) {
    console.log(printTree(tree, !!+options.style || false));
    return;
  }
  if (
    tree.folderCount !== 0 &&
    !(tree.folderCount == 1 && tree.fileCount == 0)
  ) {
    console.log(printTree(tree.contents[0], !!+options.style || false));
  }
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

function handleInspect(options) {
  var tree;
  if (!existFile(commands.saveFilePath)) tree = commands.scan(options);
  else {
    tree = readFileTree(options.path || options.p || commands.saveFilePath);
  }
  var displayEntry = import("./displayEntry.mjs");
  Promise.all([displayEntry, tree])
    .then(function (data) {
      if (!data || !data[0].displayEntry || !data[1])
        throw new EvalError("Could not display Entry");
      let path = convertFilePath(options.select);
      let out = data[0].displayEntry(data[1], path);
      console.log(out);
      return data[1];
    })
    .catch(function () {
      throw EvalError("Could not inspect entry");
    });
}

function readFileTree(path) {
  return new Promise(function (resolve, reject) {
    readFile(path, "utf8", function (err, data) {
      try {
        data = JSON.parse(data);
        if (
          err ||
          !isObject(data) ||
          !Array.isArray(data.contents) ||
          !isObject(data.contents[0])
        ) {
          throw new Error();
        }
        resolve(data);
      } catch (err) {
        reject("Could not parse FileTree");
      }
    });
  });
}

module.exports = commands;
