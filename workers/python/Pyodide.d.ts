export interface Pyodide {
    runPython: (code: string, globals?: any) => any;
    runPythonAsync: (code: string) => Promise<void>;
    loadPackagesFromImports: (code: string, mCb?: (m: string) => void) => Promise<void>;
    loadPackage: (names: string | string[], mCb?: (m: string) => void) => Promise<void>;
    globals: Map<string, any>;
}
export declare const PYODIDE_INDEX_URL: string;
export declare const PYODIDE_JS_URL: string;
