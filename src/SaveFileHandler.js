const { writeFile, readFile, rm } = require("fs/promises");
const { writeFileSync, readFileSync } = require("fs");
const {
  isObject,
  existFile,
  FileError,
  ValidationError,
} = require("./utils.js");

const compressor = require("hjson-compressor");
const {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} = require("crypto");

class SaveFiles {
  static config_path = "saves/config.json";
  static config = {
    path: "saves/saves.json",
    version: 1.0,
    amount: 0,
    encryption: false,
    compression: false,
    key: "secretKey1234",
    last: "",
  };

  static save(tree, name = "") {
    if (!isObject(tree)) return;
    if (typeof name !== "string") throw new TypeError("Invalid Name Type");
    if (name.length == 0) name = "unnamed" + this.config.amount;
    this.config.last = name;

    var str = this.#applyOptions(tree);
    this.config.amount++;

    this.#read().then(
      function (data) {
        if (typeof data !== "string") return;
        data = JSON.parse(data);
        data[name] = str;
        writeFile(this.config.path, JSON.stringify(data), "utf-8");
      }.bind(this)
    );
    this.configure();
  }

  static async load(name) {
    if (typeof name !== "string" || name.length == 0) {
      throw new ValidationError("Invalid Save Name: " + name);
    }
    // if name is "%", the last scan will be returned
    return this.#parseJSON(await this.#read(), name);
  }

  static async exists(name) {
    if (!existFile(this.config.path)) return false;
    if (!name || name == "") return true;
    try {
      return JSON.parse(await this.#read()).hasOwnProperty(name);
    } catch (err) {
      return false;
    }
  }

  static remove(name) {
    if (typeof name !== "string" || name.length == 0)
      throw new ValidationError("Invalid Save Name");
    this.#read().then(
      function (data) {
        if (typeof data !== "string" || data.indexOf(name) == -1) return;
        data = JSON.parse(data);
        data[name] = undefined;
        writeFile(this.config.path, JSON.stringify(data), "utf-8");
      }.bind(this)
    );
  }

  static delete() {
    rm(this.config.path);
  }

  static configure(options = {}, version = this.config.version) {
    if (!isObject(options)) throw new TypeError("Invalid Options Type");
    this.config.path = options.savefilePath || this.config.path;
    this.config.compression =
      typeof options.compression !== undefined
        ? options.compression
        : this.config.compression;
    this.config.encryption =
      typeof options.encryption !== undefined
        ? options.encryption
        : this.config.encryption;
    this.config.version = version;
    writeFile(
      this.config_path,
      JSON.stringify(this.config),
      "utf-8",
      function (err) {
        if (err) console.warn("Save System Config could not be written");
      }
    );
    if (!existFile(this.config.path)) {
      writeFile(this.config.path, "{}", "utf-8", function (err) {
        if (err) throw new FileError("Could not create Save System");
      });
    }
  }

  static async init() {
    if (!existFile(this.config_path)) {
      let data = JSON.stringify(this.config);
      return writeFileSync(this.config_path, data, "utf-8", function (err) {
        if (err) throw new FileError("Could not create Save System");
      });
    }
    try {
      var data = readFileSync(this.config_path, "utf-8") || "{}";
      data = JSON.parse(data);
      if (!isObject(data)) throw "";
    } catch (err) {
      throw new EvalError("Could not load Config for Save System");
    }
    for (const key of Object.keys(this.config)) {
      if (key === "key") continue;
      if (data[key]) this.config[key] = data[key];
    }
  }

  static async #read(path = this.config.path) {
    return (
      (await readFile(path, "utf-8").catch(function () {
        throw new FileError("Could not load File from Path: " + path);
      })) || "{}"
    );
  }

  static #parseJSON(data = "", name = "") {
    if (typeof data !== "string" || data == "") {
      throw new TypeError("Invalid JSON Data Type");
    }
    try {
      data = JSON.parse(data);
      if (!isObject(data)) return "";
    } catch (err) {
      throw new EvalError("Could parse Save File");
    }
    if (name === "%") data = data[this.config.last];
    else data = data[name];

    if (!data.startsWith("{")) data = Buffer.from(data, "base64");
    if (this.config.encryption) data = SaveFiles.decrypt(data);
    if (this.config.compression) data = compressor.decompress(data);
    else data = JSON.parse(data);
    return data;
  }

  static #applyOptions(data) {
    if (this.config.compression) data = compressor.compress(data);
    else data = JSON.stringify(data);
    if (this.config.encryption) data = SaveFiles.encrypt(data);
    if (Buffer.isBuffer(data)) data = data.toString("base64");
    return data;
  }

  static encrypt(data) {
    if (!data) throw new TypeError("Invalid data for Encryption");
    if (typeof data === "string") data = Buffer.from(data, "utf8");
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      "aes-256-ctr",
      createHash("sha256")
        .update(this.config.key)
        .digest("base64")
        .slice(0, 32),
      iv
    );
    return Buffer.concat([iv, cipher.update(data), cipher.final()]);
  }

  static decrypt(data) {
    if (!data) throw new TypeError("Invalid data for Decryption");
    const input = Buffer.from(data, "base64");
    const decipher = createDecipheriv(
      "aes-256-ctr",
      createHash("sha256")
        .update(this.config.key)
        .digest("base64")
        .slice(0, 32),
      input.subarray(0, 16)
    );
    return Buffer.concat([
      decipher.update(input.subarray(16)),
      decipher.final(),
    ]);
  }
}

module.exports = SaveFiles;
