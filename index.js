#! /usr/bin/env node
const commands = require("./src/cli.js");

class ArgumentError extends Error {
  constructor(message = "") {
    super(message);
  }
}

// Uses the argv Object to detect
// if file gets called from cli or gets required from somewhere
if (process.argv[1].endsWith("index.js")) {
  var args = parseArgs();
  var command = commands[args.command];
  if (command) command(args);
  else {
    console.log(
      "No command provided! For help, type 'packageStats help' or use packageStats.help()!"
    );
  }
} else module.exports = Object.freeze(commands);

function parseArgs() {
  var args = {},
    argv = process.argv.slice(2);
  var name = "";
  var cmdNames = Object.keys(commands);
  for (var i = 0; i < argv.length; i++) {
    name = argv[i].trim();
    if (cmdNames.includes(name) && !args.command) {
      //commands
      args.command = name;
    } else if (name.startsWith("-")) {
      // arguments
      name = name.replaceAll("-", "");
      if (name.includes("=")) {
        name = name.split("=");
        args[name[0]] = name[1];
      } else if (argv[i + 1] && !argv[i + 1].startsWith("-")) {
        args[name] = argv[++i].trim();
      } else args[name.replace("!", "")] = name.indexOf("!") == -1;
    } else throw new ArgumentError("Invalid Argument: " + name);
  }
  return args;
}