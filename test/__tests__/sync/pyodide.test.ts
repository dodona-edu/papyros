import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPyodideAndPackage, withRetries } from "../../../src/sync/pyodide";
import { PyodideBootError, toPyodideBootError } from "../../../src/sync/errors";

describe("loading Pyodide", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("does not retry a loader that failed to boot Pyodide", async () => {
        const packageUrl = URL.createObjectURL(new Blob(["package"]));
        const loader = vi.fn(() =>
            Promise.reject(toPyodideBootError(new WebAssembly.RuntimeError("Out of bounds memory access"))),
        );

        const started = Date.now();
        await expect(loadPyodideAndPackage({ url: packageUrl, format: ".tgz" }, loader as any)).rejects.toBeInstanceOf(
            PyodideBootError,
        );

        expect(loader).toHaveBeenCalledOnce();
        expect(Date.now() - started).toBeLessThan(1000);
    });

    it("retries a transient failure with a delay", async () => {
        vi.useFakeTimers();
        const fn = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce("loaded");

        const result = withRetries(fn);
        await vi.advanceTimersByTimeAsync(1000);

        await expect(result).resolves.toBe("loaded");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("gives up on a transient failure after three retries", async () => {
        vi.useFakeTimers();
        const fn = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

        const result = withRetries(fn);
        const settled = expect(result).rejects.toThrow("Failed to fetch");
        await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000);

        await settled;
        expect(fn).toHaveBeenCalledTimes(4);
    });
});
