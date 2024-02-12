//heavily modified code from https://www.npmjs.com/package/ansi-escapes
const isWindows =
  (typeof window == "undefined" || typeof window.document == "undefined") &&
  require("process").platform === "win32";

var terminal = {};
terminal.clearScreen = "\u001Bc";

terminal.clearTerminal = isWindows
  ? `\u001B[2J\u001B[0f`
  : `\u001B[2J\u001B[3J\u001B["H`;

terminal.link = (text, url, color) =>
  ["\u001B]8;;", url, "\u0007", text, "\u001B]8;;\u0007"].join("");

terminal.color = (text, color) => color + text + "\x1b[0m";

terminal.colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    crimson: "\x1b[38m", // Scarlet
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    gray: "\x1b[100m",
    crimson: "\x1b[48m",
  },
};

module.exports = terminal;
