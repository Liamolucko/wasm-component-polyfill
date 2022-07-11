import {
  CoreExport,
  CoreInstance,
  CoreSort,
  Export,
  parse,
  Sort,
} from "./parser/mod.ts";

type CompiledModule = WebAssembly.Module | { import: string };

export class Component {
  #modules: CompiledModule[];
  #coreInstances: CoreInstance[];
  #coreFuncs: CoreExport[];
  #tables: CoreExport[];
  #memories: CoreExport[];
  #globals: CoreExport[];
  #exports: Export[];

  constructor(data: BufferSource) {
    const bytes = new Uint8Array(
      data instanceof ArrayBuffer ? data : data.buffer,
    );
    const parsed = parse(bytes);
    if (parsed === null) {
      throw new WebAssembly.CompileError(
        // @ts-ignore the typings are wrong
        "The `WebAssembly.Component` constructor cannot be used to compile a WebAssembly module",
      );
    }

    this.#modules = parsed.modules.map((module) => {
      switch (module.tag) {
        case "imported":
          return { import: module.val };
        case "inline":
          return new WebAssembly.Module(module.val);
      }
    });

    this.#coreInstances = parsed.coreInstances;
    this.#coreFuncs = parsed.coreFuncs;
    this.#tables = parsed.tables;
    this.#memories = parsed.memories;
    this.#globals = parsed.globals;
    this.#exports = parsed.exports;
  }

  // This is only TypeScript private so that we can access it from `new WebAssembly.Instance`.
  private _instantiateSync(imports: Imports = {}): Instance {
    // First resolve all our modules.
    const modules = this.#modules.map((module) => {
      if (module instanceof WebAssembly.Module) {
        return module;
      } else {
        const resolved = imports[module.import];
        if (!(resolved instanceof WebAssembly.Module)) {
          throw new WebAssembly.LinkError(
            // @ts-ignore bad types
            `Expected a module for import '${module.import}', found ${resolved}`,
          );
        }
      }
    });

    // Then our core instances.
    const coreInstances: WebAssembly.Exports[] = [];

    const resolveCoreSort = (
      sort: CoreSort,
      index: number,
    ): WebAssembly.ExportValue => {
      let desc: CoreExport;
      switch (sort) {
        case "func":
          desc = this.#coreFuncs[index];
          break;
        case "table":
          desc = this.#tables[index];
          break;
        case "memory":
          desc = this.#memories[index];
          break;
        case "global":
          desc = this.#globals[index];
          break;
      }
      return coreInstances[desc.instance][desc.name];
    };

    this.#coreInstances.forEach(({ tag, val }) => {
      switch (tag) {
        case "module": {
          // TODO: we should probably do some validation or catching or
          // something so that import errors get mapped to the proper top-level
          // component import.
          // We can probably use the APIs of `WebAssembly.Module` that tell you
          // about its imports to do that.
          const instance = new WebAssembly.Instance(
            modules[val.module]!,
            Object.fromEntries(
              val.args.map((arg) => [arg.name, coreInstances[arg.instance]]),
            ),
          );
          coreInstances.push(instance.exports);
          break;
        }
        case "reexporter": {
          coreInstances.push(
            Object.fromEntries(
              val.map((reexport) => [
                reexport.name,
                resolveCoreSort(reexport.sort, reexport.index),
              ]),
            ),
          );
          break;
        }
      }
    });

    const resolveSort = (_sort: Sort, index: number): ExportValue => {
      // as of right now, the only sorts we have are modules.
      return modules[index]!;
    };

    const exports = Object.fromEntries(
      this.#exports.map((ex) => [ex.name, resolveSort(ex.sort, ex.index)]),
    );

    return new Instance(exports);
  }
}

export type ImportValue = WebAssembly.Module;
export type Imports = Record<string, ImportValue>;
export type ExportValue = WebAssembly.Module;
export type Exports = Record<string, ExportValue>;

export class Instance {
  // @ts-ignore TypeScript doesn't understand `Object.defineProperty`.
  readonly exports: Record<string, ExportValue>;

  constructor(module: WebAssembly.Module, imports?: WebAssembly.Imports);
  constructor(module: Component, imports?: Imports);
  constructor(
    module: WebAssembly.Module | Component | Exports,
    imports?: Imports | WebAssembly.Imports,
  ) {
    if (module instanceof WebAssembly.Module) {
      return new WebAssembly.Instance(module);
    } else if (module instanceof Component) {
      // @ts-ignore I've only marked it private for stuff outside the module.
      return module._instantiateSync(imports);
    } else {
      // Private constructor - just gives a list of exports.
      // Needed for `instantiate`/`instantiateStreaming` to work.
      Object.defineProperty(this, "exports", {
        value: Object.freeze(module),
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }
  }
}
