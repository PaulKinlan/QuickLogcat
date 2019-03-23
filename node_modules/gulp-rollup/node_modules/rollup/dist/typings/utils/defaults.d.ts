import Module from '../Module';
import ExternalModule from '../ExternalModule';
export declare function load(id: string): string;
export declare function resolveId(importee: string, importer: string): string | void;
export declare function makeOnwarn(): (warning: any) => void;
export declare function missingExport(module: Module, name: string, otherModule: Module | ExternalModule, start?: number): void;
