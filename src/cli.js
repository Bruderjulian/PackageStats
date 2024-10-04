const packageVersion = require("../package.json").version;
const {
  isObject,
  existFile,
  convertFilePath,
  parseFileSpecificator,
  ValidationError,
  helpMenu,
  throwOptionError,
  setDefault,
  parseSavePath,
} = require("./utils.js");
const printTree = require("./printTree.js");
const scanDir = require("./scan.js");
const SaveFileHandler = require("./SaveFileHandler.js");
const {
  startViewer,
  closeViewer,
  validateIP,
  validatePort,
} = require("./viewer.js");

var config = {
  savefilePath: "",
  encryption: false,
  compression: true,
  saving: true,
  logging: true,
  ip: "127.0.0.1",
  port: 8080,
  withExtensions: true,
};

var commands = {
  scan: function (options) {
    if (!isObject(options)) options = { path: options };
    options.path = setDefault("./", options.path, options.p);
    options.exclude = setDefault("", options.exclude);
    options.saving = setDefault(config.saving, options.saving, options.s);
    options.logging = setDefault(config.logging, options.logging, options.l);
    options.withExtensions = setDefault(
      config.withExtensions,
      options.withExtensions
    );
    if (typeof options.path !== "string")
      throw new ValidationError("Invalid Path: " + options.path);
    if (typeof options.exclude !== "string")
      throw new ValidationError("Invalid Exclude String");
    if (typeof options.saving !== "boolean") throwOptionError("saving");
    if (typeof options.logging !== "boolean") throwOptionError("logging");
    if (typeof options.withExtensions !== "boolean")
      throwOptionError("extensions");
    return new Promise(function (resolve, reject) {
      try {
        resolve(handleScan(options));
      } catch (err) {
        reject(err);
      }
    });
  },
  print: function (options) {
    if (isObject(options)) options = setDefault("%", options.path, options.p);
    if (typeof options !== "string")
      throw new ValidationError("Invalid Save Name: " + options);
    SaveFileHandler.load(options).then(function (data) {
      handlePrint(data);
    });
  },
  inspect: function (options = {}) {
    if (!isObject(options)) options = { select: options };
    options.path = setDefault("%", options.path, options.p);
    options.select = setDefault("", options.select, options.sel);
    if (typeof options.path !== "string")
      throw new ValidationError("Invalid Save Name: " + options.path);
    if (typeof options.select !== "string")
      throw new ValidationError("Invalid Selector to inspect");
    return handleInspect(options);
  },
  openViewer: function (options) {
    options.ip = setDefault(config.ip, options.ip);
    options.port = setDefault(config.port, options.port);
    options.path = setDefault("%", options.path, options.p);
    if (!validateIP(options.ip)) throwOptionError("IP");
    if (!validatePort(options.port)) throwOptionError("port");
    if (typeof options.path !== "string" || options.path.length == 0) {
      throw new ValidationError("Invalid Save Name: " + options.path);
    }
    args = { loose: false, path: options.path };
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
    if (isObject(options))
      options = setDefault(config.logging, options.logging, options.l);
    if (typeof options !== "boolean") throwOptionError("logging");
    if (options) console.log(packageVersion);
    return packageVersion;
  },
  manageSaves: function (options) {
    options.path = setDefault("", options.path, options.p);
    options.wipe = setDefault(false, options.wipe);
    if (typeof options.path !== "string" || options.length == 0)
      throw new ValidationError("Invalid Save Name: " + options.path);
    if (typeof options.wipe !== "boolean") throwOptionError("wipe");
  },
  remove: function (options) {
    SaveFileHandler.remove(options.path);
  },
  delete: function () {
    SaveFileHandler.delete();
  },
  configure: function (options) {
    if (!isObject(options)) throw new ValidationError("Invalid Argument Type");
    for (const key of Object.keys(config)) {
      if (typeof config[key] !== "boolean" || options[key] == undefined)
        continue;
      if (typeof options[key] !== "boolean") throwOptionError(key);
      config[key] = !!options[key];
    }

    if (validateIP(options.ip)) {
      config.ip = options.ip;
    } else if (options.ip) throwOptionError("IP");
    if (validatePort(options.port)) {
      config.port = options.port;
    } else if (options.port) throwOptionError("port");

    if (options.savefilePath) {
      config.savefilePath = parseSavePath(options.savefilePath);
    }
    SaveFileHandler.configure(config, packageVersion);
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
    logging: options.logging,
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
  if (options.logging) handlePrint(tree);
  if (options.saving) SaveFileHandler.save(tree.contents[0], options.name);
  return tree;
}

function handlePrint(tree) {
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
  if (!existFile(config.savefilePath)) tree = commands.scan(options);
  else {
    tree = readFileTree(options.path || options.p);
  }
  var displayEntry = import("./displayEntry.js");
  Promise.all([displayEntry, tree])
    .then(function (data) {
      if (!data || !data[0].displayEntry || !data[1])
        throw new EvalError("Could not display Entry");
      let path = convertFilePath(options.select);
      let out = data[0].displayEntry({ contents: [data[1]] }, path);
      console.log(out);
      return data[1];
    })
    .catch(function () {
      throw EvalError("Could not inspect entry");
    });
}

module.exports = commands;
