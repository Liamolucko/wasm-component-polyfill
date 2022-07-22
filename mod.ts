import { lower } from "./lower/mod.ts";
import {
  AnnotatedValtype,
  CanonOpts,
  CoreExport,
  CoreFunc,
  CoreInstance,
  CoreSort,
  Export,
  Func,
  parse,
  ResolvedAnnotatedValtype,
  ResolvedCanonOpts,
  ResolvedFunc,
  ResolvedValtype,
  Sort,
  Valtype,
} from "./parser/mod.ts";

type CompiledModule = WebAssembly.Module | { import: string };

export class Component {
  #modules: CompiledModule[];
  #coreInstances: CoreInstance[];
  #coreFuncs: CoreFunc[];
  #tables: CoreExport[];
  #memories: CoreExport[];
  #globals: CoreExport[];
  #funcs: ResolvedFunc[];
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

    const resolveType = (ty: Valtype): ResolvedValtype => {
      switch (ty.tag) {
        case "idx":
          return resolveType(parsed?.types[ty.val]);
        case "primitive":
          return ty;
      }
    };

    function resolveAnnotatedType(
      ty: AnnotatedValtype,
    ): ResolvedAnnotatedValtype {
      return {
        offset: ty.offset,
        ty: resolveType(ty.ty),
      };
    }

    this.#funcs = parsed.funcs.map((func) => {
      switch (func.tag) {
        case "imported":
          return func;
        case "lifted":
          return {
            tag: "lifted",
            val: {
              ...func.val,
              ty: {
                ...func.val.ty,
                params: func.val.ty.params.map(resolveAnnotatedType),
                result: resolveAnnotatedType(func.val.ty.result),
              },
            },
          };
      }
    });

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
        // Ideally, we'd also validate that the module has the correct
        // signature here.
        // Unfortunately, I'm pretty sure that's impossible - modules don't
        // give you the signatures of their imports and exports, and there's no
        // way to get the raw bytes back out of them.
      }
    });

    // Then our core instances.
    const coreInstances: WebAssembly.Exports[] = [];

    function resolveExport(desc: CoreExport): WebAssembly.ExportValue {
      return coreInstances[desc.instance][desc.name];
    }

    // component functions
    const funcs: Array<(...args: unknown[]) => unknown> = [];

    const resolveCanonOpts = (opts: CanonOpts): ResolvedCanonOpts => {
      return {
        stringEncoding: opts.stringEncoding,
        memory: opts.memory !== undefined
          ? resolveExport(
            this.#memories[opts.memory],
          ) as WebAssembly.Memory
          : undefined,
      };
    };

    const resolveCoreSort = (
      sort: CoreSort,
      index: number,
    ): WebAssembly.ExportValue => {
      switch (sort) {
        case "func": {
          const func = this.#coreFuncs[index];
          switch (func.tag) {
            case "aliased":
              return resolveExport(func.val);
            case "lowered":
              return lower(funcs[func.val.func], func.val.ty, {});
          }
          break;
        }
        case "table":
          return resolveExport(this.#tables[index]);
        case "memory":
          return resolveExport(this.#memories[index]);
        case "global":
          return resolveExport(this.#globals[index]);
      }
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
