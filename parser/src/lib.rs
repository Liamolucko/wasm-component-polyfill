wit_bindgen_rust::export!("parser.wit");

use std::mem;

use parser::{
    AnnotatedValtype, CanonOpts, Component, CoreExport, CoreFunc, CoreInstance, CoreInstantiateArg,
    CoreReexport, CoreSort, Deftype, Error, Export, Func, FuncType, LiftedFunc, LoweredFunc,
    Module, ModuleInstance, Primtype, Sort, StringEncoding, Valtype,
};
use wasmparser::types::{ComponentDefinedType, ComponentFuncType, ComponentValType, TypesRef};
use wasmparser::{
    Alias, BinaryReaderError, CanonicalOption, ComponentExternalKind, Encoding, ExternalKind,
    Instance, Payload, PrimitiveValType, WasmFeatures,
};

impl From<BinaryReaderError> for Error {
    fn from(err: BinaryReaderError) -> Error {
        Error {
            message: err.message().to_owned(),
            // Note: we're compiling to wasm32, so `usize` is `u32`.
            offset: err.offset() as u32,
        }
    }
}

impl From<wasmparser::ComponentExport<'_>> for Export {
    fn from(export: wasmparser::ComponentExport) -> Self {
        Export {
            name: export.name.to_owned(),
            sort: export.kind.into(),
            index: export.index,
        }
    }
}

impl From<wasmparser::ComponentExternalKind> for Sort {
    fn from(kind: wasmparser::ComponentExternalKind) -> Self {
        match kind {
            ComponentExternalKind::Module => Sort::Module,
            ComponentExternalKind::Func => Sort::Func,
            ComponentExternalKind::Value => todo!(),
            ComponentExternalKind::Type => todo!(),
            ComponentExternalKind::Instance => todo!(),
            ComponentExternalKind::Component => todo!(),
        }
    }
}

impl From<wasmparser::Instance<'_>> for CoreInstance {
    fn from(instance: wasmparser::Instance) -> Self {
        match instance {
            Instance::Instantiate { module_index, args } => CoreInstance::Module(ModuleInstance {
                module: module_index,
                args: args
                    .iter()
                    .map(|arg| CoreInstantiateArg {
                        name: arg.name.to_owned(),
                        instance: arg.index,
                    })
                    .collect(),
            }),
            Instance::FromExports(exports) => {
                CoreInstance::Reexporter(exports.iter().copied().map(CoreReexport::from).collect())
            }
        }
    }
}

impl From<wasmparser::Export<'_>> for CoreReexport {
    fn from(export: wasmparser::Export) -> Self {
        CoreReexport {
            name: export.name.to_owned(),
            sort: export.kind.into(),
            index: export.index,
        }
    }
}

impl From<wasmparser::ExternalKind> for CoreSort {
    fn from(kind: wasmparser::ExternalKind) -> Self {
        match kind {
            ExternalKind::Func => CoreSort::Func,
            ExternalKind::Table => CoreSort::Table,
            ExternalKind::Memory => CoreSort::Memory,
            ExternalKind::Global => CoreSort::Global,
            // I think this is something to do with exception handling.
            ExternalKind::Tag => todo!(),
        }
    }
}

impl From<PrimitiveValType> for Primtype {
    fn from(ty: PrimitiveValType) -> Self {
        match ty {
            PrimitiveValType::Unit => Primtype::Unit,
            PrimitiveValType::Bool => Primtype::Bool,
            PrimitiveValType::S8 => Primtype::S8,
            PrimitiveValType::U8 => Primtype::U8,
            PrimitiveValType::S16 => Primtype::S16,
            PrimitiveValType::U16 => Primtype::U16,
            PrimitiveValType::S32 => Primtype::S32,
            PrimitiveValType::U32 => Primtype::U32,
            PrimitiveValType::S64 => Primtype::S64,
            PrimitiveValType::U64 => Primtype::U64,
            PrimitiveValType::Float32 => Primtype::Float32,
            PrimitiveValType::Float64 => Primtype::Float64,
            PrimitiveValType::Char => Primtype::Char,
            PrimitiveValType::String => Primtype::String,
        }
    }
}

/// Returns the number of flat params/results taken up by the passed primitive type.
fn primitive_flat_size(ty: PrimitiveValType) -> u32 {
    match ty {
        PrimitiveValType::Unit => 0,
        PrimitiveValType::Bool
        | PrimitiveValType::S8
        | PrimitiveValType::U8
        | PrimitiveValType::S16
        | PrimitiveValType::U16
        | PrimitiveValType::S32
        | PrimitiveValType::U32
        | PrimitiveValType::S64
        | PrimitiveValType::U64
        | PrimitiveValType::Float32
        | PrimitiveValType::Float64
        | PrimitiveValType::Char => 1,
        PrimitiveValType::String => 2,
    }
}

/// Returns the number of bytes taken up by the passed primitive type.
fn primitive_byte_size(ty: PrimitiveValType) -> u32 {
    match ty {
        PrimitiveValType::Unit => 0,
        PrimitiveValType::Bool | PrimitiveValType::S8 | PrimitiveValType::U8 => 1,
        PrimitiveValType::S16 | PrimitiveValType::U16 => 2,
        PrimitiveValType::S32
        | PrimitiveValType::U32
        | PrimitiveValType::Float32
        | PrimitiveValType::Char => 4,
        PrimitiveValType::S64
        | PrimitiveValType::U64
        | PrimitiveValType::Float64
        | PrimitiveValType::String => 8,
    }
}

/// Converts a deftype from `wasmparser`'s representation to our representation,
/// including extra layout info which assumes it's being laid out as flat
/// params/results.
fn convert_deftype_flat(
    output: &mut Component,
    offset: &mut u32,
    deftype: &ComponentDefinedType,
    types: TypesRef,
) -> Deftype {
    match *deftype {
        ComponentDefinedType::Primitive(ty) => {
            *offset += primitive_flat_size(ty);
            Deftype::Primitive(ty.into())
        }
        ComponentDefinedType::Record(_) => todo!(),
        ComponentDefinedType::Variant(_) => todo!(),
        ComponentDefinedType::List(_) => todo!(),
        ComponentDefinedType::Tuple(_) => todo!(),
        ComponentDefinedType::Flags(_) => todo!(),
        ComponentDefinedType::Enum(_) => todo!(),
        ComponentDefinedType::Union(_) => todo!(),
        ComponentDefinedType::Option(_) => todo!(),
        ComponentDefinedType::Expected(_, _) => todo!(),
    }
}

/// Converts a value type from `wasmparser`'s representation to our representation,
/// including extra layout info which assumes it's being laid out as flat
/// params/results.
fn convert_valtype_flat(
    output: &mut Component,
    offset: &mut u32,
    valtype: ComponentValType,
    types: TypesRef,
) -> AnnotatedValtype {
    match valtype {
        ComponentValType::Primitive(ty) => AnnotatedValtype {
            offset: mem::replace(offset, *offset + primitive_flat_size(ty)),
            ty: Valtype::Primitive(ty.into()),
        },
        ComponentValType::Type(id) => {
            let deftype = types.type_from_id(id).unwrap().as_defined_type().unwrap();
            let index = output.types.len();
            let start_offset = *offset;
            let ty = convert_deftype_flat(output, offset, deftype, types);
            output.types.push(ty);
            AnnotatedValtype {
                offset: start_offset,
                // TODO: it is actually theoretically possible for this to fail (although that would cause an OOM first).
                ty: Valtype::Idx(index.try_into().unwrap()),
            }
        }
    }
}

/// Converts a deftype from `wasmparser`'s representation to our representation,
/// including extra info about how it'll be laid out on the stack.
fn convert_deftype_stack(
    output: &mut Component,
    offset: &mut u32,
    deftype: &ComponentDefinedType,
    types: TypesRef,
) -> Deftype {
    match *deftype {
        ComponentDefinedType::Primitive(ty) => {
            *offset += primitive_byte_size(ty);
            Deftype::Primitive(ty.into())
        }
        ComponentDefinedType::Record(_) => todo!(),
        ComponentDefinedType::Variant(_) => todo!(),
        ComponentDefinedType::List(_) => todo!(),
        ComponentDefinedType::Tuple(_) => todo!(),
        ComponentDefinedType::Flags(_) => todo!(),
        ComponentDefinedType::Enum(_) => todo!(),
        ComponentDefinedType::Union(_) => todo!(),
        ComponentDefinedType::Option(_) => todo!(),
        ComponentDefinedType::Expected(_, _) => todo!(),
    }
}

/// Converts a value type from `wasmparser`'s representation to our representation,
/// including extra info about how it'll be laid out on the stack.
fn convert_valtype_stack(
    output: &mut Component,
    offset: &mut u32,
    valtype: ComponentValType,
    types: TypesRef,
) -> AnnotatedValtype {
    match valtype {
        ComponentValType::Primitive(ty) => AnnotatedValtype {
            offset: mem::replace(offset, *offset + primitive_byte_size(ty)),
            ty: Valtype::Primitive(ty.into()),
        },
        ComponentValType::Type(id) => {
            let deftype = types.type_from_id(id).unwrap().as_defined_type().unwrap();
            let index = output.types.len();
            let start_offset = *offset;
            let ty = convert_deftype_stack(output, offset, deftype, types);
            output.types.push(ty);
            AnnotatedValtype {
                offset: start_offset,
                // TODO: it is actually theoretically possible for this to fail (although that would cause an OOM first).
                ty: Valtype::Idx(index.try_into().unwrap()),
            }
        }
    }
}

const MAX_FLAT_PARAMS: u32 = 16;
const MAX_FLAT_RESULTS: u32 = 1;

fn convert_func_type(output: &mut Component, ty: &ComponentFuncType, types: TypesRef) -> FuncType {
    let mut offset = 0;
    let mut params: Vec<_> = ty
        .params
        .into_iter()
        .map(|&(_, ty)| convert_valtype_flat(output, &mut offset, ty, types))
        .collect();
    let flat_params = offset <= MAX_FLAT_PARAMS;
    if !flat_params {
        params = ty
            .params
            .into_iter()
            .map(|&(_, ty)| convert_valtype_stack(output, &mut offset, ty, types))
            .collect();
    }

    let mut offset = 0;
    let mut result = convert_valtype_flat(output, &mut offset, ty.result, types);
    let flat_result = offset <= MAX_FLAT_RESULTS;
    if !flat_result {
        result = convert_valtype_stack(output, &mut offset, ty.result, types);
    }

    FuncType {
        params,
        flat_params,
        result,
        flat_result,
    }
}

impl Default for CanonOpts {
    fn default() -> Self {
        Self {
            string_encoding: StringEncoding::Utf8,
            memory: None,
            realloc: None,
            post_return: None,
        }
    }
}

impl FromIterator<CanonicalOption> for CanonOpts {
    fn from_iter<T: IntoIterator<Item = CanonicalOption>>(iter: T) -> Self {
        let mut result = Self::default();
        for opt in iter {
            match opt {
                CanonicalOption::UTF8 => result.string_encoding = StringEncoding::Utf8,
                CanonicalOption::UTF16 => result.string_encoding = StringEncoding::Utf16,
                CanonicalOption::CompactUTF16 => {
                    result.string_encoding = StringEncoding::Latin1OrUtf16
                }
                CanonicalOption::Memory(index) => result.memory = Some(index),
                CanonicalOption::Realloc(index) => result.realloc = Some(index),
                CanonicalOption::PostReturn(index) => result.post_return = Some(index),
            }
        }
        result
    }
}

struct Parser;

impl parser::Parser for Parser {
    fn parse(data: Vec<u8>) -> Result<Option<Component>, Error> {
        let mut output = Component {
            modules: vec![],
            core_instances: vec![],
            core_funcs: vec![],
            tables: vec![],
            memories: vec![],
            globals: vec![],
            types: vec![],
            funcs: vec![],
            exports: vec![],
        };

        let parser = wasmparser::Parser::new(0);
        let mut validator = wasmparser::Validator::new_with_features(WasmFeatures {
            component_model: true,
            ..Default::default()
        });

        let mut payloads = parser.parse_all(&data);
        loop {
            // Note: this only returns `None` after `Payload::End`, and we
            // break out of the loop when we receive that, so that should never
            // happen.
            let payload = payloads.next().unwrap()?;

            // Validate the payload.
            validator.payload(&payload)?;

            // Then deal with the payload's contents.
            match payload {
                Payload::Version { encoding, .. } => {
                    if encoding == Encoding::Module {
                        // It's a module, abort.
                        return Ok(None);
                    }
                }

                // the validator will accumulate types for us.
                Payload::CoreTypeSection(_) | Payload::ComponentTypeSection(_) => {}

                Payload::ModuleSection { range, .. } => {
                    // TODO: double-check that index spaces are just ordered by where things show up in the binary.
                    output.modules.push(Module::Inline(data[range].to_owned()));

                    // Skip over this module.
                    loop {
                        let payload = payloads.next().unwrap()?;

                        // We also need to validate modules; the validator
                        // seems to break otherwise.
                        // As well as that, we want to validate that modules
                        // are properly used (e.g. instantiated with correct
                        // imports, exports are used in places where that type
                        // is correct, etc.)
                        validator.payload(&payload)?;

                        // Note: the code section of modules doesn't get parsed
                        // unless you do so explicitly, so we aren't wasting
                        // any time on validating that.

                        if matches!(payload, Payload::End(_)) {
                            // The module is finished, back to parsing the outer component.
                            break;
                        }
                    }
                }
                Payload::InstanceSection(reader) => {
                    for instance in reader {
                        output.core_instances.push(instance?.into())
                    }
                }
                Payload::AliasSection(reader) => {
                    for alias in reader {
                        match alias? {
                            Alias::InstanceExport {
                                kind,
                                instance_index,
                                name,
                            } => {
                                let export = CoreExport {
                                    instance: instance_index,
                                    name: name.to_owned(),
                                };
                                match kind {
                                    ExternalKind::Func => {
                                        output.core_funcs.push(CoreFunc::Aliased(export))
                                    }
                                    ExternalKind::Table => output.tables.push(export),
                                    ExternalKind::Memory => output.memories.push(export),
                                    ExternalKind::Global => output.globals.push(export),
                                    // I think this is something to do with exception handling.
                                    ExternalKind::Tag => todo!(),
                                }
                            }
                            Alias::Outer { .. } => todo!("nested components"),
                        }
                    }
                }
                Payload::ComponentSection { .. } => todo!("nested components"),
                Payload::ComponentInstanceSection(_) => todo!("nested components"),
                Payload::ComponentAliasSection(_) => todo!("component alias sections"),
                Payload::ComponentCanonicalSection(reader) => {
                    let types = validator.types(0).unwrap();
                    for instruction in reader {
                        match instruction? {
                            wasmparser::CanonicalFunction::Lift {
                                core_func_index,
                                type_index,
                                options,
                            } => {
                                // Get the type we're lifting to.
                                let ty = types
                                    .type_at(type_index, false)
                                    .unwrap()
                                    .as_component_func_type()
                                    .unwrap();
                                let func = Func::Lifted(LiftedFunc {
                                    core_func: core_func_index,
                                    ty: convert_func_type(&mut output, ty, types),
                                    // Note: this is using the `FromIterator` impl on `CanonOpts`.
                                    options: options.iter().copied().collect(),
                                });
                                output.funcs.push(func)
                            }
                            wasmparser::CanonicalFunction::Lower {
                                func_index,
                                options,
                            } => {
                                let ty = types.component_function_at(func_index).unwrap();
                                let func = CoreFunc::Lowered(LoweredFunc {
                                    func: func_index,
                                    ty: convert_func_type(&mut output, ty, types),
                                    options: options.iter().copied().collect(),
                                });
                                output.core_funcs.push(func)
                            }
                        }
                    }
                }
                Payload::ComponentStartSection(_) => todo!("component start sections"),
                Payload::ComponentImportSection(reader) => {
                    for import in reader {
                        let import = import?;
                        match import.ty {
                            wasmparser::ComponentTypeRef::Module(_) => output
                                .modules
                                .push(Module::Imported(import.name.to_owned())),
                            wasmparser::ComponentTypeRef::Func(_) => {
                                output.funcs.push(Func::Imported(import.name.to_owned()))
                            }
                            wasmparser::ComponentTypeRef::Value(_) => todo!("value imports"),
                            wasmparser::ComponentTypeRef::Type(_, _) => todo!("type imports"),
                            wasmparser::ComponentTypeRef::Instance(_) => todo!("instance imports"),
                            wasmparser::ComponentTypeRef::Component(_) => {
                                todo!("component imports")
                            }
                        }
                    }
                }
                Payload::ComponentExportSection(reader) => {
                    for export in reader {
                        output.exports.push(export?.into())
                    }
                }

                Payload::End(_) => break,

                // Ignore anything else.
                _ => {}
            }
        }

        Ok(Some(output))
    }
}
