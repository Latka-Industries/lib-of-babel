#!/usr/bin/env node
// Emit web/health.json for curl deploy checks (static Pages has no server).
//
//   node scripts/write-health.mjs
//
// Env (CI sets these; local falls back to git / "dev"):
//   GITHUB_SHA, GITHUB_REF_NAME, HEALTH_BUILT_AT
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function generatorVersion() {
  const src = readFileSync(join(root, "src/config/mod.rs"), "utf8");
  const m = src.match(
    /pub const GENERATOR_VERSION:\s*u32\s*=\s*(\d+)\s*;/,
  );
  if (!m) {
    throw new Error("GENERATOR_VERSION not found in src/config/mod.rs");
  }
  return Number(m[1]);
}

const sha =
  process.env.GITHUB_SHA || git(["rev-parse", "HEAD"]) || "dev";
const ref =
  process.env.GITHUB_REF_NAME ||
  git(["rev-parse", "--abbrev-ref", "HEAD"]) ||
  "dev";
const builtAt =
  process.env.HEALTH_BUILT_AT || new Date().toISOString();

const health = {
  ok: true,
  service: "lib-of-babel",
  sha,
  ref,
  built_at: builtAt,
  generator_version: generatorVersion(),
};

const out = join(root, "web/health.json");
writeFileSync(out, `${JSON.stringify(health, null, 2)}\n`);
console.log(`wrote ${out}`);
console.log(JSON.stringify(health));
