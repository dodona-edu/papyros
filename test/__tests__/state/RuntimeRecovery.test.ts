import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunMode } from "../../../src/backend/Backend";
import { BackendEvent, BackendEventType } from "../../../src/communication/BackendEvent";
import { OutputType } from "../../../src/frontend/state/InputOutput";
import { fakeClient as eventClient } from "../../fakeClient";
import { RunOutcome, RunStatus } from "../../../src/frontend/state/Runner";

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
        launch: (callback: (e: BackendEvent) => void) => {
            client.callback = callback;
            return launch();
        },
        usesJspi: () => Promise.resolve(true),
        runModes: () => Promise.resolve([]),
        lintCode: vi.fn(lint),
        // Like the worker, a run that returns sends End before runCode settles
        runCode: vi.fn(async (code: string, mode: RunMode, maxSteps: number, runId: number) => {
            await run();
            client.callback({ type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain", runId });
        }),
        provideFiles: vi.fn(() => Promise.resolve()),
        updateFile,
        clearWorkspace: vi.fn(() => Promise.resolve()),
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
        expect(papyros.runner.lifecycle).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Crashed });
        expect(papyros.runner.statusMessage).toMatch(/^Code crashed after/);
        expect(papyros.io.output).toEqual([{ type: OutputType.stderr, content: memoryError() }]);

        papyros.dispose();
    });

    it("ends a run suspended in input that the recovery abandons", async () => {
        // Fails the pending run as interrupted when its worker is replaced, as SyncClient does
        const client = eventClient();
        client.workerProxy.lintCode.mockImplementation(() => Promise.reject(memoryError()));
        const papyros = await launched(client);
        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit({ type: BackendEventType.Start, data: "RunCode", contentType: "text/plain" });
        client.emit({ type: BackendEventType.Input, data: "", contentType: "text/plain" });
        expect(papyros.io.awaitingInput).toBe(true);

        // A lint can fail while a run is suspended in input(), and the restart
        // takes that run down with the worker
        await papyros.runner.lintSource();
        await running;

        expect(client.restart).toHaveBeenCalledOnce();
        expect(papyros.io.awaitingInput).toBe(false);
        expect(papyros.runner.lifecycle).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        expect(papyros.runtime.currentRun).toBeNull();

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

    it("does not replay provided files after a run that was given files", async () => {
        const client = fakeClient({ lintCode: () => Promise.reject(memoryError()) });
        const papyros = await launched(client);
        await papyros.runner.provideFiles({ "data.csv": "a,b" }, {});
        await papyros.runner.start(RunMode.Run, { files: [{ name: "data.txt", content: "x", binary: false }] });

        await papyros.runner.lintSource();

        expect(client.restart).toHaveBeenCalledOnce();
        expect(client.workerProxy.provideFiles).not.toHaveBeenCalled();

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
