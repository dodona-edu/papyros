import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";

/**
 * Stand-in for a SyncClient whose worker can be replaced, so a recovery is
 * observable the same way it is on a real one: a new worker object and a
 * workerProxy that no longer fails.
 */
function fakeClient(lintCode: () => Promise<any>): any {
    const updateFile = vi.fn(() => Promise.resolve());
    const proxyFor = (lint: () => Promise<any>): any => ({
        launch: () => Promise.resolve(),
        usesJspi: () => Promise.resolve(true),
        runModes: () => Promise.resolve([]),
        lintCode: vi.fn(lint),
        updateFile,
    });
    const client: any = {
        worker: {},
        workerProxy: proxyFor(lintCode),
        updateFile,
        restart: vi.fn(() => {
            client.worker = {};
            client.workerProxy = proxyFor(() => Promise.resolve([]));
        }),
        terminate: vi.fn(),
    };
    return client;
}

describe("recovering from an unusable runtime", () => {
    it("reports a failed lint without throwing and keeps the runtime", async () => {
        const client = fakeClient(() => Promise.reject(new Error("something went wrong")));
        const papyros = new Papyros();
        papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
        const errorHandler = vi.fn();
        papyros.setErrorHandler(errorHandler);
        await papyros.runner.launch();

        await expect(papyros.runner.lintSource()).resolves.toEqual([]);

        expect(errorHandler).toHaveBeenCalledOnce();
        expect(client.restart).not.toHaveBeenCalled();

        papyros.dispose();
    });

    it("replaces a runtime that ran out of memory and restores its files", async () => {
        const memoryError = Object.assign(new Error("MemoryError"), { type: "PythonError" });
        const client = fakeClient(() => Promise.reject(memoryError));
        const papyros = new Papyros();
        papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
        papyros.setErrorHandler(vi.fn());
        await papyros.runner.launch();
        papyros.io.addFile("data.txt", "hello", false);

        await expect(papyros.runner.lintSource()).resolves.toEqual([]);

        expect(client.restart).toHaveBeenCalledOnce();
        expect(client.updateFile).toHaveBeenCalledWith("data.txt", "hello", false);
        // The replacement runtime lints again instead of staying broken
        await expect(papyros.runner.lintSource()).resolves.toEqual([]);
        expect(client.restart).toHaveBeenCalledOnce();

        papyros.dispose();
    });
});
