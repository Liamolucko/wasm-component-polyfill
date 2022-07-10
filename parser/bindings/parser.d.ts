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
  * The core modules in the component.
  */
  modules: Module[],
  /**
  * The core instances in the component.
  */
  coreInstances: CoreInstance[],
  /**
  * All of the core functions that we've aliased.
  */
  coreFuncs: CoreExport[],
  /**
  * All of the core tables that we've aliased.
  */
  coreTables: CoreExport[],
  /**
  * All of the core memories that we've aliased.
  */
  coreMemories: CoreExport[],
  /**
  * All of the core gloabls that we've aliased.
  */
  coreGlobals: CoreExport[],
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
*/
export type Sort = "module";
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
