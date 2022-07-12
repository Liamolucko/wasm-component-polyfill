wit_bindgen_rust::export!("parser.wit");

use parser::{
    Component, CoreExport, CoreInstance, CoreInstantiateArg, CoreReexport, CoreSort, Error, Export,
    Module, ModuleInstance, Sort,
};
use wasmparser::{
    Alias, BinaryReaderError, ComponentExternalKind, Encoding, ExternalKind, Instance, Payload,
    WasmFeatures,
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
            sort: match export.kind {
                ComponentExternalKind::Module => Sort::Module,
                ComponentExternalKind::Func => todo!(),
                ComponentExternalKind::Value => todo!(),
                ComponentExternalKind::Type => todo!(),
                ComponentExternalKind::Instance => todo!(),
                ComponentExternalKind::Component => todo!(),
            },
            index: export.index,
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
                                    ExternalKind::Func => output.core_funcs.push(export),
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
                Payload::ComponentCanonicalSection(_) => todo!("component canonical sections"),
                Payload::ComponentStartSection(_) => todo!("component start sections"),
                Payload::ComponentImportSection(reader) => {
                    for import in reader {
                        let import = import?;
                        match import.ty {
                            wasmparser::ComponentTypeRef::Module(_) => output
                                .modules
                                .push(Module::Imported(import.name.to_owned())),
                            wasmparser::ComponentTypeRef::Func(_) => todo!("function imports"),
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
