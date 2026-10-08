import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunState } from "../../../src/frontend/state/Runner";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";

/**
 * Stand-in for a SyncClient whose launch the test finishes or fails, and whose
 * restart fails the run in progress as interrupted, the way a real one does.
 */
function bootingClient(): any {
    const client: any = {
        worker: {},
        call: (method: (...args: any[]) => Promise<any>, ...args: any[]) =>
            Promise.race([method(...args), new Promise((_, reject) => (client.rejectRun = reject))]),
        interrupt: vi.fn(() => Promise.resolve()),
        restart: vi.fn(() => {
            client.worker = {};
            client.rejectRun?.({ type: "InterruptError" });
        }),
        terminate: vi.fn(),
    };
    client.workerProxy = {
        launch: vi.fn(
            () =>
                new Promise<void>((resolve, reject) => {
                    client.finishLaunch = resolve;
                    client.failLaunch = reject;
                }),
        ),
        usesJspi: () => Promise.resolve(true),
        runModes: () => Promise.resolve([]),
        runCode: vi.fn(() => new Promise<void>((resolve) => (client.finishRun = resolve))),
    };
    return client;
}

function withClient(client: any): Papyros {
    const papyros = new Papyros();
    papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
    papyros.setErrorHandler(vi.fn());
    return papyros;
}

describe("Runner launch", () => {
    it("is Loading until the backend is up, and Ready after", async () => {
        const client = bootingClient();
        const papyros = withClient(client);

        const launching = papyros.runner.launch();
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalled());
        expect(papyros.runner.state).toBe(RunState.Loading);
        expect(papyros.runner.stateMessage).toBe("Loading");
        expect(papyros.runner.backendReady).toBe(false);

        client.finishLaunch();
        await launching;
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.backendReady).toBe(true);
        papyros.dispose();
    });

    it("is in Error after a failed launch", async () => {
        const client = bootingClient();
        const papyros = withClient(client);

        const launching = papyros.runner.launch();
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalled());
        expect(papyros.runner.state).toBe(RunState.Loading);

        client.failLaunch(new Error("worker failed to start"));
        await expect(launching).rejects.toThrow("worker failed to start");
        expect(papyros.runner.state).toBe(RunState.Error);
        papyros.dispose();
    });

    it("runs code started during the launch once the backend is up", async () => {
        const client = bootingClient();
        const papyros = withClient(client);

        const launching = papyros.runner.launch();
        const running = papyros.runner.start();
        expect(papyros.runtime.isRunning(papyros)).toBe(true);
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalled());
        expect(client.workerProxy.runCode).not.toHaveBeenCalled();

        client.finishLaunch();
        await launching;
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledOnce());
        // The run, not the launch, decides when this instance is Ready again
        expect(papyros.runner.state).toBe(RunState.Loading);

        client.finishRun();
        await running;
        expect(papyros.runtime.isRunning(papyros)).toBe(false);
        papyros.dispose();
    });

    it("is Loading while a terminated run relaunches the worker", async () => {
        const client = bootingClient();
        const papyros = withClient(client);
        const launching = papyros.runner.launch();
        client.finishLaunch();
        await launching;

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        papyros.runtime.restartWorker(ProgrammingLanguage.Python);
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalledTimes(2));
        expect(papyros.runner.state).toBe(RunState.Loading);

        client.finishLaunch();
        await running;
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code interrupted after/);
        papyros.dispose();
    });
});
