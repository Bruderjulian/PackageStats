import { doubleClick } from "./doubleClick.js";
import { displayEntry } from "../src/displayEntry.mjs";

var inputTree;
var entry_info = document.getElementById("entry_info");
var args = { path: "fileTree_saved.json", loose: false };

var doubleClickHandler = doubleClick(
  function (e) {
    if (!args.loose) var path = getPath(e.target);
    else var path = "." + e.target.id || e.target.innerHTML;
    if (typeof path !== "string") throw Error("Could generate Object Path");
    entry_info.innerHTML = displayEntry(inputTree, path);
  },
  function (e) {
    if (e.target.className == "folder_name") {
      e.target.parentNode.classList.toggle("open");
    }
  }
);

export function generateFileTree() {
  try {
    var out = document.getElementById("file_tree");
    if (!inputTree && !out) throw Error();
    genContents(inputTree, out);
    document.getElementById("source_info").innerHTML =
      "Source: " + inputTree.fullPath;
  } catch (error) {
    throw Error("Could not generate FileTree");
  }
}

NodeList.prototype.has = function (selector) {
  return Array.from(this).filter((e) => e.querySelector(selector));
};

export function parseFileTree(elementId) {
  var liElementsInideUl = document
    .getElementById(elementId)
    .querySelectorAll("li");
  liElementsInideUl.has("ul").forEach((li) => {
    li.classList.add("folder_root");
    li.classList.add("closed");
    li.querySelectorAll("span.folder_name").forEach((span) => {
      if (span.parentNode.nodeName === "LI") {
        span.onclick = doubleClickHandler;
      }
    });
  });
}

function genContents(tree, elem) {
  var i, entry;
  var out = elem || document.createElement("ul");
  for (i = 0; i < tree.contents.length; i++) {
    entry = tree.contents[i];
    if (entry.isFile) out.appendChild(genFile(entry.name));
    else if (entry.isFolder) out.appendChild(genFolder(entry));
  }
  return out;
}

function genFile(name) {
  var file = document.createElement("span");
  file.id = file.innerHTML = name;
  file.onclick = doubleClickHandler;
  var container = document.createElement("li");
  container.appendChild(file);
  return container;
}

function genFolder(entry) {
  var folder = document.createElement("li");
  var nameSpan = document.createElement("span");
  folder.id = nameSpan.innerHTML = entry.name;
  nameSpan.className = "folder_name";
  folder.appendChild(nameSpan);
  folder.appendChild(genContents(entry));
  return folder;
}

function getPath(node) {
  var path = "";
  var id = "";
  while (node) {
    if (node.id == "file_tree") break;
    if (typeof node.id === "string" && node.id !== "") {
      id = node.id.replaceAll(".", "?");
      path = path == "" ? id : id + "." + path;
    }
    node = node.parentElement;
  }
  return "." + path;
}

export async function fetchArgs() {
  var url = window.location.href + "/args.data";
  var res = await (await fetch(url)).json();
  if (!res) console.warn("Could not fetch args! Will use defaults");
  for (const i of Object.keys((res ||= {}))) {
    args[i] = res[i];
  }
  if (!args.path) throw Error("Could not find FileTree");
  inputTree = await (await fetch(args.path)).json();
}
