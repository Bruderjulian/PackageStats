const { readFileSync, writeFile, rm, readFile } = require("fs");
const {
  isObject,
  existFile,
  FileError,
  ValidationError,
  setDefault,
} = require("./utils.js");
const compressor = require("./compressor.js");
const {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} = require("crypto");

class SaveFiles {
  static config_path = "saves/config.json";
  static key = this.#hashKey("secretKey1234");
  static #config = {
    path: "saves/saves.json",
    version: 1.0,
    amount: 0,
    encryption: false,
    compression: false,
    last: "",
  };

  static save(tree, name = "") {
    if (!isObject(tree)) return;
    if (typeof name !== "string") throw new TypeError("Invalid Name Type");
    if (name.length == 0) name = "unnamed" + this.#config.amount;
    this.#config.last = name;

    var data = this.#applyOptions(tree);
    this.#config.amount++;

    this.#readSave().then(function (saves) {
      saves[name] = data;
      SaveFiles.#writeSave(data);
    });
    this.#saveConfig();
  }

  static async load(name) {
    if (typeof name !== "string" || name.length == 0) {
      throw new ValidationError("Invalid Save Name: " + name);
    }
    // if name is "%", the last scan will be returned
    return this.#parseJSON(await this.#readSave(), name);
  }

  static async exists(name) {
    if (typeof name !== "string" || name.length == 0) {
      throw new ValidationError("Invalid Save Name: " + name);
    }
    if (!existFile(this.#config.path)) return false;
    if (!name || name == "") return true;
    try {
      return (await this.#readSave()).hasOwnProperty(name);
    } catch (err) {
      return false;
    }
  }

  static remove(name) {
    if (typeof name !== "string" || name.length == 0) {
      throw new ValidationError("Invalid Save Name: " + name);
    }
    this.#readSave().then(
      function (saves) {
        if (!saves.hasOwnProperty(name)) return;
        saves[name] = undefined;
        this.#writeSave(saves);
      }.bind(this)
    );
  }

  static delete() {
    rm(this.#config.path);
  }

  static configure(options = {}, version = this.#config.version) {
    if (!isObject(options)) throw new TypeError("Invalid Options Type");
    this.#config.path = setDefault(this.#config.path, options.savefilePath);
    this.#config.compression = setDefault(
      this.#config.compression,
      options.compression
    );
    this.#config.encryption = setDefault(
      this.#config.encryption,
      options.encryption
    );
    this.#config.version = version;
    this.#config.encryption = setDefault(
      this.#config.encryption,
      options.encryption
    );
    if (typeof options.key === "string" && options.key.length > 4) {
      this.key = this.#hashKey(options.key);
    }

    this.#saveConfig();
  }

  static init() {
    if (!existFile(this.config_path)) return this.#saveConfig();

    try {
      var data = readFileSync(this.config_path, "ascii");
      data = JSON.parse(data || "{}");
      if (!isObject(data)) throw "";
    } catch (err) {
      throw new EvalError("Could not load Config for Save System");
    }
    for (const key of Object.keys(this.#config)) {
      if (key === "key") continue;
      if (typeof data[key] !== "undefined") this.#config[key] = data[key];
    }

    if (!existFile(this.#config.path)) {
      this.#config.amount = 0;
      return this.#writeSave("{}");
    } else {
      try {
        this.#readSave().then(function (str) {
          this.#config.amount = Object.keys(JSON.parse(str)).length;
        }.bind(this));
      } catch (e) {}
    }
  }

  static #parseJSON(data = "", name = "") {
    if (name === "%") data = data[this.#config.last];
    else data = data[name];

    if (this.#config.encryption) data = SaveFiles.#decrypt(data);
    if (this.#config.compression) data = compressor.decompress(data);
    else data = JSON.parse(data);
    return data;
  }

  static #applyOptions(data) {
    if (this.#config.compression) data = compressor.compress(data);
    else data = JSON.stringify(data);
    if (this.#config.encryption) data = SaveFiles.#encrypt(data);
    return data;
  }

  static #encrypt(data) {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-ctr", this.key, iv);
    return (
      iv.toString("base64") +
      cipher.update(data, "ascii", "ascii") +
      cipher.final("ascii")
    );
  }

  static #decrypt(data) {
    const iv = Buffer.from(data.substring(0, 24), "base64");
    const decipher = createDecipheriv("aes-256-ctr", this.key, iv);
    return (
      decipher.update(data.substring(24), "ascii", "ascii") +
      decipher.final("ascii")
    );
  }

  static #hashKey(key) {
    return createHash("sha256").update(key).digest();
  }

  static async #readSave(path = this.#config.path) {
    return new Promise(function (resolve, reject) {
      readFile(path, "ascii", function (err, data) {
        if (err || typeof data !== "string" || data.length < 2) {
          reject(new FileError("Could not read Save File from Path: " + path));
        }
        try {
          data = JSON.parse(data || "{}") || {};
          if (!isObject(data)) throw "";
          resolve(data);
        } catch {
          reject(new EvalError("Could not parse Save File from Path: " + path));
        }
      });
    });
  }

  static async #writeSave(data) {
    writeFile(this.#config.path, JSON.stringify(data), "ascii", function (err) {
      if (err) throw new FileError("Could not write to Save File");
    });
  }

  static #saveConfig() {
    writeFile(
      this.config_path,
      JSON.stringify(this.#config),
      "ascii",
      function (err) {
        if (err) console.warn("PackageStats Configs could not be written to");
      }
    );
  }
}

module.exports = SaveFiles;
