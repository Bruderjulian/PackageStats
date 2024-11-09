const { readFileSync } = require("fs");
const { compress, decompress } = require("../src/compressor.js");
const zora = require("zora");
/*
zora.test("compressor", function (assert) {
  for (let key of Object.keys(saves)) {
    let str = saves[key];
    let obj = JSON.parse(str);
    let compressed = compress(obj);
    let out = decompress(compressed);
    console.log(
      "Ratio of '" + key + "':",
      Buffer.byteLength(compressed, "ascii") / Buffer.byteLength(str, "ascii")
    );
    assert.equal(obj, out);
  }
});
*/
