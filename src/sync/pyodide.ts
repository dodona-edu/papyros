/**
 * Vendored from pyodide-worker-runner (https://github.com/alexmojaki/pyodide-worker-runner).
 * Copyright (c) 2022 Alex Hall. MIT licensed, see THIRD-PARTY-NOTICES.md.
 */
import * as Comlink from "comlink";
import { loadPyodide, PyodideInterface, version as npmVersion } from "pyodide";

export type PyodideLoader = () => Promise<PyodideInterface>;

export interface PackageOptions {
    url: string; // URL to fetch the package from

    // These arguments are passed to `pyodide.unpackArchive`
    // (https://pyodide.org/en/stable/usage/api/js-api.html#pyodide.unpackArchive)
    format: string; // By default the options are 'bztar', 'gztar', 'tar', 'zip', and 'wheel'
    extractDir?: string; // Defaults to /tmp/
}

const RETRIES = 3;

async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError;
}

/**
 * Loads the Pyodide module from the official CDN as suggested in
 * https://pyodide.org/en/stable/usage/quickstart.html#setup.
 * By default, uses `pyodide.version`, i.e. the version installed from npm.
 */
export async function defaultPyodideLoader(version: string = npmVersion): Promise<PyodideInterface> {
    const indexURL = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;
    const result = await loadPyodide({ indexURL });
    if (result.version !== version) {
        throw new Error(`loadPyodide loaded version ${result.version} instead of ${version}`);
    }
    return result;
}

/**
 * Loads Pyodide in parallel to downloading an archive with our own code and dependencies,
 * which it then unpacks into the virtual filesystem ready to be imported.
 * The extraction directory is added to `sys.path`.
 *
 * Both downloads are retried in case of network errors, and the raw contents of the package
 * are cached in memory to avoid re-downloading when Pyodide has to be reloaded.
 */
export async function loadPyodideAndPackage(
    packageOptions: PackageOptions,
    pyodideLoader: PyodideLoader = defaultPyodideLoader,
): Promise<PyodideInterface> {
    const { format, url } = packageOptions;
    const extractDir = packageOptions.extractDir || "/tmp/";

    const [pyodide, packageBuffer] = await Promise.all([
        withRetries(() => pyodideLoader()),
        withRetries(() => getPackageBuffer(url)),
    ]);

    pyodide.unpackArchive(packageBuffer, format, { extractDir });

    const sys = pyodide.pyimport("sys");
    sys.path.append(extractDir);

    initPyodide(pyodide);

    return pyodide;
}

/**
 * Registers Comlink so proxies survive the worker boundary, and imports the
 * `pyodide_worker_runner` module shipped in our Python package. Importing it lowers the
 * recursion limit so deep recursion raises a Python RecursionError instead of a fatal
 * JS RangeError, and provides `install_imports` used by papyros.py.
 */
export function initPyodide(pyodide: PyodideInterface): void {
    pyodide.registerComlink(Comlink);
    pyodide.pyimport("pyodide_worker_runner");
}

const packageCache = new Map<string, ArrayBuffer>();

async function getPackageBuffer(url: string): Promise<ArrayBuffer> {
    if (packageCache.has(url)) {
        return packageCache.get(url)!;
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request for package failed with status ${response.status}: ${response.statusText}`);
    }
    const result = await response.arrayBuffer();
    packageCache.set(url, result);
    return result;
}
