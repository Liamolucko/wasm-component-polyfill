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
    let variant11;
    switch (data_view(memory).getUint8(ret + 0, true)) {
      
      case 0: {
        
        variant11 = null;
        break;
      }
      case 1: {
        
        let variant10;
        switch (data_view(memory).getUint8(ret + 4, true)) {
          case 0: {
            const len2 = data_view(memory).getInt32(ret + 12, true);
            const base2 = data_view(memory).getInt32(ret + 8, true);
            const result2 = [];
            for (let i = 0; i < len2; i++) {
              const base = base2 + i * 8;
              let variant1;
              switch (data_view(memory).getUint8(base + 0, true)) {
                case 0: {
                  variant1 = {
                    tag: "idx",
                    val: data_view(memory).getInt32(base + 4, true) >>> 0,
                  };
                  break;
                }
                case 1: {
                  variant1 = {
                    tag: "unit",
                  };
                  break;
                }
                case 2: {
                  variant1 = {
                    tag: "bool",
                  };
                  break;
                }
                case 3: {
                  variant1 = {
                    tag: "s8",
                  };
                  break;
                }
                case 4: {
                  variant1 = {
                    tag: "u8",
                  };
                  break;
                }
                case 5: {
                  variant1 = {
                    tag: "s16",
                  };
                  break;
                }
                case 6: {
                  variant1 = {
                    tag: "u16",
                  };
                  break;
                }
                case 7: {
                  variant1 = {
                    tag: "s32",
                  };
                  break;
                }
                case 8: {
                  variant1 = {
                    tag: "u32",
                  };
                  break;
                }
                case 9: {
                  variant1 = {
                    tag: "s64",
                  };
                  break;
                }
                case 10: {
                  variant1 = {
                    tag: "u64",
                  };
                  break;
                }
                case 11: {
                  variant1 = {
                    tag: "float32",
                  };
                  break;
                }
                case 12: {
                  variant1 = {
                    tag: "float64",
                  };
                  break;
                }
                case 13: {
                  variant1 = {
                    tag: "char",
                  };
                  break;
                }
                case 14: {
                  variant1 = {
                    tag: "string",
                  };
                  break;
                }
                default:
                throw new RangeError("invalid variant discriminant for Valtype");
              }
              result2.push(variant1);
            }
            free(base2, len2 * 8, 4);
            const len5 = data_view(memory).getInt32(ret + 20, true);
            const base5 = data_view(memory).getInt32(ret + 16, true);
            const result5 = [];
            for (let i = 0; i < len5; i++) {
              const base = base5 + i * 16;
              const ptr3 = data_view(memory).getInt32(base + 0, true);
              const len3 = data_view(memory).getInt32(base + 4, true);
              const list3 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr3, len3));
              free(ptr3, len3, 1);
              let variant4;
              switch (data_view(memory).getUint8(base + 8, true)) {
                case 0: {
                  variant4 = {
                    tag: "func",
                    val: data_view(memory).getInt32(base + 12, true) >>> 0,
                  };
                  break;
                }
                default:
                throw new RangeError("invalid variant discriminant for Externdesc");
              }
              result5.push({
                name: list3,
                desc: variant4,
              });
            }
            free(base5, len5 * 16, 4);
            const len8 = data_view(memory).getInt32(ret + 28, true);
            const base8 = data_view(memory).getInt32(ret + 24, true);
            const result8 = [];
            for (let i = 0; i < len8; i++) {
              const base = base8 + i * 16;
              const ptr6 = data_view(memory).getInt32(base + 0, true);
              const len6 = data_view(memory).getInt32(base + 4, true);
              const list6 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr6, len6));
              free(ptr6, len6, 1);
              let variant7;
              switch (data_view(memory).getUint8(base + 8, true)) {
                case 0: {
                  variant7 = {
                    tag: "func",
                  };
                  break;
                }
                default:
                throw new RangeError("invalid variant discriminant for Sort");
              }
              result8.push({
                name: list6,
                sort: variant7,
                idx: data_view(memory).getInt32(base + 12, true) >>> 0,
              });
            }
            free(base8, len8 * 16, 4);
            
            variant10 = { tag: "ok", val: {
              types: result2,
              imports: result5,
              exports: result8,
            } };
            break;
          }
          case 1: {
            const ptr9 = data_view(memory).getInt32(ret + 8, true);
            const len9 = data_view(memory).getInt32(ret + 12, true);
            const list9 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr9, len9));
            free(ptr9, len9, 1);
            
            variant10 = { tag: "err", val: {
              message: list9,
              offset: data_view(memory).getInt32(ret + 16, true) >>> 0,
            } };
            break;
          }
          default: {
            throw new RangeError("invalid variant discriminant for expected");
          }
        }
        
        variant11 = variant10;
        break;
      }
      
      default:
      throw new RangeError("invalid variant discriminant for option");
    }
    return variant11;
  }
}
