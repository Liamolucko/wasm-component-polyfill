import { data_view, UTF8_DECODER, throw_invalid_bool } from './intrinsics.js';
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
    
    let variant54;
    switch (data_view(memory).getUint8(ret + 0, true)) {
      case 0: {
        let variant52;
        switch (data_view(memory).getUint8(ret + 4, true)) {
          
          case 0: {
            
            variant52 = null;
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
            const len25 = data_view(memory).getInt32(ret + 28, true);
            const base25 = data_view(memory).getInt32(ret + 24, true);
            const result25 = [];
            for (let i = 0; i < len25; i++) {
              const base = base25 + i * 60;
              let variant24;
              switch (data_view(memory).getUint8(base + 0, true)) {
                case 0: {
                  const ptr12 = data_view(memory).getInt32(base + 8, true);
                  const len12 = data_view(memory).getInt32(base + 12, true);
                  const list12 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr12, len12));
                  free(ptr12, len12, 1);
                  variant24 = {
                    tag: "aliased",
                    val: {
                      instance: data_view(memory).getInt32(base + 4, true) >>> 0,
                      name: list12,
                    },
                  };
                  break;
                }
                case 1: {
                  const len15 = data_view(memory).getInt32(base + 12, true);
                  const base15 = data_view(memory).getInt32(base + 8, true);
                  const result15 = [];
                  for (let i = 0; i < len15; i++) {
                    const base = base15 + i * 12;
                    let variant14;
                    switch (data_view(memory).getUint8(base + 4, true)) {
                      case 0: {
                        variant14 = {
                          tag: "idx",
                          val: data_view(memory).getInt32(base + 8, true) >>> 0,
                        };
                        break;
                      }
                      case 1: {
                        let enum13;
                        switch (data_view(memory).getUint8(base + 8, true)) {
                          case 0: {
                            enum13 = "unit";
                            break;
                          }
                          case 1: {
                            enum13 = "bool";
                            break;
                          }
                          case 2: {
                            enum13 = "s8";
                            break;
                          }
                          case 3: {
                            enum13 = "u8";
                            break;
                          }
                          case 4: {
                            enum13 = "s16";
                            break;
                          }
                          case 5: {
                            enum13 = "u16";
                            break;
                          }
                          case 6: {
                            enum13 = "s32";
                            break;
                          }
                          case 7: {
                            enum13 = "u32";
                            break;
                          }
                          case 8: {
                            enum13 = "s64";
                            break;
                          }
                          case 9: {
                            enum13 = "u64";
                            break;
                          }
                          case 10: {
                            enum13 = "float32";
                            break;
                          }
                          case 11: {
                            enum13 = "float64";
                            break;
                          }
                          case 12: {
                            enum13 = "char";
                            break;
                          }
                          case 13: {
                            enum13 = "string";
                            break;
                          }
                          default: {
                            throw new RangeError("invalid discriminant specified for Primtype");
                          }
                        }
                        variant14 = {
                          tag: "primitive",
                          val: enum13,
                        };
                        break;
                      }
                      default:
                      throw new RangeError("invalid variant discriminant for Valtype");
                    }
                    result15.push({
                      offset: data_view(memory).getInt32(base + 0, true) >>> 0,
                      ty: variant14,
                    });
                  }
                  free(base15, len15 * 12, 4);
                  let variant17;
                  switch (data_view(memory).getUint8(base + 20, true)) {
                    case 0: {
                      variant17 = {
                        tag: "idx",
                        val: data_view(memory).getInt32(base + 24, true) >>> 0,
                      };
                      break;
                    }
                    case 1: {
                      let enum16;
                      switch (data_view(memory).getUint8(base + 24, true)) {
                        case 0: {
                          enum16 = "unit";
                          break;
                        }
                        case 1: {
                          enum16 = "bool";
                          break;
                        }
                        case 2: {
                          enum16 = "s8";
                          break;
                        }
                        case 3: {
                          enum16 = "u8";
                          break;
                        }
                        case 4: {
                          enum16 = "s16";
                          break;
                        }
                        case 5: {
                          enum16 = "u16";
                          break;
                        }
                        case 6: {
                          enum16 = "s32";
                          break;
                        }
                        case 7: {
                          enum16 = "u32";
                          break;
                        }
                        case 8: {
                          enum16 = "s64";
                          break;
                        }
                        case 9: {
                          enum16 = "u64";
                          break;
                        }
                        case 10: {
                          enum16 = "float32";
                          break;
                        }
                        case 11: {
                          enum16 = "float64";
                          break;
                        }
                        case 12: {
                          enum16 = "char";
                          break;
                        }
                        case 13: {
                          enum16 = "string";
                          break;
                        }
                        default: {
                          throw new RangeError("invalid discriminant specified for Primtype");
                        }
                      }
                      variant17 = {
                        tag: "primitive",
                        val: enum16,
                      };
                      break;
                    }
                    default:
                    throw new RangeError("invalid variant discriminant for Valtype");
                  }
                  const bool18 = data_view(memory).getUint8(base + 28, true);
                  const bool19 = data_view(memory).getUint8(base + 29, true);
                  let enum20;
                  switch (data_view(memory).getUint8(base + 32, true)) {
                    case 0: {
                      enum20 = "utf8";
                      break;
                    }
                    case 1: {
                      enum20 = "utf16";
                      break;
                    }
                    case 2: {
                      enum20 = "latin1-or-utf16";
                      break;
                    }
                    default: {
                      throw new RangeError("invalid discriminant specified for StringEncoding");
                    }
                  }
                  let variant21;
                  switch (data_view(memory).getUint8(base + 36, true)) {
                    
                    case 0: {
                      
                      variant21 = null;
                      break;
                    }
                    case 1: {
                      
                      variant21 = data_view(memory).getInt32(base + 40, true) >>> 0;
                      break;
                    }
                    
                    default:
                    throw new RangeError("invalid variant discriminant for option");
                  }
                  let variant22;
                  switch (data_view(memory).getUint8(base + 44, true)) {
                    
                    case 0: {
                      
                      variant22 = null;
                      break;
                    }
                    case 1: {
                      
                      variant22 = data_view(memory).getInt32(base + 48, true) >>> 0;
                      break;
                    }
                    
                    default:
                    throw new RangeError("invalid variant discriminant for option");
                  }
                  let variant23;
                  switch (data_view(memory).getUint8(base + 52, true)) {
                    
                    case 0: {
                      
                      variant23 = null;
                      break;
                    }
                    case 1: {
                      
                      variant23 = data_view(memory).getInt32(base + 56, true) >>> 0;
                      break;
                    }
                    
                    default:
                    throw new RangeError("invalid variant discriminant for option");
                  }
                  variant24 = {
                    tag: "lowered",
                    val: {
                      func: data_view(memory).getInt32(base + 4, true) >>> 0,
                      ty: {
                        params: result15,
                        result: {
                          offset: data_view(memory).getInt32(base + 16, true) >>> 0,
                          ty: variant17,
                        },
                        flatParams: bool18 == 0 ? false : (bool18 == 1 ? true : throw_invalid_bool()),
                        flatResult: bool19 == 0 ? false : (bool19 == 1 ? true : throw_invalid_bool()),
                      },
                      options: {
                        stringEncoding: enum20,
                        memory: variant21,
                        realloc: variant22,
                        postReturn: variant23,
                      },
                    },
                  };
                  break;
                }
                default:
                throw new RangeError("invalid variant discriminant for CoreFunc");
              }
              result25.push(variant24);
            }
            free(base25, len25 * 60, 4);
            const len27 = data_view(memory).getInt32(ret + 36, true);
            const base27 = data_view(memory).getInt32(ret + 32, true);
            const result27 = [];
            for (let i = 0; i < len27; i++) {
              const base = base27 + i * 12;
              const ptr26 = data_view(memory).getInt32(base + 4, true);
              const len26 = data_view(memory).getInt32(base + 8, true);
              const list26 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr26, len26));
              free(ptr26, len26, 1);
              result27.push({
                instance: data_view(memory).getInt32(base + 0, true) >>> 0,
                name: list26,
              });
            }
            free(base27, len27 * 12, 4);
            const len29 = data_view(memory).getInt32(ret + 44, true);
            const base29 = data_view(memory).getInt32(ret + 40, true);
            const result29 = [];
            for (let i = 0; i < len29; i++) {
              const base = base29 + i * 12;
              const ptr28 = data_view(memory).getInt32(base + 4, true);
              const len28 = data_view(memory).getInt32(base + 8, true);
              const list28 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr28, len28));
              free(ptr28, len28, 1);
              result29.push({
                instance: data_view(memory).getInt32(base + 0, true) >>> 0,
                name: list28,
              });
            }
            free(base29, len29 * 12, 4);
            const len31 = data_view(memory).getInt32(ret + 52, true);
            const base31 = data_view(memory).getInt32(ret + 48, true);
            const result31 = [];
            for (let i = 0; i < len31; i++) {
              const base = base31 + i * 12;
              const ptr30 = data_view(memory).getInt32(base + 4, true);
              const len30 = data_view(memory).getInt32(base + 8, true);
              const list30 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr30, len30));
              free(ptr30, len30, 1);
              result31.push({
                instance: data_view(memory).getInt32(base + 0, true) >>> 0,
                name: list30,
              });
            }
            free(base31, len31 * 12, 4);
            const len34 = data_view(memory).getInt32(ret + 60, true);
            const base34 = data_view(memory).getInt32(ret + 56, true);
            const result34 = [];
            for (let i = 0; i < len34; i++) {
              const base = base34 + i * 2;
              let variant33;
              switch (data_view(memory).getUint8(base + 0, true)) {
                case 0: {
                  let enum32;
                  switch (data_view(memory).getUint8(base + 1, true)) {
                    case 0: {
                      enum32 = "unit";
                      break;
                    }
                    case 1: {
                      enum32 = "bool";
                      break;
                    }
                    case 2: {
                      enum32 = "s8";
                      break;
                    }
                    case 3: {
                      enum32 = "u8";
                      break;
                    }
                    case 4: {
                      enum32 = "s16";
                      break;
                    }
                    case 5: {
                      enum32 = "u16";
                      break;
                    }
                    case 6: {
                      enum32 = "s32";
                      break;
                    }
                    case 7: {
                      enum32 = "u32";
                      break;
                    }
                    case 8: {
                      enum32 = "s64";
                      break;
                    }
                    case 9: {
                      enum32 = "u64";
                      break;
                    }
                    case 10: {
                      enum32 = "float32";
                      break;
                    }
                    case 11: {
                      enum32 = "float64";
                      break;
                    }
                    case 12: {
                      enum32 = "char";
                      break;
                    }
                    case 13: {
                      enum32 = "string";
                      break;
                    }
                    default: {
                      throw new RangeError("invalid discriminant specified for Primtype");
                    }
                  }
                  variant33 = {
                    tag: "primitive",
                    val: enum32,
                  };
                  break;
                }
                default:
                throw new RangeError("invalid variant discriminant for Deftype");
              }
              result34.push(variant33);
            }
            free(base34, len34 * 2, 1);
            const len48 = data_view(memory).getInt32(ret + 68, true);
            const base48 = data_view(memory).getInt32(ret + 64, true);
            const result48 = [];
            for (let i = 0; i < len48; i++) {
              const base = base48 + i * 60;
              let variant47;
              switch (data_view(memory).getUint8(base + 0, true)) {
                case 0: {
                  const ptr35 = data_view(memory).getInt32(base + 4, true);
                  const len35 = data_view(memory).getInt32(base + 8, true);
                  const list35 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr35, len35));
                  free(ptr35, len35, 1);
                  variant47 = {
                    tag: "imported",
                    val: list35,
                  };
                  break;
                }
                case 1: {
                  const len38 = data_view(memory).getInt32(base + 12, true);
                  const base38 = data_view(memory).getInt32(base + 8, true);
                  const result38 = [];
                  for (let i = 0; i < len38; i++) {
                    const base = base38 + i * 12;
                    let variant37;
                    switch (data_view(memory).getUint8(base + 4, true)) {
                      case 0: {
                        variant37 = {
                          tag: "idx",
                          val: data_view(memory).getInt32(base + 8, true) >>> 0,
                        };
                        break;
                      }
                      case 1: {
                        let enum36;
                        switch (data_view(memory).getUint8(base + 8, true)) {
                          case 0: {
                            enum36 = "unit";
                            break;
                          }
                          case 1: {
                            enum36 = "bool";
                            break;
                          }
                          case 2: {
                            enum36 = "s8";
                            break;
                          }
                          case 3: {
                            enum36 = "u8";
                            break;
                          }
                          case 4: {
                            enum36 = "s16";
                            break;
                          }
                          case 5: {
                            enum36 = "u16";
                            break;
                          }
                          case 6: {
                            enum36 = "s32";
                            break;
                          }
                          case 7: {
                            enum36 = "u32";
                            break;
                          }
                          case 8: {
                            enum36 = "s64";
                            break;
                          }
                          case 9: {
                            enum36 = "u64";
                            break;
                          }
                          case 10: {
                            enum36 = "float32";
                            break;
                          }
                          case 11: {
                            enum36 = "float64";
                            break;
                          }
                          case 12: {
                            enum36 = "char";
                            break;
                          }
                          case 13: {
                            enum36 = "string";
                            break;
                          }
                          default: {
                            throw new RangeError("invalid discriminant specified for Primtype");
                          }
                        }
                        variant37 = {
                          tag: "primitive",
                          val: enum36,
                        };
                        break;
                      }
                      default:
                      throw new RangeError("invalid variant discriminant for Valtype");
                    }
                    result38.push({
                      offset: data_view(memory).getInt32(base + 0, true) >>> 0,
                      ty: variant37,
                    });
                  }
                  free(base38, len38 * 12, 4);
                  let variant40;
                  switch (data_view(memory).getUint8(base + 20, true)) {
                    case 0: {
                      variant40 = {
                        tag: "idx",
                        val: data_view(memory).getInt32(base + 24, true) >>> 0,
                      };
                      break;
                    }
                    case 1: {
                      let enum39;
                      switch (data_view(memory).getUint8(base + 24, true)) {
                        case 0: {
                          enum39 = "unit";
                          break;
                        }
                        case 1: {
                          enum39 = "bool";
                          break;
                        }
                        case 2: {
                          enum39 = "s8";
                          break;
                        }
                        case 3: {
                          enum39 = "u8";
                          break;
                        }
                        case 4: {
                          enum39 = "s16";
                          break;
                        }
                        case 5: {
                          enum39 = "u16";
                          break;
                        }
                        case 6: {
                          enum39 = "s32";
                          break;
                        }
                        case 7: {
                          enum39 = "u32";
                          break;
                        }
                        case 8: {
                          enum39 = "s64";
                          break;
                        }
                        case 9: {
                          enum39 = "u64";
                          break;
                        }
                        case 10: {
                          enum39 = "float32";
                          break;
                        }
                        case 11: {
                          enum39 = "float64";
                          break;
                        }
                        case 12: {
                          enum39 = "char";
                          break;
                        }
                        case 13: {
                          enum39 = "string";
                          break;
                        }
                        default: {
                          throw new RangeError("invalid discriminant specified for Primtype");
                        }
                      }
                      variant40 = {
                        tag: "primitive",
                        val: enum39,
                      };
                      break;
                    }
                    default:
                    throw new RangeError("invalid variant discriminant for Valtype");
                  }
                  const bool41 = data_view(memory).getUint8(base + 28, true);
                  const bool42 = data_view(memory).getUint8(base + 29, true);
                  let enum43;
                  switch (data_view(memory).getUint8(base + 32, true)) {
                    case 0: {
                      enum43 = "utf8";
                      break;
                    }
                    case 1: {
                      enum43 = "utf16";
                      break;
                    }
                    case 2: {
                      enum43 = "latin1-or-utf16";
                      break;
                    }
                    default: {
                      throw new RangeError("invalid discriminant specified for StringEncoding");
                    }
                  }
                  let variant44;
                  switch (data_view(memory).getUint8(base + 36, true)) {
                    
                    case 0: {
                      
                      variant44 = null;
                      break;
                    }
                    case 1: {
                      
                      variant44 = data_view(memory).getInt32(base + 40, true) >>> 0;
                      break;
                    }
                    
                    default:
                    throw new RangeError("invalid variant discriminant for option");
                  }
                  let variant45;
                  switch (data_view(memory).getUint8(base + 44, true)) {
                    
                    case 0: {
                      
                      variant45 = null;
                      break;
                    }
                    case 1: {
                      
                      variant45 = data_view(memory).getInt32(base + 48, true) >>> 0;
                      break;
                    }
                    
                    default:
                    throw new RangeError("invalid variant discriminant for option");
                  }
                  let variant46;
                  switch (data_view(memory).getUint8(base + 52, true)) {
                    
                    case 0: {
                      
                      variant46 = null;
                      break;
                    }
                    case 1: {
                      
                      variant46 = data_view(memory).getInt32(base + 56, true) >>> 0;
                      break;
                    }
                    
                    default:
                    throw new RangeError("invalid variant discriminant for option");
                  }
                  variant47 = {
                    tag: "lifted",
                    val: {
                      coreFunc: data_view(memory).getInt32(base + 4, true) >>> 0,
                      ty: {
                        params: result38,
                        result: {
                          offset: data_view(memory).getInt32(base + 16, true) >>> 0,
                          ty: variant40,
                        },
                        flatParams: bool41 == 0 ? false : (bool41 == 1 ? true : throw_invalid_bool()),
                        flatResult: bool42 == 0 ? false : (bool42 == 1 ? true : throw_invalid_bool()),
                      },
                      options: {
                        stringEncoding: enum43,
                        memory: variant44,
                        realloc: variant45,
                        postReturn: variant46,
                      },
                    },
                  };
                  break;
                }
                default:
                throw new RangeError("invalid variant discriminant for Func");
              }
              result48.push(variant47);
            }
            free(base48, len48 * 60, 4);
            const len51 = data_view(memory).getInt32(ret + 76, true);
            const base51 = data_view(memory).getInt32(ret + 72, true);
            const result51 = [];
            for (let i = 0; i < len51; i++) {
              const base = base51 + i * 16;
              const ptr49 = data_view(memory).getInt32(base + 0, true);
              const len49 = data_view(memory).getInt32(base + 4, true);
              const list49 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr49, len49));
              free(ptr49, len49, 1);
              let enum50;
              switch (data_view(memory).getUint8(base + 8, true)) {
                case 0: {
                  enum50 = "module";
                  break;
                }
                case 1: {
                  enum50 = "func";
                  break;
                }
                default: {
                  throw new RangeError("invalid discriminant specified for Sort");
                }
              }
              result51.push({
                name: list49,
                sort: enum50,
                index: data_view(memory).getInt32(base + 12, true) >>> 0,
              });
            }
            free(base51, len51 * 16, 4);
            
            variant52 = {
              modules: result4,
              coreInstances: result11,
              coreFuncs: result25,
              tables: result27,
              memories: result29,
              globals: result31,
              types: result34,
              funcs: result48,
              exports: result51,
            };
            break;
          }
          
          default:
          throw new RangeError("invalid variant discriminant for option");
        }
        
        variant54 = { tag: "ok", val: variant52 };
        break;
      }
      case 1: {
        const ptr53 = data_view(memory).getInt32(ret + 4, true);
        const len53 = data_view(memory).getInt32(ret + 8, true);
        const list53 = UTF8_DECODER.decode(new Uint8Array(memory.buffer, ptr53, len53));
        free(ptr53, len53, 1);
        
        variant54 = { tag: "err", val: {
          message: list53,
          offset: data_view(memory).getInt32(ret + 12, true) >>> 0,
        } };
        break;
      }
      default: {
        throw new RangeError("invalid variant discriminant for expected");
      }
    }
    return variant54;
  }
}
