export type Result<T, E> = { tag: "ok", val: T } | { tag: "err", val: E };
/**
* An error returned from the parser.
*/
export interface Error {
  /**
  * The error's message.
  */
  message: string,
  /**
  * The offset in the wasm binary where the error occurred.
  */
  offset: number,
}
/**
* The result of parsing.
*/
export interface Output {
  /**
  * The types used by the component.
  */
  types: Valtype[],
  /**
  * All of the component's imports.
  */
  imports: Import[],
  /**
  * All of the component's exports.
  */
  exports: Export[],
}
/**
* The type of a value.
*/
export type Valtype = ValtypeIdx | ValtypeUnit | ValtypeBool | ValtypeS8 | ValtypeU8 | ValtypeS16 | ValtypeU16 | ValtypeS32 | ValtypeU32 | ValtypeS64 | ValtypeU64 | ValtypeFloat32 | ValtypeFloat64 | ValtypeChar | ValtypeString;
/**
* The type at the contained index.
*/
export interface ValtypeIdx {
  tag: "idx",
  val: number,
}
/**
* The unit type.
*/
export interface ValtypeUnit {
  tag: "unit",
}
/**
* A boolean.
*/
export interface ValtypeBool {
  tag: "bool",
}
/**
* An 8-bit signed integer.
*/
export interface ValtypeS8 {
  tag: "s8",
}
/**
* An 8-bit unsigned integer.
*/
export interface ValtypeU8 {
  tag: "u8",
}
/**
* A 16-bit signed integer.
*/
export interface ValtypeS16 {
  tag: "s16",
}
/**
* A 16-bit unsigned integer.
*/
export interface ValtypeU16 {
  tag: "u16",
}
/**
* A 32-bit signed integer.
*/
export interface ValtypeS32 {
  tag: "s32",
}
/**
* A 32-bit unsigned integer.
*/
export interface ValtypeU32 {
  tag: "u32",
}
/**
* A 64-bit signed integer.
*/
export interface ValtypeS64 {
  tag: "s64",
}
/**
* A 64-bit unsigned integer.
*/
export interface ValtypeU64 {
  tag: "u64",
}
/**
* A 32-bit floating point number.
*/
export interface ValtypeFloat32 {
  tag: "float32",
}
/**
* A 64-bit floating point number.
*/
export interface ValtypeFloat64 {
  tag: "float64",
}
/**
* A Unicode character (more specifically, a Unicode Scalar Value).
*/
export interface ValtypeChar {
  tag: "char",
}
/**
* A string.
*/
export interface ValtypeString {
  tag: "string",
}
/**
* A component import.
*/
export interface Import {
  /**
  * The name of the import.
  */
  name: string,
  /**
  * The description of the thing to be imported.
  * 
  * Basically the import's type, except that functions, modules etc.
  * are allowed as well as values.
  */
  desc: Externdesc,
}
/**
* A component export.
*/
export interface Export {
  /**
  * The name of the export.
  */
  name: string,
  /**
  * The sort of thing being exported (value, function, etc.)
  */
  sort: Sort,
  /**
  * The index of the thing being exported.
  */
  idx: number,
}
/**
* A description of a thing to be imported.
*/
export type Externdesc = ExterndescFunc;
/**
* A function whose type has the contained index.
*/
export interface ExterndescFunc {
  tag: "func",
  val: number,
}
/**
* A sort of thing to be exported.
*/
export type Sort = SortFunc;
/**
* A function.
*/
export interface SortFunc {
  tag: "func",
}
export class Parser {
  
  /**
  * The WebAssembly instance that this class is operating with.
  * This is only available after the `instantiate` method has
  * been called.
  */
  instance: WebAssembly.Instance;
  
  /**
  * Constructs a new instance with internal state necessary to
  * manage a wasm instance.
  *
  * Note that this does not actually instantiate the WebAssembly
  * instance or module, you'll need to call the `instantiate`
  * method below to "activate" this class.
  */
  constructor();
  
  /**
  * This is a low-level method which can be used to add any
  * intrinsics necessary for this instance to operate to an
  * import object.
  *
  * The `import` object given here is expected to be used later
  * to actually instantiate the module this class corresponds to.
  * If the `instantiate` method below actually does the
  * instantiation then there's no need to call this method, but
  * if you're instantiating manually elsewhere then this can be
  * used to prepare the import object for external instantiation.
  */
  addToImports(imports: any): void;
  
  /**
  * Initializes this object with the provided WebAssembly
  * module/instance.
  *
  * This is intended to be a flexible method of instantiating
  * and completion of the initialization of this class. This
  * method must be called before interacting with the
  * WebAssembly object.
  *
  * The first argument to this method is where to get the
  * wasm from. This can be a whole bunch of different types,
  * for example:
  *
  * * A precompiled `WebAssembly.Module`
  * * A typed array buffer containing the wasm bytecode.
  * * A `Promise` of a `Response` which is used with
  *   `instantiateStreaming`
  * * A `Response` itself used with `instantiateStreaming`.
  * * An already instantiated `WebAssembly.Instance`
  *
  * If necessary the module is compiled, and if necessary the
  * module is instantiated. Whether or not it's necessary
  * depends on the type of argument provided to
  * instantiation.
  *
  * If instantiation is performed then the `imports` object
  * passed here is the list of imports used to instantiate
  * the instance. This method may add its own intrinsics to
  * this `imports` object too.
  */
  instantiate(
  module: WebAssembly.Module | BufferSource | Promise<Response> | Response | WebAssembly.Instance,
  imports?: any,
  ): Promise<void>;
  /**
  * Parses the passed bytes into a WebAssembly component, or returns `none` if the input is a module.
  */
  parse(data: Uint8Array): Result<Output, Error> | null;
}
