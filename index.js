#! /usr/bin/env node
const commands = require("./src/cli.js");
const { parseArgs } = require("./src/utils.js");

// Uses the argv Object to detect
// if file gets called from cli or gets required from somewhere
if (process.argv[1].endsWith("index.js")) {
  var args = parseArgs();
  var command = commands[args.command];
  if (command) command(args);
  else console.log(
    "No command provided! For help type 'npm run packageStats:help' or 'packageStats help'!"
  );
} else module.exports = Object.freeze(commands);
