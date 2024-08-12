const packageVersion = require("../package.json").version;
const { writeFile, unlinkSync, readFile } = require("fs");
const {
  isObject,
  existFile,
  getFileExtension,
  convertFilePath,
  parseFileSpecificator,
  validateIpAndPort,
  startViewer,
  closeViewer,
  ValidationError,
  helpMenu,
} = require("./utils.js");
const printTree = require("./printTree.js");
const scanDir = require("./scan.js");

var savePath = "fileTree_saved.json";
var commands = {
  scan: function (options = "./", save = false, log = true) {
    if (!isObject(options)) options = { path: options };
    options.save = options.save || save;
    options.log = !!(options.log || log) || false;
    options.path = options.path || options.p || "./";
    options.exclude = options.exclude || "";
    options.withExtensions = !!options.withExtensions || options.withExtensions || true;

    if (typeof options.path !== "string")
      throw new ValidationError("Invalid Path");
    if (typeof options.exclude !== "string")
      throw new ValidationError("Invalid Exclude String");
    if (typeof options.save !== "boolean" || typeof options.log !== "boolean")
      throw new ValidationError("Invalid Arguments");
    return new Promise(function (resolve, reject) {
      try {
        resolve(handleScan(options));
      } catch (err) {
        reject(err);
      }
    });
  },
  print: function (options) {
    if (!isObject(options)) options = { path: options };
    options.path = options.path || options.p || savePath;
    if (typeof options.path !== "string" || options.path == "")
      throw new ValidationError("Invalid SaveFile Path");
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
    options.path = options.path || options.p || path || savePath;
    options.select = options.select || options.sel || "";
    if (typeof options.path !== "string")
      throw new ValidationError("Invalid SaveFile Path");
    if (typeof options.select !== "string")
      throw new ValidationError("Invalid Selector to inspect");
    return handleInspect(options);
  },
  openViewer: function (options = 8080, ip) {
    args = { loose: false, path: savePath };
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
    if (!existFile(savePath)) throw new Error("Nothing scanned yet");
    startViewer(options, args);
  },
  closeViewer: function () {
    closeViewer();
  },
  help: function () {
    console.log(helpMenu);
    return helpMenu;
  },
  version: function (options = true) {
    if (isObject(options)) options = options.log || options.l;
    if (options == undefined) options = true;
    if (typeof options !== "boolean")
      throw new ValidationError("Invalid Option");
    if (options) console.log(packageVersion);
    return packageVersion;
  },
  cleanup: function (path) {
    if (isObject(path)) path = path.path || path.p || savePath;
    if (typeof path !== "string") throw new ValidationError("Invalid Path!");
    if (existFile(path)) unlinkSync(path);
  },
  setSavePath: function (path) {
    if (isObject(path)) path = path.path || path.p;
    if (typeof path !== "string") throw new ValidationError("Invalid Options");
    path = path || savePath;
    if (typeof path !== "string" || path === "")
      throw new ValidationError("Invalid SaveFile Path");

    let ext = getFileExtension(path);
    if (ext == "" || ext == ".") path += ".json";
    else if (ext !== ".json")
      throw new ValidationError("Invalid Save File Extension: " + ext);
    savePath = path;
  },
};

async function handleScan(options) {
  let isExcluded = parseFileSpecificator(options.exclude);
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
  console.log(tree);
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
  writeFile(savePath, JSON.stringify(tree.contents[0]), "utf8", function (err) {
    if (err) throw Error("Could not save File");
  });
  return tree;
}

function handlePrint(options, tree) {
  if (!tree.hasOwnProperty("folderCount")) {
    console.log(printTree(tree));
    return;
  }
  if (
    tree.folderCount !== 0 &&
    !(tree.folderCount == 1 && tree.fileCount == 0)
  ) {
    console.log(printTree(tree.contents[0]));
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
  if (!existFile(savePath)) tree = commands.scan(options);
  else {
    tree = readFileTree(options.path || options.p || savePath);
  }
  var displayEntry = import("./displayEntry.mjs");
  Promise.all([displayEntry, tree])
    .then(function (data) {
      if (!data || !data[0].displayEntry || !data[1])
        throw new EvalError("Could not display Entry");
      let path = convertFilePath(options.select);
      let out = data[0].displayEntry({ contents: [data[1]] }, path);
      //let out = data[0].displayEntry(data[1], path);
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
