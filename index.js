const { commands, parseArgs } = require("./src/cli.js");

// Uses the argv Object to detect 
// if file gets called from cli or gets required from somewhere

if (process.argv[1].endsWith("index.js")) {
  var args = parseArgs();
  var command = commands[args.command];
  if (command) command(args);
} else module.exports = Object.freeze(commands);


/*
args
yargs
minimist
commander
caporal 
oclif
Vorpal

findup-sync
*/