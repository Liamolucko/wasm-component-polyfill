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
* A WebAssembly component.
*/
export interface Component {
  /**
  * All of the core modules available in the component.
  */
  modules: Module[],
  /**
  * All of the core instances available in the component.
  */
  coreInstances: CoreInstance[],
  /**
  * All of the core functions available in the component.
  */
  coreFuncs: CoreFunc[],
  /**
  * All of the core tables that we've aliased.
  */
  tables: CoreExport[],
  /**
  * All of the core memories that we've aliased.
  */
  memories: CoreExport[],
  /**
  * All of the core globals that we've aliased.
  */
  globals: CoreExport[],
  /**
  * Storage for nested types.
  */
  types: Deftype[],
  /**
  * All of the functions available in the component.
  */
  funcs: Func[],
  /**
  * The exports of the component.
  */
  exports: Export[],
}
/**
* A module in a component.
*/
export type Module = ModuleImported | ModuleInline;
/**
* An imported module, imported with the contained name.
*/
export interface ModuleImported {
  tag: "imported",
  val: string,
}
/**
* An inline module, consisting of the contained raw bytes.
*/
export interface ModuleInline {
  tag: "inline",
  val: Uint8Array,
}
/**
* A core instance.
* 
* This can either be an actual instantiation of a core module, or just a
* grouping of core functions that make up the 'exports' of the module.
*/
export type CoreInstance = CoreInstanceModule | CoreInstanceReexporter;
/**
* An instance created by instantiating a module.
*/
export interface CoreInstanceModule {
  tag: "module",
  val: ModuleInstance,
}
/**
* An 'instance' which just reexports things from other instances.
*/
export interface CoreInstanceReexporter {
  tag: "reexporter",
  val: CoreReexport[],
}
/**
* A core instance created by instantiating a module with a set of imports.
*/
export interface ModuleInstance {
  /**
  * The index of the module to be instantiated.
  */
  module: number,
  /**
  * The arguments to instantiate the module with.
  */
  args: CoreInstantiateArg[],
}
/**
* An argument when instantiating a core module.
* 
* Each argument defines the instance which is referenced when writing
* `(import <name> "...")`.
*/
export interface CoreInstantiateArg {
  /**
  * The namespace being provided.
  */
  name: string,
  /**
  * The index of the instance which provides this namespace.
  */
  instance: number,
}
/**
* A core export defined as part of a reexporting core instance.
*/
export interface CoreReexport {
  /**
  * The name of the export.
  */
  name: string,
  /**
  * What sort of export it is.
  */
  sort: CoreSort,
  /**
  * The index of the thing to be exported in the index space of the sort
  * that it is.
  */
  index: number,
}
/**
* A sort of thing that a core export/import can be.
* 
* # Variants
* 
* ## `"func"`
* 
* A function.
* 
* ## `"table"`
* 
* A table.
* 
* ## `"memory"`
* 
* A memory.
* 
* ## `"global"`
* 
* A global.
*/
export type CoreSort = "func" | "table" | "memory" | "global";
export type CoreFunc = CoreFuncAliased | CoreFuncLowered;
/**
* A core function aliased from a module.
*/
export interface CoreFuncAliased {
  tag: "aliased",
  val: CoreExport,
}
/**
* A core function lowered from a component function.
*/
export interface CoreFuncLowered {
  tag: "lowered",
  val: LoweredFunc,
}
/**
* A core function lowered from a component function.
*/
export interface LoweredFunc {
  /**
  * The index of the component function this is lowered from.
  */
  func: number,
  /**
  * The type of the function we're lowering from.
  */
  ty: FuncType,
  /**
  * The options specified for how to lower this function.
  */
  options: CanonOpts,
}
/**
* The type of a component function.
* 
* This also contains extra annotations about how the function should be
* lifted/lowered.
*/
export interface FuncType {
  /**
  * The parameters of the function.
  */
  params: AnnotatedValtype[],
  /**
  * The result of the function.
  */
  result: AnnotatedValtype,
  /**
  * Whether the arguments will be passed as core WebAssembly arguments
  * rather than on the stack.
  */
  flatParams: boolean,
  /**
  * Whether the result will be passed as core WebAssembly results rather
  * than on the stack.
  */
  flatResult: boolean,
}
/**
* A primitive value type.
* 
* # Variants
* 
* ## `"unit"`
* 
* The unit type.
* 
* ## `"bool"`
* 
* A boolean.
* 
* ## `"s8"`
* 
* An 8-bit signed integer.
* 
* ## `"u8"`
* 
* An 8-bit unsigned integer.
* 
* ## `"s16"`
* 
* A 16-bit signed integer.
* 
* ## `"u16"`
* 
* A 16-bit unsigned integer.
* 
* ## `"s32"`
* 
* A 32-bit signed integer.
* 
* ## `"u32"`
* 
* A 32-bit unsigned integer.
* 
* ## `"s64"`
* 
* A 64-bit signed integer.
* 
* ## `"u64"`
* 
* A 64-bit unsigned integer.
* 
* ## `"float32"`
* 
* A 32-bit floating point number.
* 
* ## `"float64"`
* 
* A 64-bit floating point number.
* 
* ## `"char"`
* 
* A Unicode character (more specifically, a Unicode Scalar Value).
* 
* ## `"string"`
* 
* A string.
*/
export type Primtype = "unit" | "bool" | "s8" | "u8" | "s16" | "u16" | "s32" | "u32" | "s64" | "u64" | "float32" | "float64" | "char" | "string";
/**
* The type of a value.
*/
export type Valtype = ValtypeIdx | ValtypePrimitive;
/**
* The type at the contained index.
* 
* Note that this index can be an index into one of two places - if this
* is contained in an `annotated-valtype`, it's an index into the
* `annotated-types` field of `component`, otherwise it's an index into
* the `types` field.
*/
export interface ValtypeIdx {
  tag: "idx",
  val: number,
}
/**
* A primitive type.
*/
export interface ValtypePrimitive {
  tag: "primitive",
  val: Primtype,
}
/**
* A user-defined type.
*/
export type Deftype = DeftypePrimitive;
/**
* A primitive type.
*/
export interface DeftypePrimitive {
  tag: "primitive",
  val: Primtype,
}
/**
* The type of a value, annotated with info on how it should be lifted/lowered.
*/
export interface AnnotatedValtype {
  /**
  * The offset at which this type should be lowered/lifted.
  * 
  * If using flat params/results, this is the index of the first param/result
  * that is part of this type.
  * 
  * If lowering/lifting using the stack, this is the offset in memory of
  * the type.
  */
  offset: number,
  /**
  * The inner type.
  */
  ty: Valtype,
}
/**
* A user-defined type, annotated with info on how it should be lifted/lowered.
*/
export interface AnnotatedDeftype {
  /**
  * The offset at which this type should be lowered/lifted.
  * 
  * If using flat params/results, this is the index of the first param/result
  * that is part of this type.
  * 
  * If lowering/lifting using the stack, this is the offset in memory of
  * the type.
  */
  offset: number,
  /**
  * The inner type.
  */
  ty: Deftype,
}
/**
* # Variants
* 
* ## `"utf8"`
* 
* ## `"utf16"`
* 
* ## `"latin1-or-utf16"`
*/
export type StringEncoding = "utf8" | "utf16" | "latin1-or-utf16";
/**
* Options passed to a `canon lower` / `canon lift` operation.
*/
export interface CanonOpts {
  /**
  * The encoding that the function to be lifted uses for strings.
  */
  stringEncoding: StringEncoding,
  /**
  * The index of the memory that should be used to load and store values.
  */
  memory?: number,
  /**
  * The index of the `realloc` function to be used to allocate space for
  * values.
  */
  realloc?: number,
  /**
  * The index of the `post-return` function, which should be called after
  * the core function has returned and its results have been lifted, with
  * the results of the core function as its parameters.
  */
  postReturn?: number,
}
/**
* An export of a core instance.
*/
export interface CoreExport {
  /**
  * The index of the instance it's an export of.
  */
  instance: number,
  /**
  * The name of the export.
  */
  name: string,
}
/**
* A component function.
*/
export type Func = FuncImported | FuncLifted;
/**
* A component function imported with the contained name.
*/
export interface FuncImported {
  tag: "imported",
  val: string,
}
/**
* A component function lifted from a core function.
*/
export interface FuncLifted {
  tag: "lifted",
  val: LiftedFunc,
}
/**
* A component function lifted from a core function.
*/
export interface LiftedFunc {
  /**
  * The index of the core function this is lifted from.
  */
  coreFunc: number,
  /**
  * The type of the function.
  */
  ty: FuncType,
  /**
  * The options specified for how to lift this function.
  */
  options: CanonOpts,
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
  * The index of the thing being exported in the index space of its sort.
  */
  index: number,
}
/**
* A sort of thing to be exported.
* 
* # Variants
* 
* ## `"module"`
* 
* A core module.
* 
* ## `"func"`
* 
* A function.
*/
export type Sort = "module" | "func";
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
  parse(data: Uint8Array): Result<Component | null, Error>;
}
