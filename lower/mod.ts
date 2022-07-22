import { FuncType, ResolvedCanonOpts, Valtype } from "../parser/mod.ts";
import {
  ToBigInt64,
  ToBigUint64,
  ToInt16,
  ToInt32,
  ToInt8,
  ToNumber,
  ToString,
  ToUint16,
  ToUint32,
  ToUint8,
} from "./intrinsics.js";
import { stackStringLowerer } from "./string.ts";

// TODO: figure out how to tell stack lowerers about what types each argument has to be.
export type StackLowerer = (out: (number | bigint)[], x: unknown) => void;
export type MemLowerer = (ptr: number, x: unknown) => void;

export function stackLowerer(
  ty: Valtype,
  opts: ResolvedCanonOpts,
): StackLowerer {
  switch (ty.tag) {
    case "unit":
      // Units push nothing onto the stack and accept any value,
      // so lowering them is a noop.
      return () => {};
    case "bool":
      return (out, x) => out.push(Number(Boolean(x)));
    case "s8":
      return (out, x) => out.push(ToInt8(x));
    case "s16":
      return (out, x) => out.push(ToInt16(x));
    case "s32":
      return (out, x) => out.push(ToInt32(x));
    case "s64":
      return (out, x) => out.push(ToBigInt64(x));
    case "u8":
      return (out, x) => out.push(ToUint8(x));
    case "u16":
      return (out, x) => out.push(ToUint16(x));
    case "u32":
      return (out, x) => out.push(ToUint32(x));
    case "u64":
      return (out, x) => out.push(ToBigUint64(x));
    case "float32":
    case "float64":
      return (out, x) => out.push(ToNumber(x));
    case "char":
      return (out, x) => {
        const s = ToString(x);
        let codePoint = s.codePointAt(0);

        /// Returns the number of UTF-16 code units in which a code point is encoded.
        function utf16Size(codePoint: number) {
          if (codePoint <= 0xFFFF) {
            return 1;
          } else {
            return 2;
          }
        }

        if (codePoint === undefined || utf16Size(codePoint) != s.length) {
          throw new TypeError(
            `expected a string of length 1 for a character, found "${s}"`,
          );
        }

        if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
          // It's an unpaired surrogate, replace it with a replacement character.
          codePoint = 0xFFFD;
        }

        out.push(codePoint);
      };
    case "string":
      return stackStringLowerer(opts);
  }
}

export function lower(
  func: (...args: unknown[]) => unknown,
  ty: FuncType,
  opts: ResolvedCanonOpts,
): (...args: number[]) => number | undefined {
  throw new Error("unimplemented");
}
