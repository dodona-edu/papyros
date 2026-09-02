import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";

const memoryError = (): Error => Object.assign(new Error("MemoryError"), { type: "PythonError" });

/**
 * Stand-in for a SyncClient whose worker can be replaced, so a recovery is
 * observable the same way it is on a real one: a new worker object and a
 * workerProxy that no longer fails.
 */
function fakeClient({
    lintCode = () => Promise.resolve([]),
    runCode = () => Promise.resolve(),
    launch = () => Promise.resolve(),
}: {
    lintCode?: () => Promise<any>;
    runCode?: () => Promise<any>;
    launch?: () => Promise<void>;
} = {}): any {
    const updateFile = vi.fn(() => Promise.resolve());
    const proxyFor = (lint: () => Promise<any>, run: () => Promise<any>): any => ({
        launch,
        usesJspi: () => Promise.resolve(true),
        runModes: () => Promise.resolve([]),
        lintCode: vi.fn(lint),
        runCode: vi.fn(run),
        provideFiles: vi.fn(() => Promise.resolve()),
        updateFile,
    });
    const client: any = {
        worker: {},
        workerProxy: proxyFor(lintCode, runCode),
        updateFile,
        call: (method: (...args: any[]) => Promise<any>, ...args: any[]) => method(...args),
        restart: vi.fn(() => {
            client.worker = {};
            client.workerProxy = proxyFor(
                () => Promise.resolve([]),
                () => Promise.resolve(),
            );
        }),
        terminate: vi.fn(),
    };
    return client;
}

async function launched(client: any): Promise<Papyros> {
    const papyros = new Papyros();
    papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
    papyros.setErrorHandler(vi.fn());
    await papyros.runner.launch();
    return papyros;
}

describe("recovering from an unusable runtime", () => {
    it("reports a failed lint without throwing and keeps the runtime", async () => {
        const client = fakeClient({ lintCode: () => Promise.reject(new Error("something went wrong")) });
        const papyros = await launched(client);
        const errorHandler = vi.fn();
        papyros.setErrorHandler(errorHandler);

        await expect(papyros.runner.lintSource()).resolves.toEqual([]);

        expect(errorHandler).toHaveBeenCalledOnce();
        expect(client.restart).not.toHaveBeenCalled();

        papyros.dispose();
    });

    it("replaces a runtime that ran out of memory and restores its files", async () => {
        const client = fakeClient({ lintCode: () => Promise.reject(memoryError()) });
        const papyros = await launched(client);
        papyros.io.addFile("data.txt", "hello", false);

        await expect(papyros.runner.lintSource()).resolves.toEqual([]);

        expect(client.restart).toHaveBeenCalledOnce();
        expect(client.updateFile).toHaveBeenCalledWith("data.txt", "hello", false);
        // The replacement runtime lints again instead of staying broken
        await expect(papyros.runner.lintSource()).resolves.toEqual([]);
        expect(client.restart).toHaveBeenCalledOnce();

        papyros.dispose();
    });

    it("replaces a runtime that a run left unusable", async () => {
        const client = fakeClient({ runCode: () => Promise.reject(memoryError()) });
        const papyros = await launched(client);
        papyros.io.addFile("data.txt", "hello", false);

        await papyros.runner.start();

        expect(client.restart).toHaveBeenCalledOnce();
        expect(client.updateFile).toHaveBeenCalledWith("data.txt", "hello", false);
        expect(papyros.io.awaitingInput).toBe(false);

        papyros.dispose();
    });

    it("closes the input prompt of a run the recovery abandons", async () => {
        const client = fakeClient({ lintCode: () => Promise.reject(memoryError()) });
        const papyros = await launched(client);
        // A lint can fail while a run is suspended in input(), and the restart
        // takes that run down with the worker
        papyros.io.awaitingInput = true;

        await papyros.runner.lintSource();

        expect(client.restart).toHaveBeenCalledOnce();
        expect(papyros.io.awaitingInput).toBe(false);

        papyros.dispose();
    });

    it("hands provided files over again, since io.files omits the large ones", async () => {
        const client = fakeClient({ lintCode: () => Promise.reject(memoryError()) });
        const papyros = await launched(client);
        const inlined = { "data.csv": "a,b\n1,2" };
        const hrefs = { "big.bin": "https://example.org/big.bin" };
        await papyros.runner.provideFiles(inlined, hrefs);

        await papyros.runner.lintSource();

        expect(client.restart).toHaveBeenCalledOnce();
        expect(client.workerProxy.provideFiles).toHaveBeenCalledWith(inlined, hrefs);

        papyros.dispose();
    });

    it("lints nothing after a failed launch instead of retrying it", async () => {
        const client = fakeClient({ launch: () => Promise.reject(new Error("Out of bounds memory access")) });
        const papyros = new Papyros();
        papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
        const errorHandler = vi.fn();
        papyros.setErrorHandler(errorHandler);
        await expect(papyros.runner.launch()).rejects.toThrow("Out of bounds memory access");

        await expect(papyros.runner.lintSource()).resolves.toEqual([]);

        expect(client.restart).not.toHaveBeenCalled();
        expect(errorHandler).not.toHaveBeenCalled();

        papyros.dispose();
    });
});
