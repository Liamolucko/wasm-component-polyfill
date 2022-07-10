import { data_view, UTF8_DECODER } from './intrinsics.js';
export class Parser {
  addToImports(imports) {
  }
  
  async instantiate(module, imports) {
    imports = imports || {};
    this.addToImports(imports);
    
    if (module instanceof WebAssembly.Instance) {
      this.instance = module;
    } else if (module instanceof WebAssembly.Module) {
      this.instance = await WebAssembly.instantiate(module, imports);
    } else if (module instanceof ArrayBuffer || module instanceof Uint8Array) {
      const { instance } = await WebAssembly.instantiate(module, imports);
      this.instance = instance;
    } else {
      const { instance } = await WebAssembly.instantiateStreaming(module, imports);
      this.instance = instance;
    }
    this._exports = this.instance.exports;
  }
  parse(arg0) {
    const memory = this._exports.memory;
    const realloc = this._exports["canonical_abi_realloc"];
    const free = this._exports["canonical_abi_free"];
    const val0 = arg0;
    const len0 = val0.length;
    const ptr0 = realloc(0, 0, 1, len0 * 1);
    (new Uint8Array(memory.buffer, ptr0, len0 * 1)).set(new Uint8Array(val0.buffer, val0.byteOffset, len0 * 1));
    const ret = this._exports['parse'](ptr0, len0);
    
    let variant25;
    switch (data_view(memory).getUint8(ret + 0, true)) {
      case 0: {
        let variant23;
        switch (data_view(memory).getUint8(ret + 4, true)) {
          
          case 0: {
            
            variant23 = null;
            break;
          }
          case 1: {
            const len4 = data_view(memory).getInt32(ret + 12, true);
            const base4 = data_view(memory).getInt32(ret + 8, true);
            const result4 = [];
            for (let i = 0; i < len4; i++) {
              const base = base4 + i * 12;
              let variant3;
              switch (data_view(memory).getUint8(base + 0, true)) {
                case 0: {
                  const ptr1 = data_view(memory).getInt32(base + 4, true);
                  const len1 = data_view(memory).getInt32(base + 8, true);
                  const list1 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr1, len1));
                  free(ptr1, len1, 1);
                  variant3 = {
                    tag: "imported",
                    val: list1,
                  };
                  break;
                }
                case 1: {
                  const ptr2 = data_view(memory).getInt32(base + 4, true);
                  const len2 = data_view(memory).getInt32(base + 8, true);
                  const list2 = new Uint8Array(memory.buffer.slice(ptr2, ptr2 + len2 * 1));
                  free(ptr2, len2, 1);
                  variant3 = {
                    tag: "inline",
                    val: list2,
                  };
                  break;
                }
                default:
                throw new RangeError("invalid variant discriminant for Module");
              }
              result4.push(variant3);
            }
            free(base4, len4 * 12, 4);
            const len11 = data_view(memory).getInt32(ret + 20, true);
            const base11 = data_view(memory).getInt32(ret + 16, true);
            const result11 = [];
            for (let i = 0; i < len11; i++) {
              const base = base11 + i * 16;
              let variant10;
              switch (data_view(memory).getUint8(base + 0, true)) {
                case 0: {
                  const len6 = data_view(memory).getInt32(base + 12, true);
                  const base6 = data_view(memory).getInt32(base + 8, true);
                  const result6 = [];
                  for (let i = 0; i < len6; i++) {
                    const base = base6 + i * 12;
                    const ptr5 = data_view(memory).getInt32(base + 0, true);
                    const len5 = data_view(memory).getInt32(base + 4, true);
                    const list5 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr5, len5));
                    free(ptr5, len5, 1);
                    result6.push({
                      name: list5,
                      instance: data_view(memory).getInt32(base + 8, true) >>> 0,
                    });
                  }
                  free(base6, len6 * 12, 4);
                  variant10 = {
                    tag: "module",
                    val: {
                      module: data_view(memory).getInt32(base + 4, true) >>> 0,
                      args: result6,
                    },
                  };
                  break;
                }
                case 1: {
                  const len9 = data_view(memory).getInt32(base + 8, true);
                  const base9 = data_view(memory).getInt32(base + 4, true);
                  const result9 = [];
                  for (let i = 0; i < len9; i++) {
                    const base = base9 + i * 16;
                    const ptr7 = data_view(memory).getInt32(base + 0, true);
                    const len7 = data_view(memory).getInt32(base + 4, true);
                    const list7 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr7, len7));
                    free(ptr7, len7, 1);
                    let enum8;
                    switch (data_view(memory).getUint8(base + 8, true)) {
                      case 0: {
                        enum8 = "func";
                        break;
                      }
                      case 1: {
                        enum8 = "table";
                        break;
                      }
                      case 2: {
                        enum8 = "memory";
                        break;
                      }
                      case 3: {
                        enum8 = "global";
                        break;
                      }
                      default: {
                        throw new RangeError("invalid discriminant specified for CoreSort");
                      }
                    }
                    result9.push({
                      name: list7,
                      sort: enum8,
                      index: data_view(memory).getInt32(base + 12, true) >>> 0,
                    });
                  }
                  free(base9, len9 * 16, 4);
                  variant10 = {
                    tag: "reexporter",
                    val: result9,
                  };
                  break;
                }
                default:
                throw new RangeError("invalid variant discriminant for CoreInstance");
              }
              result11.push(variant10);
            }
            free(base11, len11 * 16, 4);
            const len13 = data_view(memory).getInt32(ret + 28, true);
            const base13 = data_view(memory).getInt32(ret + 24, true);
            const result13 = [];
            for (let i = 0; i < len13; i++) {
              const base = base13 + i * 12;
              const ptr12 = data_view(memory).getInt32(base + 4, true);
              const len12 = data_view(memory).getInt32(base + 8, true);
              const list12 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr12, len12));
              free(ptr12, len12, 1);
              result13.push({
                instance: data_view(memory).getInt32(base + 0, true) >>> 0,
                name: list12,
              });
            }
            free(base13, len13 * 12, 4);
            const len15 = data_view(memory).getInt32(ret + 36, true);
            const base15 = data_view(memory).getInt32(ret + 32, true);
            const result15 = [];
            for (let i = 0; i < len15; i++) {
              const base = base15 + i * 12;
              const ptr14 = data_view(memory).getInt32(base + 4, true);
              const len14 = data_view(memory).getInt32(base + 8, true);
              const list14 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr14, len14));
              free(ptr14, len14, 1);
              result15.push({
                instance: data_view(memory).getInt32(base + 0, true) >>> 0,
                name: list14,
              });
            }
            free(base15, len15 * 12, 4);
            const len17 = data_view(memory).getInt32(ret + 44, true);
            const base17 = data_view(memory).getInt32(ret + 40, true);
            const result17 = [];
            for (let i = 0; i < len17; i++) {
              const base = base17 + i * 12;
              const ptr16 = data_view(memory).getInt32(base + 4, true);
              const len16 = data_view(memory).getInt32(base + 8, true);
              const list16 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr16, len16));
              free(ptr16, len16, 1);
              result17.push({
                instance: data_view(memory).getInt32(base + 0, true) >>> 0,
                name: list16,
              });
            }
            free(base17, len17 * 12, 4);
            const len19 = data_view(memory).getInt32(ret + 52, true);
            const base19 = data_view(memory).getInt32(ret + 48, true);
            const result19 = [];
            for (let i = 0; i < len19; i++) {
              const base = base19 + i * 12;
              const ptr18 = data_view(memory).getInt32(base + 4, true);
              const len18 = data_view(memory).getInt32(base + 8, true);
              const list18 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr18, len18));
              free(ptr18, len18, 1);
              result19.push({
                instance: data_view(memory).getInt32(base + 0, true) >>> 0,
                name: list18,
              });
            }
            free(base19, len19 * 12, 4);
            const len22 = data_view(memory).getInt32(ret + 60, true);
            const base22 = data_view(memory).getInt32(ret + 56, true);
            const result22 = [];
            for (let i = 0; i < len22; i++) {
              const base = base22 + i * 16;
              const ptr20 = data_view(memory).getInt32(base + 0, true);
              const len20 = data_view(memory).getInt32(base + 4, true);
              const list20 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr20, len20));
              free(ptr20, len20, 1);
              let enum21;
              switch (data_view(memory).getUint8(base + 8, true)) {
                case 0: {
                  enum21 = "module";
                  break;
                }
                default: {
                  throw new RangeError("invalid discriminant specified for Sort");
                }
              }
              result22.push({
                name: list20,
                sort: enum21,
                index: data_view(memory).getInt32(base + 12, true) >>> 0,
              });
            }
            free(base22, len22 * 16, 4);
            
            variant23 = {
              modules: result4,
              coreInstances: result11,
              coreFuncs: result13,
              coreTables: result15,
              coreMemories: result17,
              coreGlobals: result19,
              exports: result22,
            };
            break;
          }
          
          default:
          throw new RangeError("invalid variant discriminant for option");
        }
        
        variant25 = { tag: "ok", val: variant23 };
        break;
      }
      case 1: {
        const ptr24 = data_view(memory).getInt32(ret + 4, true);
        const len24 = data_view(memory).getInt32(ret + 8, true);
        const list24 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr24, len24));
        free(ptr24, len24, 1);
        
        variant25 = { tag: "err", val: {
          message: list24,
          offset: data_view(memory).getInt32(ret + 12, true) >>> 0,
        } };
        break;
      }
      default: {
        throw new RangeError("invalid variant discriminant for expected");
      }
    }
    return variant25;
  }
}
