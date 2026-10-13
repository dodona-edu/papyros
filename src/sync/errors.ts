/**
 * Vendored from comsync (https://github.com/alexmojaki/comsync).
 * Copyright (c) 2022 Alex Hall. MIT licensed, see THIRD-PARTY-NOTICES.md.
 */

/**
 * Raised in the worker when the main thread interrupts a running call
 */
export class InterruptError extends Error {
    // To avoid having to use instanceof
    public readonly type = "InterruptError";
    public readonly name = this.type;
}

/**
 * Raised when a backend needs to block on the main thread but has no channel to do so
 */
export class NoChannelError extends Error {
    // To avoid having to use instanceof
    public readonly type = "NoChannelError";
    public readonly name = this.type;
}

/**
 * Raised in the worker when Pyodide was downloaded but its interpreter failed to start,
 * which retrying in the same browser does not fix
 */
export class PyodideBootError extends Error {
    // Only name, message and stack cross the worker boundary
    public readonly type = "PyodideBootError";
    public readonly name = this.type;

    constructor(cause: Error) {
        super(`${cause.name}: ${cause.message}`, { cause });
        this.stack = cause.stack;
    }
}

/**
 * Wrap an error thrown while loading Pyodide in a PyodideBootError when the interpreter
 * itself failed: a fatal Pyodide error or a WebAssembly trap
 */
export function toPyodideBootError(error: unknown): unknown {
    const trapped = typeof WebAssembly !== "undefined" && error instanceof WebAssembly.RuntimeError;
    const fatal = error instanceof Error && error.name === "FatalPyodideError";
    return trapped || fatal ? new PyodideBootError(error as Error) : error;
}

export function isPyodideBootError(error: unknown): boolean {
    return (error as Error | undefined)?.name === "PyodideBootError";
}
