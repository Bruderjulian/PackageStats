const zora = require("zora");
const utils = require("../src/utils.js");

zora.test("utils existFile", function (assert) {
  assert.ok(utils.existFile("./index.js"));
  assert.ok(utils.existFile("./"));
  assert.notOk(utils.existFile("./abc.js"));

})
zora.test("utils isFile", function (assert) {
  assert.ok(utils.isFile("./index.js"));
  assert.notOk(utils.isFile("./"));
})
zora.test("utils isFolder", function (assert) {
  assert.notOk(utils.isFolder("./utils.test.js"));
  assert.ok(utils.isFolder("./"));
})
zora.test("utils isTextFile", function (assert) {
  assert.ok(utils.isTextFile("./index.js"));
  assert.notOk(utils.isTextFile("./"));
  assert.notOk(utils.isTextFile("./viewer/assets/favicon.ico"));
})

zora.test("utils getFileExtension", function (assert) {
  assert.equals(utils.getFileExtension("index.js"), ".js");
  assert.equals(utils.getFileExtension("index.html"), ".html");
  assert.equals(utils.getFileExtension("./"), ".");
  assert.equals(utils.getFileExtension("."), ".");
  assert.equals(utils.getFileExtension(".git"), ".");
})
zora.test("utils getFileName", function (assert) {
  assert.equals(utils.getFileName("index.js"), "index.js");
  assert.equals(utils.getFileName("favicon.ico"), "favicon.ico");
  assert.equals(utils.getFileName(".git"), ".git");
  assert.equals(utils.getFileName("./"), ".");
  assert.equals(utils.getFileName("."), ".");
  assert.equals(utils.getFileName(""), "");
})
zora.test("utils getFolderName", function (assert) {
  assert.equals(utils.getFolderName("abc/"), "./");
  assert.equals(utils.getFolderName("./a/b/"), "./a/");
  assert.equals(utils.getFolderName("./"), "./");
  assert.equals(utils.getFolderName("."), "./");
  assert.equals(utils.getFolderName(""), "./");
})
zora.test("utils getFullPath", function (assert) {
  assert.equals(utils.getFullPath("./saves/saves.json"), "H:/Meine_Daten/Source/VSCode/packageStats/saves/saves.json");
  assert.equals(utils.getFullPath("./"), "H:/Meine_Daten/Source/VSCode/packageStats");
  assert.equals(utils.getFullPath("."), "H:/Meine_Daten/Source/VSCode/packageStats");
  assert.equals(utils.getFullPath(""), "H:/Meine_Daten/Source/VSCode/packageStats");
})



zora.test("utils isObject", function (assert) {
  assert.ok(utils.isObject({}));
  assert.ok(utils.isObject(new Error()));
  assert.notOk(utils.isObject(Object));
  assert.notOk(utils.isObject([]));
  assert.notOk(utils.isObject(1));
  assert.notOk(utils.isObject("abc"));
  assert.notOk(utils.isObject(true));
  assert.notOk(utils.isObject(function (){}));
  assert.notOk(utils.isObject(null));
  assert.notOk(utils.isObject(NaN));
  assert.notOk(utils.isObject(undefined));
})
zora.test("utils setDefault", function (assert) {
  assert.equals(utils.setDefault("abc", "123"), "123");
  assert.equals(utils.setDefault("abc", ""), "");
  assert.equals(utils.setDefault("abc"), "abc");
  assert.equals(utils.setDefault("abc", "123", "456"), "123");
  assert.equals(utils.setDefault("abc", undefined, "123"), "123");
  assert.equals(utils.setDefault("abc", undefined, undefined), "abc");
  assert.equals(utils.setDefault(undefined), undefined);
  assert.equals(utils.setDefault(undefined, undefined), undefined);
  assert.equals(utils.setDefault(undefined, null), null)
})
zora.test("utils throwOptionError", function (assert) {
  assert.throws(function () {utils.throwOptionError("ab")});
  assert.throws(function () {utils.throwOptionError("A")});
  assert.throws(function () {utils.throwOptionError("")});
  assert.throws(function () {utils.throwOptionError()});
})
zora.test("utils convertFilePath", function (assert) {
  assert.equals(utils.convertFilePath({}), undefined);
  assert.equals(utils.convertFilePath(""), ".");
  assert.equals(utils.convertFilePath("a"), ".a");
  assert.equals(utils.convertFilePath("a/b"), ".a.b");
  assert.equals(utils.convertFilePath("a/b/c.js"), ".a.b.c?js");
})
zora.test("utils parseSavePath", function (assert) {
  assert.throws(function () {utils.parseSavePath({})});
  assert.throws(function () {utils.parseSavePath("")});
  assert.throws(function () {utils.parseSavePath("abc.js")});
  assert.truthy(function () {utils.parseSavePath("abc.json")});
  assert.truthy(function () {utils.parseSavePath("abc.")});
  assert.truthy(function () {utils.parseSavePath("abc")});
  assert.throws(function () {utils.parseSavePath("c/abc.json")});
  //wrong Test!
  assert.equals(utils.parseSavePath("$test"), "H:/Meine_Daten/Source/VSCode/packageStats/saves/testjson");
  assert.equals(utils.parseSavePath("$test."), "H:/Meine_Daten/Source/VSCode/packageStats/saves/test.json");
  assert.equals(utils.parseSavePath("$test.json"), "H:/Meine_Daten/Source/VSCode/packageStats/saves/test.json");
  assert.throws(function () {utils.parseSavePath("$")});
})

zora.test("utils [exists]", function (assert) {
  // add more specific Tests
  assert.throws(function () {throw new utils.FileError("test")}, "File Error");
  assert.throws(function () {throw new utils.ValidationError("test")}, "Validation Error");
  assert.ok(typeof utils.helpMenu === "string", "Help Menu");
  assert.ok(typeof utils.coloredLink("a", "b", "c") === "string", "Colored Link");
})