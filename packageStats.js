const { commands, parseArgs } = require("./src/cli.js");

var args = parseArgs();
var command = commands[args.command];
if (command) command(args);


