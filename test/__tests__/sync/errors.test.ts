import { describe, expect, it } from "vitest";
import * as Comlink from "comlink";
import { isPyodideBootError, PyodideBootError, toPyodideBootError } from "../../../src/sync/errors";

// Pyodide sets the name on the prototype of its own error class
class FatalPyodideError extends Error {}
Object.defineProperty(FatalPyodideError.prototype, "name", { value: "FatalPyodideError" });

describe("toPyodideBootError", () => {
    it("wraps a WebAssembly trap", () => {
        const trap = new WebAssembly.RuntimeError("call_indirect to a null table entry");
        const wrapped = toPyodideBootError(trap) as PyodideBootError;

        expect(wrapped).toBeInstanceOf(PyodideBootError);
        expect(wrapped.message).toBe("RuntimeError: call_indirect to a null table entry");
        expect(wrapped.cause).toBe(trap);
        expect(isPyodideBootError(wrapped)).toBe(true);
    });

    it("wraps a fatal Pyodide error", () => {
        const fatal = new FatalPyodideError("Failed to import _pyodide_core");
        const wrapped = toPyodideBootError(fatal) as PyodideBootError;

        expect(wrapped).toBeInstanceOf(PyodideBootError);
        expect(wrapped.message).toBe("FatalPyodideError: Failed to import _pyodide_core");
    });

    it("leaves a failed download alone so it can be retried", () => {
        const network = new TypeError("Failed to fetch");
        expect(toPyodideBootError(network)).toBe(network);
        expect(isPyodideBootError(network)).toBe(false);
        expect(isPyodideBootError(undefined)).toBe(false);
    });

    it("is still recognised after crossing a Comlink boundary", async () => {
        const { port1, port2 } = new MessageChannel();
        Comlink.expose(
            {
                launch: () => {
                    throw toPyodideBootError(new WebAssembly.RuntimeError("Out of bounds memory access"));
                },
            },
            port1,
        );
        const remote = Comlink.wrap<{ launch: () => void }>(port2);

        const error = await Promise.resolve(remote.launch()).catch((e) => e);

        expect(error).not.toBeInstanceOf(PyodideBootError);
        expect(isPyodideBootError(error)).toBe(true);
        expect(error.message).toBe("RuntimeError: Out of bounds memory access");
        remote[Comlink.releaseProxy]();
        port1.close();
    });
});
