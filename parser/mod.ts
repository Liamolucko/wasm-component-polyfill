// @deno-types="./bindings/parser.d.ts"
import {
  CanonOpts,
  Parser,
  Primtype,
  StringEncoding,
} from "./bindings/parser.js";
export type {
  AnnotatedValtype,
  CanonOpts,
  Component,
  CoreExport,
  CoreFunc,
  CoreInstance,
  CoreInstantiateArg,
  CoreReexport,
  CoreSort,
  Export,
  Func,
  FuncType,
  LiftedFunc,
  LoweredFunc,
  Module,
  ModuleInstance,
  Sort,
  StringEncoding,
  Valtype,
} from "./bindings/parser.d.ts";
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
        // @ts-ignore the type declarations for this constructor are outdated
        `${result.val.message} (at offset 0x${result.val.offset.toString(16)})`,
      );
  }
}

export interface ResolvedCanonOpts {
  stringEncoding: StringEncoding;
  memory?: WebAssembly.Memory;
  realloc?: (
    originalPtr: number,
    originalSize: number,
    alignment: number,
    newSize: number,
  ) => number;
  postReturn?: (...args: number[]) => void;
}
/** A component function, resolved not to have type indirection. */
export type ResolvedFunc = ResolvedFuncImported | ResolvedFuncLifted;

/** A component function imported with the contained name. */
interface ResolvedFuncImported {
  tag: "imported";
  val: string;
}

/** A component function lifted from a core function. */
interface ResolvedFuncLifted {
  tag: "lifted";
  val: ResolvedLiftedFunc;
}

/** A component function lifted from a core function, resolved not to have type indirection.. */
export interface ResolvedLiftedFunc {
  /** The index of the core function this is lifted from. */
  coreFunc: number;
  /** The type of the function. */
  ty: ResolvedFuncType;
  /** The options specified for how to lift this function. */
  options: CanonOpts;
}

/**
 * The type of a component function, resolved not to contain any type indirection.
 *
 * This also contains extra annotations about how the function should be
 * lifted/lowered.
 */
export interface ResolvedFuncType {
  /**
   * The parameters of the function.
   */
  params: ResolvedAnnotatedValtype[];
  /**
   * The result of the function.
   */
  result: ResolvedAnnotatedValtype;
  /**
   * Whether the arguments will be passed as core WebAssembly arguments
   * rather than on the stack.
   */
  flatParams: boolean;
  /**
   * Whether the result will be passed as core WebAssembly results rather
   * than on the stack.
   */
  flatResult: boolean;
}

/**
 * The type of a value, annotated with info on how it should be lifted/lowered.
 *
 * Resolved not to contain any type indirection.
 */
export interface ResolvedAnnotatedValtype {
  /**
   * The offset at which this type should be lowered/lifted.
   *
   * If using flat params/results, this is the index of the first param/result
   * that is part of this type.
   *
   * If lowering/lifting using the stack, this is the offset in memory of
   * the type.
   */
  offset: number;
  /**
   * The inner type.
   */
  ty: ResolvedValtype;
}

/**
 * The type of a value, resolved not to contain any indirection.
 */
export type ResolvedValtype = ResolvedValtypePrimitive;

/**
 * A primitive type.
 */
interface ResolvedValtypePrimitive {
  tag: "primitive";
  val: Primtype;
}
