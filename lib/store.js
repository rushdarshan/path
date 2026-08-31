"use strict";

// Minimal JSON-file persistence store. One file per session in ./data.
// No database dependency — zero-install works.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function sessionFile(id) { return path.join(DATA_DIR, `${id}.json`); }

function load(id) {
  try {
    const raw = fs.readFileSync(sessionFile(id), "utf8");
    return JSON.parse(raw);
  } catch { return null; }
}

function save(id, data) {
  fs.writeFileSync(sessionFile(id), JSON.stringify(data, null, 2));
  return data;
}

function remove(id) {
  try { fs.unlinkSync(sessionFile(id)); } catch {}
}

function list() {
  return fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5));
}

module.exports = { load, save, remove, list, DATA_DIR };