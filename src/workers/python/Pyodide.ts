export interface Pyodide {
    runPython: (code: string, globals?: any) => any;
    runPythonAsync: (code: string) => Promise<void>;
    loadPackagesFromImports: (code: string) => Promise<void>;
    loadPackage: (names: string | string[]) => Promise<void>;
    globals: Map<string, any>;
}

const PYODIDE_VERSION = "v0.19.0";
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;
export const PYODIDE_JS_URL = PYODIDE_INDEX_URL + "pyodide.js";
