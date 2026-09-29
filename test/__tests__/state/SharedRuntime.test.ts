import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { PapyrosRuntime } from "../../../src/frontend/state/PapyrosRuntime";
import { RunState } from "../../../src/frontend/state/Runner";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunMode } from "../../../src/backend/Backend";
import { BackendEvent, BackendEventType } from "../../../src/communication/BackendEvent";
import { BackendManager } from "../../../src/communication/BackendManager";
import { OutputType } from "../../../src/frontend/state/InputOutput";
import { waitForOutput, waitForPapyrosReady, waitForRunning } from "../../helpers";

const output = (data: string): BackendEvent => ({ type: BackendEventType.Output, data, contentType: "text/plain" });
const end: BackendEvent = { type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain" };

/**
 * Stand-in for a SyncClient that hands out the worker's event callback, so a test
 * decides which events arrive while a run is in progress, and when that run ends.
 */
function fakeClient(): any {
    const fake: any = {
        worker: {},
        emit: (e: BackendEvent) => fake.callback(e),
        // Ends the pending runCode, as the worker does after sending its End event
        finishRun: () => fake.resolveRun(),
        call: (method: (...args: any[]) => Promise<any>, ...args: any[]) =>
            Promise.race([method(...args), new Promise((_, reject) => (fake.rejectRun = reject))]),
        interrupt: vi.fn(() => Promise.resolve()),
        writeMessage: vi.fn(() => Promise.resolve()),
        restart: vi.fn(() => {
            fake.worker = {};
            fake.rejectRun?.({ type: "InterruptError" });
        }),
        terminate: vi.fn(),
    };
    fake.workerProxy = {
        launch: vi.fn((callback: (e: BackendEvent) => void) => {
            fake.callback = callback;
            return Promise.resolve();
        }),
        usesJspi: () => Promise.resolve(true),
        runModes: () => Promise.resolve([]),
        lintCode: vi.fn(() => Promise.resolve([])),
        runCode: vi.fn(() => new Promise<void>((resolve) => (fake.resolveRun = resolve))),
        clearWorkspace: vi.fn(() => Promise.resolve()),
        updateFile: vi.fn(() => Promise.resolve()),
    };
    return fake;
}

async function sharing(creator: () => any): Promise<{ runtime: PapyrosRuntime; a: Papyros; b: Papyros }> {
    const runtime = new PapyrosRuntime();
    runtime.registerBackend(ProgrammingLanguage.Python, creator);
    const a = new Papyros({ runtime });
    const b = new Papyros({ runtime });
    await Promise.all([a.runner.launch(), b.runner.launch()]);
    return { runtime, a, b };
}

async function sharingJavaScript(): Promise<{ runtime: PapyrosRuntime; a: Papyros; b: Papyros }> {
    const runtime = new PapyrosRuntime();
    const a = new Papyros({ runtime });
    const b = new Papyros({ runtime });
    for (const papyros of [a, b]) {
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        await papyros.launch();
        await papyros.runner.backend;
    }
    return { runtime, a, b };
}

describe.sequential("Papyros instances sharing a runtime", () => {
    it("launch a single worker", async () => {
        const client = fakeClient();
        const creator = vi.fn(() => client);
        const { runtime, a, b } = await sharing(creator);

        expect(creator).toHaveBeenCalledOnce();
        expect(client.workerProxy.launch).toHaveBeenCalledOnce();
        expect(await a.runner.backend).toBe(await b.runner.backend);
        expect(a.runner.backendReady && b.runner.backendReady).toBe(true);
        runtime.dispose();
    });

    it("run on one real worker in turn", async () => {
        const createBackend = vi.spyOn(BackendManager, "createBackend");
        try {
            const { runtime, a, b } = await sharingJavaScript();
            expect(createBackend).toHaveBeenCalledOnce();

            a.runner.code = 'console.log("from a");';
            await a.runner.start();
            await waitForOutput(a);
            b.runner.code = 'console.log("from b");';
            await b.runner.start();
            await waitForOutput(b);

            expect(a.io.output.map((o) => o.content).join("")).toBe("from a\n");
            expect(b.io.output.map((o) => o.content).join("")).toBe("from b\n");
            runtime.dispose();
        } finally {
            createBackend.mockRestore();
        }
    }, 180000);

    it("deliver run events to the running instance only, late ones included", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);

        const running = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(output("hello"));
        client.emit({ type: BackendEventType.Input, data: "name?", contentType: "text/plain" });
        client.emit({
            type: BackendEventType.Files,
            data: { "out.txt": { content: "x", binary: false } },
            contentType: "application/json",
        });

        expect(a.io.output).toEqual([{ type: OutputType.stdout, content: "hello" }]);
        expect(a.io.awaitingInput).toBe(true);
        expect(a.io.files.map((f) => f.name)).toEqual(["out.txt"]);
        expect(b.io.output).toEqual([]);
        expect(b.io.awaitingInput).toBe(false);
        expect(b.io.files).toEqual([]);

        client.emit(end);
        client.finishRun();
        await running;
        expect(runtime.running).toBeNull();

        client.emit(output(" late"));
        expect(a.io.output.map((o) => o.content)).toEqual(["hello", " late"]);
        expect(b.io.output).toEqual([]);
        runtime.dispose();
    });

    it("refuse a start while another instance runs, without touching it", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);
        b.io.output = [{ type: OutputType.stdout, content: "earlier" }];

        const running = a.runner.start();
        await b.runner.start(RunMode.Debug);

        expect(runtime.running).toBe(a);
        expect(b.io.output).toEqual([{ type: OutputType.stdout, content: "earlier" }]);
        expect(b.runner.state).toBe(RunState.Ready);
        expect(b.debugger.active).toBe(false);

        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(end);
        client.finishRun();
        await running;
        expect(client.workerProxy.runCode).toHaveBeenCalledOnce();
        runtime.dispose();
    });

    it("run a start requested twice in the same tick once", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);

        const first = a.runner.start();
        const second = b.runner.start();
        const again = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(end);
        client.finishRun();
        await Promise.all([first, second, again]);

        expect(client.workerProxy.runCode).toHaveBeenCalledOnce();
        runtime.dispose();
    });

    it("ignore stop and input from an instance that is not running", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);

        const running = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit({ type: BackendEventType.Input, data: "name?", contentType: "text/plain" });
        expect(a.runner.state).toBe(RunState.AwaitingInput);

        await b.runner.stop();
        await b.runner.provideInput("from b");

        expect(client.interrupt).not.toHaveBeenCalled();
        expect(client.writeMessage).not.toHaveBeenCalled();
        expect(a.runner.state).toBe(RunState.AwaitingInput);
        expect(b.runner.state).toBe(RunState.Ready);

        await a.runner.provideInput("from a");
        expect(client.writeMessage).toHaveBeenCalledWith("from a");

        client.emit(end);
        client.finishRun();
        await running;
        runtime.dispose();
    });

    it("let the other instance run after a stuck run was stopped", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);

        // The interrupt changes nothing, so stop() has to replace the worker
        const running = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        await a.runner.stop();
        await running;

        expect(client.restart).toHaveBeenCalledOnce();
        expect(runtime.running).toBeNull();
        expect(a.runner.state).toBe(RunState.Ready);

        const next = b.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledTimes(2));
        expect(runtime.running).toBe(b);
        // The replaced worker was launched again before b ran on it
        expect(client.workerProxy.launch).toHaveBeenCalledTimes(2);
        client.emit(end);
        client.finishRun();
        await next;
        runtime.dispose();
    }, 20000);

    it("let the other instance run after a real run was stopped", async () => {
        const { runtime, a, b } = await sharingJavaScript();
        a.runner.code = "while (true) {}";
        const running = a.runner.start();
        await waitForRunning(a);

        await a.runner.stop();
        await running;
        expect(runtime.running).toBeNull();

        b.runner.code = 'console.log("after stop");';
        await b.runner.start();
        await waitForOutput(b);
        expect(b.io.output[0].content).toBe("after stop\n");
        expect(a.io.output).toEqual([]);
        runtime.dispose();
    }, 180000);

    it("start each run from its own files only", async () => {
        const runtime = new PapyrosRuntime();
        const a = new Papyros({ runtime });
        const b = new Papyros({ runtime });
        await a.launch();
        await b.launch();

        a.runner.code = 'open("created.txt", "w").write("by a")';
        await a.runner.start(RunMode.Run, [{ name: "a.txt", content: "a", binary: false }]);
        await waitForPapyrosReady(a, 60000);

        b.runner.code = "import os\nprint(sorted(os.listdir()))";
        await b.runner.start(RunMode.Run, [{ name: "b.txt", content: "b", binary: false }]);
        await waitForOutput(b, 1, 10000);
        await waitForPapyrosReady(b, 60000);

        expect((b.io.output[0].content as string).trim()).toBe("['b.txt']");
        expect(a.io.files.map((f) => f.name)).toContain("created.txt");
        expect(b.io.files.map((f) => f.name)).not.toContain("created.txt");
        expect(b.io.files.map((f) => f.name)).not.toContain("a.txt");
        runtime.dispose();
    }, 180000);

    it("free the worker when the running instance is disposed", async () => {
        const { runtime, a, b } = await sharingJavaScript();
        a.runner.code = "while (true) {}";
        const running = a.runner.start();
        await waitForRunning(a);

        a.dispose();
        expect(runtime.running).toBeNull();
        await running;

        b.runner.code = 'console.log("survivor");';
        await b.runner.start();
        await waitForOutput(b);
        expect(b.io.output[0].content).toBe("survivor\n");

        const backend = await b.runner.backend;
        runtime.dispose();
        expect(backend.worker).toBeUndefined();
    }, 180000);

    it("put every instance in error when the launch fails, and recover on a retry", async () => {
        const working = fakeClient();
        const creator = vi
            .fn()
            .mockImplementationOnce(
                () =>
                    ({
                        workerProxy: { launch: () => Promise.reject(new Error("worker failed to start")) },
                        terminate: vi.fn(),
                    }) as any,
            )
            .mockImplementationOnce(() => working);
        const runtime = new PapyrosRuntime();
        runtime.registerBackend(ProgrammingLanguage.Python, creator);
        const a = new Papyros({ runtime });
        const b = new Papyros({ runtime });

        const launches = await Promise.allSettled([a.runner.launch(), b.runner.launch()]);

        expect(launches.map((l) => l.status)).toEqual(["rejected", "rejected"]);
        expect(a.runner.state).toBe(RunState.Error);
        expect(b.runner.state).toBe(RunState.Error);

        await a.runner.launch();
        await b.runner.launch();
        expect(creator).toHaveBeenCalledTimes(2);
        expect(working.workerProxy.launch).toHaveBeenCalledOnce();
        expect(a.runner.state).toBe(RunState.Ready);
        expect(b.runner.state).toBe(RunState.Ready);
        runtime.dispose();
    });

    it("tell every instance about loading packages without disturbing an idle one", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);
        const seenByB = vi.fn();
        b.events.subscribe(BackendEventType.Loading, seenByB);

        const running = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit({
            type: BackendEventType.Loading,
            data: { modules: ["numpy"], status: "loading" },
            contentType: "application/json",
        });

        expect(seenByB).toHaveBeenCalledOnce();
        expect(a.runner.state).toBe(RunState.Loading);
        expect(a.runner.loadingPackages).toEqual(["numpy"]);
        expect(b.runner.state).toBe(RunState.Ready);
        expect(b.runner.loadingPackages).toEqual([]);

        client.emit({
            type: BackendEventType.Loading,
            data: { modules: ["numpy"], status: "loaded" },
            contentType: "application/json",
        });
        client.emit(end);
        client.finishRun();
        await running;
        expect(seenByB).toHaveBeenCalledTimes(2);
        expect(b.runner.state).toBe(RunState.Ready);
        runtime.dispose();
    });
});
