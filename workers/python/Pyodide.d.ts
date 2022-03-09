/**
 * TypeScript interface for used Pyodide methods
 */
export interface Pyodide {
    /**
     * Runs a string of Python code from JavaScript.
     */
    runPython: (code: string, globals?: any) => any;
    /**
     * Runs Python code using PyCF_ALLOW_TOP_LEVEL_AWAIT.
     */
    runPythonAsync: (code: string) => Promise<void>;
    /**
     * Inspect a Python code chunk and use pyodide.loadPackage()
     * to install any known packages that the code chunk imports.
     */
    loadPackagesFromImports: (code: string) => Promise<void>;
    /**
     * Load a package or a list of packages over the network.
     */
    loadPackage: (names: string | string[]) => Promise<void>;
    /**
     * An alias to the global Python namespace.
     */
    globals: Map<string, any>;
}
export declare const PYODIDE_INDEX_URL: string;
export declare const PYODIDE_JS_URL: string;
