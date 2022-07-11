// @deno-types="./bindings/parser.d.ts"
import { Parser } from "./bindings/parser.js";
import wasm from "./wasm.ts";
import * as base64 from "https://deno.land/std@0.145.0/encoding/base64.ts";

const parser = new Parser();
await parser.instantiate(base64.decode(wasm));

export function parse(data: Uint8Array) {
  const result = parser.parse(data);
  switch (result?.tag) {
    case "ok":
      return result.val;
    case "err":
      throw new WebAssembly.CompileError(
        `${result.val.message} (at offset 0x${result.val.offset.toString(16)})`,
      );
  }
}
