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

terminal.helpMenu = `
        ${terminal.link(
          terminal.color("Usage", terminal.colors.fg.red),
          "https://github.com/Bruderjulian/PackageStats"
        )}
	  node packageStats.js <command> <args>
          npm run cli <command> <args>
          npm run version 
          npm run view <args>
          npm run help

        ${terminal.link(
          terminal.color("Commands", terminal.colors.fg.red),
          "https://github.com/Bruderjulian/PackageStats"
        )}
          scan            scans the dictorary
          inspect         inspect a single entry
          view            opens the Viewer
          help            shows the help menu
          packageInfo     outputs the package.json
          cleanup         removes saved scannes

	${terminal.link(
    terminal.color("Options", terminal.colors.fg.red),
    "https://github.com/Bruderjulian/PackageStats"
  )}
	  --path, --p                Path to Package (default is ./)
          --select, --sel            File or Folder to inspect
          --port,                    Port to open the File Tree Viewer (default is 8080)
          --outputStyle, --style     Style to print the Tree (default is 0)
          -save, -s                  save the ouput to file. (default is false)
          -log, -l                   log Information about the scan (default is false)
          -noprint, -npr             disables the printing of the scanned File Tree (default is false)

	${terminal.link(
    terminal.color("Examples", terminal.colors.fg.red),
    "https://github.com/Bruderjulian/PackageStats"
  )}
          node packageStats.js packageInfo
	  node packageStats.js scan
	  node packageStats.js inspect --select=someFile.js
          node packageStats.js view --port=8080
`;

module.exports = terminal;
