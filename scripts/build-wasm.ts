#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

import * as base64 from "https://deno.land/std@0.147.0/encoding/base64.ts";
import * as path from "https://deno.land/std@0.147.0/path/mod.ts";

// Build the WASM module.
const p = Deno.run({
  cmd: [
    "cargo",
    "build",
    "--target=wasm32-unknown-unknown",
    "--release",
  ],
  cwd: path.fromFileUrl(new URL("../parser", import.meta.url)),
});
const status = await p.status();
if (!status.success) {
  // Fail if compiling failed.
  Deno.exit(status.code);
}

// Load the WebAssembly.
const wasmPath = new URL(
  "../parser/target/wasm32-unknown-unknown/release/wasm_component_parser.wasm",
  import.meta.url,
);
const wasm = await Deno.readFile(wasmPath);

// Write it out as base64.
const dest = new URL("../parser/wasm.ts", import.meta.url);
await Deno.writeTextFile(dest, `export default "${base64.encode(wasm)}";\n`);
