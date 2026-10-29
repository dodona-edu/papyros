import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import {
    BackendFailure,
    BackendLifecycle,
    BackendStatus,
    RunLifecycle,
    RunOutcome,
    RunStatus,
} from "../../../src/frontend/state/Runner";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunMode } from "../../../src/backend/Backend";
import { OutputType } from "../../../src/frontend/state/InputOutput";
import { BackendEvent, BackendEventType } from "../../../src/communication/BackendEvent";
import { fakeClient } from "../../fakeClient";

const start: BackendEvent = { type: BackendEventType.Start, data: "RunCode", contentType: "text/plain" };
const end: BackendEvent = { type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain" };
const input: BackendEvent = { type: BackendEventType.Input, data: "name?", contentType: "text/plain" };
const output: BackendEvent = { type: BackendEventType.Output, data: "hello", contentType: "text/plain" };
const frame = (line: number): BackendEvent => ({
    type: BackendEventType.Frame,
    contentType: "application/json",
    data: JSON.stringify({
        line,
        event: "step_line",
        func_name: "<module>",
        globals: {},
        ordered_globals: [],
        stack_to_render: [],
        heap: {},
    }),
});

function withClient(client: any): Papyros {
    const papyros = new Papyros();
    papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
    papyros.setErrorHandler(vi.fn());
    return papyros;
}

async function launched(client: any): Promise<Papyros> {
    const papyros = withClient(client);
    await papyros.runner.launch();
    return papyros;
}

describe("Runner launch", () => {
    it("is launching until the backend is up, and up after", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const papyros = withClient(client);
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Down });

        const launching = papyros.runner.launch();
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalled());
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Launching });
        expect(papyros.runner.statusMessage).toBe("Loading");
        expect(papyros.runner.busy).toBe(true);
        expect(papyros.runner.backendReady).toBe(false);

        launch.finish();
        await launching;
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Up });
        expect(papyros.runner.statusMessage).toBe("");
        expect(papyros.runner.busy).toBe(false);
        expect(papyros.runner.backendReady).toBe(true);
        papyros.dispose();
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Down });
    });

    it("has a failed backend after a failed launch", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const papyros = withClient(client);

        const launching = papyros.runner.launch();
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalled());
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Launching });

        launch.fail(new Error("worker failed to start"));
        await expect(launching).rejects.toThrow("worker failed to start");
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Failed, reason: BackendFailure.Error });
        expect(papyros.runner.statusMessage).toBe("Failed to load");
        expect(papyros.runner.canStart).toBe(false);
        papyros.dispose();
    });

    it("runs code started during the launch once the backend is up", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const papyros = withClient(client);

        const launching = papyros.runner.launch();
        const running = papyros.runner.start();
        expect(papyros.runtime.isRunning(papyros)).toBe(true);
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalled());
        expect(client.workerProxy.runCode).not.toHaveBeenCalled();

        launch.finish();
        await launching;
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledOnce());
        // The run, not the launch, decides when it ends
        expect(papyros.runner.run).toEqual({ status: RunStatus.Starting, mode: undefined });

        client.finishRun();
        await running;
        expect(papyros.runtime.isRunning(papyros)).toBe(false);
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Completed });
        papyros.dispose();
    });

    it("ends a terminated run before it relaunches the worker", async () => {
        const client = fakeClient();
        const papyros = withClient(client);
        await papyros.runner.launch();

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        const relaunch = client.holdLaunch();
        papyros.runtime.restartWorker(ProgrammingLanguage.Python);
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalledTimes(2));
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        expect(papyros.runtime.isRunning(papyros)).toBe(false);
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Launching });
        expect(papyros.runner.statusMessage).toBe("Loading");

        relaunch.finish();
        await running;
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Up });
        expect(papyros.runner.statusMessage).toMatch(/^Code interrupted after/);
        papyros.dispose();
    });

    it("lets a stop that replaced the worker return while the replacement launches", async () => {
        const client = fakeClient();
        const papyros = withClient(client);
        await papyros.runner.launch();
        // Without an interrupt buffer, interrupting a busy run replaces the worker
        client.interrupt.mockImplementation(() => Promise.resolve(client.restart()));

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        const relaunch = client.holdLaunch();
        await papyros.runner.stop();
        // Replacing the worker again would abandon the launch the run is waiting for
        expect(client.restart).toHaveBeenCalledOnce();
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Launching });

        relaunch.finish();
        await running;
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Up });
        expect(papyros.runner.statusMessage).toMatch(/^Code interrupted after/);
        papyros.dispose();
    });

    it("lets a debug run started after reset replace a run still waiting for the backend", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const papyros = withClient(client);

        const launching = papyros.runner.launch();
        void papyros.runner.start(RunMode.Run);
        await papyros.runner.reset();
        papyros.runner.code = "x = 1";
        const debugging = papyros.runner.start(RunMode.Debug);
        launch.finish();
        await launching;

        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledOnce());
        expect(client.workerProxy.runCode.mock.calls[0][1]).toBe(RunMode.Debug);
        expect(papyros.debugger.active).toBe(true);

        client.finishRun();
        await debugging;
        papyros.dispose();
    });
});

describe("starting a run from given files", () => {
    const files = [
        { name: "a.txt", content: "aaa", binary: false },
        { name: "b.bin", content: "AAEC", binary: true },
    ];

    it("writes the files into an emptied workspace before running", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start(RunMode.Run, { files });
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.finishRun();
        await running;

        expect(client.workerProxy.updateFile.mock.calls).toEqual([
            ["a.txt", "aaa", false],
            ["b.bin", "AAEC", true],
        ]);
        const [clearOrder] = client.workerProxy.clearWorkspace.mock.invocationCallOrder;
        const [firstWrite, secondWrite] = client.workerProxy.updateFile.mock.invocationCallOrder;
        const [runOrder] = client.workerProxy.runCode.mock.invocationCallOrder;
        expect(clearOrder).toBeLessThan(firstWrite);
        expect(secondWrite).toBeLessThan(runOrder);

        papyros.dispose();
    });

    it("does not run when stopped while the files are written", async () => {
        const client = fakeClient();
        let finishClearing!: () => void;
        client.workerProxy.clearWorkspace.mockImplementation(
            () => new Promise<void>((resolve) => (finishClearing = resolve)),
        );
        const papyros = await launched(client);

        const running = papyros.runner.start(RunMode.Run, { files });
        await vi.waitFor(() => expect(client.workerProxy.clearWorkspace).toHaveBeenCalled());
        const stopping = papyros.runner.stop();
        finishClearing();
        await Promise.all([running, stopping]);

        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });

        papyros.dispose();
    });

    it("waits in starting for files that are still loading, holding the runtime", async () => {
        const client = fakeClient();
        const papyros = await launched(client);
        let resolveFiles!: (loaded: typeof files) => void;
        const loading = new Promise<typeof files>((resolve) => (resolveFiles = resolve));

        const running = papyros.runner.start(RunMode.Run, { files: loading });
        await Promise.resolve();
        expect(papyros.runtime.currentRun?.owner).toBe(papyros);
        expect(papyros.runner.run.status).toBe(RunStatus.Starting);
        expect(client.workerProxy.clearWorkspace).not.toHaveBeenCalled();

        resolveFiles(files);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        expect(client.workerProxy.updateFile).toHaveBeenCalledTimes(2);
        client.finishRun();
        await running;

        papyros.dispose();
    });

    it("ends without running or reporting anything when its files fail to load", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        await papyros.runner.start(RunMode.Run, { files: Promise.reject(new Error("HTTP 404")) });

        expect(client.workerProxy.clearWorkspace).not.toHaveBeenCalled();
        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(papyros.io.output).toEqual([]);
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.FilesFailed });
        expect(papyros.runner.statusMessage).toBe("");
        expect(papyros.runtime.currentRun).toBeNull();

        papyros.dispose();
    });

    it("does not run when stopped while the files load", async () => {
        const client = fakeClient();
        const papyros = await launched(client);
        let resolveFiles!: (loaded: typeof files) => void;
        const loading = new Promise<typeof files>((resolve) => (resolveFiles = resolve));

        const running = papyros.runner.start(RunMode.Run, { files: loading });
        const stopping = papyros.runner.stop();
        resolveFiles(files);
        await Promise.all([running, stopping]);

        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });

        papyros.dispose();
    });

    it("ends at once when stopped while its files never arrive, without replacing the worker", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        void papyros.runner.start(RunMode.Run, { files: new Promise<typeof files>(() => undefined) });
        await papyros.runner.stop();

        expect(client.interrupt).not.toHaveBeenCalled();
        expect(client.restart).not.toHaveBeenCalled();
        expect(papyros.runtime.currentRun).toBeNull();
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledOnce());
        client.finishRun();
        await running;
        papyros.dispose();
    });

    it("ends a run whose files never arrive when reset, so the next start runs", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        void papyros.runner.start(RunMode.Run, { files: new Promise<typeof files>(() => undefined) });
        await papyros.runner.reset();

        expect(papyros.runtime.currentRun).toBeNull();
        expect(papyros.runner.run).toEqual({ status: RunStatus.Idle });

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledOnce());
        client.finishRun();
        await running;
        papyros.dispose();
    });

    it("ignores the files of a stopped run when they arrive during the next run", async () => {
        const client = fakeClient();
        const papyros = await launched(client);
        let resolveFiles!: (loaded: typeof files) => void;
        const loading = new Promise<typeof files>((resolve) => (resolveFiles = resolve));

        const stopped = papyros.runner.start(RunMode.Run, { files: loading });
        await papyros.runner.stop();
        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledOnce());
        resolveFiles(files);
        await stopped;

        expect(client.workerProxy.clearWorkspace).not.toHaveBeenCalled();
        expect(client.workerProxy.updateFile).not.toHaveBeenCalled();
        expect(papyros.runtime.isRunning(papyros)).toBe(true);
        expect(papyros.runner.run.status).toBe(RunStatus.Starting);

        client.finishRun();
        await running;
        papyros.dispose();
    });

    it("reports a file that cannot be written instead of running", async () => {
        const error = new Error("No space left on device");
        const client = fakeClient();
        client.workerProxy.updateFile.mockImplementation(() => Promise.reject(error));
        const papyros = await launched(client);

        await papyros.runner.start(RunMode.Run, { files });

        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(papyros.io.output).toEqual([{ type: OutputType.stderr, content: error }]);
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Crashed });
        expect(papyros.runner.statusMessage).toMatch(/^Code crashed after/);

        papyros.dispose();
    });
});

describe("the outcome of a run", () => {
    it("is completed when the code ran to its end", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start(RunMode.Run);
        expect(papyros.runner.run).toEqual({ status: RunStatus.Starting, mode: RunMode.Run });
        expect(papyros.runner.inProgress).toBe(true);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Running, mode: RunMode.Run });
        expect(papyros.runner.statusMessage).toBe("Running");
        client.emit(end);
        // The End event alone does not end the run: runCode has to settle too
        expect(papyros.runner.run.status).toBe(RunStatus.Running);
        client.finishRun();
        await running;

        expect(papyros.runner.run).toMatchObject({
            status: RunStatus.Ended,
            outcome: RunOutcome.Completed,
            mode: RunMode.Run,
        });
        expect(papyros.runner.inProgress).toBe(false);
        expect(papyros.runner.statusMessage).toMatch(/^Code executed in [\d.]+ s$/);
        papyros.dispose();
    });

    it("is completed and traced when the debugger is still active at its end", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start(RunMode.Debug);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        client.emit(frame(1));
        client.emit(end);
        client.finishRun();
        await running;

        expect(papyros.debugger.active).toBe(true);
        expect(papyros.runner.run).toMatchObject({
            status: RunStatus.Ended,
            outcome: RunOutcome.Completed,
            mode: RunMode.Debug,
        });
        expect(papyros.runner.statusMessage).toMatch(/^Code traced in/);
        papyros.dispose();
    });

    it("reads as executed for a debug run that took no step", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start(RunMode.Debug);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        client.emit(end);
        client.finishRun();
        await running;

        expect(papyros.debugger.active).toBe(false);
        expect(papyros.runner.run).toMatchObject({
            status: RunStatus.Ended,
            outcome: RunOutcome.Completed,
            mode: RunMode.Run,
        });
        expect(papyros.runner.statusMessage).toMatch(/^Code executed in/);
        papyros.dispose();
    });

    it("is stopped when the code was interrupted", async () => {
        const client = fakeClient();
        client.interrupt.mockImplementation(() => Promise.resolve(client.finishRun()));
        const papyros = await launched(client);

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        await papyros.runner.stop();

        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        expect(papyros.runner.statusMessage).toMatch(/^Code interrupted after [\d.]+ s$/);
        await running;
        papyros.dispose();
    });

    it("is crashed when the worker call failed, and reports why", async () => {
        const client = fakeClient();
        const error = new Error("DataCloneError");
        client.workerProxy.runCode.mockImplementationOnce(() => Promise.reject(error));
        const papyros = await launched(client);

        await papyros.runner.start();

        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Crashed });
        expect(papyros.runner.statusMessage).toMatch(/^Code crashed after [\d.]+ s$/);
        expect(papyros.io.output).toEqual([{ type: OutputType.stderr, content: error }]);
        papyros.dispose();
    });

    it("is files-failed when the files of the run fail to load", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        await papyros.runner.start(RunMode.Run, { files: Promise.reject(new Error("HTTP 404")) });

        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.FilesFailed });
        expect(papyros.runner.statusMessage).toBe("");
        papyros.dispose();
    });

    it("is launch-failed when there is no backend to run on", async () => {
        const papyros = new Papyros();

        await papyros.runner.start();

        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.LaunchFailed });
        expect(papyros.runner.statusMessage).toBe("Failed to load");
        expect(papyros.runtime.currentRun).toBeNull();
    });
});

describe("a run whose last events arrive after runCode settled", () => {
    /** Settle runCode the way a slow event proxy shows it: before the events the worker sent last */
    function settleBeforeEvents(client: any): number {
        const runId = client.runId;
        client.runId = undefined;
        client.resolveRun();
        return runId;
    }

    it("stays running until its End event, and ends with all of its output", async () => {
        const client = fakeClient();
        const papyros = await launched(client);
        let outputWhenEnded: unknown[] | undefined;
        papyros.runner.subscribe(() => {
            if (papyros.runner.run.status === RunStatus.Ended) {
                outputWhenEnded ??= papyros.io.output;
            }
        }, "run");

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        const runId = settleBeforeEvents(client);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(papyros.runner.run.status).toBe(RunStatus.Running);
        expect(papyros.runner.inProgress).toBe(true);
        expect(papyros.runtime.isRunning(papyros)).toBe(true);

        client.emit({ ...output, runId });
        client.emit({ ...end, runId });
        await running;

        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Completed });
        expect(outputWhenEnded).toEqual([{ type: OutputType.stdout, content: "hello" }]);
        papyros.dispose();
    });

    it("keeps debug mode and the whole trace when its frames arrive after runCode settled", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start(RunMode.Debug);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        const runId = settleBeforeEvents(client);
        await new Promise((resolve) => setTimeout(resolve, 0));
        client.emit({ ...frame(1), runId });
        client.emit({ ...frame(2), runId });
        client.emit({ ...end, runId });
        await running;

        expect(papyros.debugger.active).toBe(true);
        expect(papyros.debugger.trace.map((f) => f.line)).toEqual([1, 2]);
        expect(papyros.runner.run).toMatchObject({
            status: RunStatus.Ended,
            outcome: RunOutcome.Completed,
            mode: RunMode.Debug,
        });
        papyros.dispose();
    });

    it("ends at once when its End event came before runCode settled", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        client.emit(end);
        client.runId = undefined;
        client.resolveRun();
        await running;

        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Completed });
        papyros.dispose();
    });

    it("ends as stopped when its worker is terminated before the End event", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        settleBeforeEvents(client);
        await new Promise((resolve) => setTimeout(resolve, 0));
        papyros.runtime.restartWorker(ProgrammingLanguage.Python);
        await running;

        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        expect(papyros.runtime.currentRun).toBeNull();
        // The run relaunched the replaced worker
        expect(client.workerProxy.launch).toHaveBeenCalledTimes(2);
        papyros.dispose();
    });
});

describe("ending a run", () => {
    /** Counts the moves of the run into `ended`, and the calls that tell io and the debugger about them */
    function countEnds(papyros: Papyros): { ended: () => number; io: any; debugger: any } {
        let ended = 0;
        let previous = papyros.runner.run;
        papyros.runner.subscribe(() => {
            if (papyros.runner.run !== previous && papyros.runner.run.status === RunStatus.Ended) {
                ended++;
            }
            previous = papyros.runner.run;
        }, "run");
        return {
            ended: () => ended,
            io: vi.spyOn(papyros.io, "onRunEnd"),
            debugger: vi.spyOn(papyros.debugger, "onRunOver"),
        };
    }

    it("happens once when stop and the run itself both end it", async () => {
        const client = fakeClient();
        const papyros = await launched(client);
        let resolveFiles!: (files: []) => void;
        const ends = countEnds(papyros);

        const running = papyros.runner.start(RunMode.Run, {
            files: new Promise((resolve) => (resolveFiles = resolve)),
        });
        await papyros.runner.stop();
        resolveFiles([]);
        await running;

        expect(ends.ended()).toBe(1);
        expect(ends.io).toHaveBeenCalledOnce();
        expect(ends.debugger).toHaveBeenCalledOnce();
        papyros.dispose();
    });

    it("happens once when a stuck run settles after stop gave up on it", async () => {
        const client = fakeClient();
        // Neither the interrupt nor replacing the worker settles the run
        client.restart.mockImplementation(() => undefined);
        const papyros = await launched(client);
        const ends = countEnds(papyros);

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        await papyros.runner.stop();
        expect(client.restart).toHaveBeenCalledOnce();
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        expect(papyros.runtime.currentRun).toBeNull();

        // The events of a replaced worker never arrive
        client.runId = undefined;
        client.resolveRun();
        await running;
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        expect(ends.ended()).toBe(1);
        expect(ends.io).toHaveBeenCalledOnce();
        expect(ends.debugger).toHaveBeenCalledOnce();
        papyros.dispose();
    }, 20000);

    it("ignores an input request that arrives after stop", async () => {
        const client = fakeClient();
        let interrupted!: () => void;
        client.interrupt.mockImplementation(() => {
            interrupted = () => client.finishRun();
            return Promise.resolve();
        });
        const papyros = await launched(client);

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        const stopping = papyros.runner.stop();
        expect(papyros.runner.run.status).toBe(RunStatus.Stopping);
        client.emit(input);

        expect(papyros.runner.run.status).toBe(RunStatus.Stopping);
        expect(papyros.io.awaitingInput).toBe(false);
        await vi.waitFor(() => expect(client.interrupt).toHaveBeenCalled());
        interrupted();
        await Promise.all([stopping, running]);
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        papyros.dispose();
    });

    it("puts the prompt of an input request on the run, and takes it off with the answer", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        client.emit(input);
        expect(papyros.runner.run).toMatchObject({ status: RunStatus.AwaitingInput, prompt: "name?" });
        expect(papyros.io.awaitingInput).toBe(true);
        expect(papyros.io.prompt).toBe("name?");
        expect(papyros.runner.statusMessage).toBe("Awaiting input");

        papyros.io.provideInput("Ada");
        expect(papyros.runner.run.status).toBe(RunStatus.Running);
        expect(papyros.io.prompt).toBe("");
        await vi.waitFor(() => expect(client.writeMessage).toHaveBeenCalledWith("Ada"));

        client.finishRun();
        await running;
        papyros.dispose();
    });

    it("goes back to idle on reset, without the output of the last run", async () => {
        const client = fakeClient();
        const papyros = await launched(client);
        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        client.emit(output);
        client.emit(end);
        client.finishRun();
        await running;
        expect(papyros.io.output).not.toEqual([]);

        await papyros.runner.reset();

        expect(papyros.runner.run).toEqual({ status: RunStatus.Idle });
        expect(papyros.runner.statusMessage).toBe("");
        expect(papyros.io.output).toEqual([]);
        papyros.dispose();
    });
});

describe("the status message", () => {
    const up: BackendLifecycle = { status: BackendStatus.Up };
    const ended = (outcome: RunOutcome, mode?: RunMode): RunLifecycle => ({
        status: RunStatus.Ended,
        outcome,
        mode,
        duration: 1500,
    });
    // prettier-ignore
    const cases: [description: string, backend: BackendLifecycle, run: RunLifecycle, packages: string[], message: string][] = [
        ["a launching backend", { status: BackendStatus.Launching }, { status: RunStatus.Idle }, [], "Loading"],
        ["installing packages", up, { status: RunStatus.Idle }, ["numpy"], "Loading numpy."],
        ["a failed backend", { status: BackendStatus.Failed, reason: BackendFailure.Error }, { status: RunStatus.Idle }, [], "Failed to load"],
        ["an unsupported browser", { status: BackendStatus.Failed, reason: BackendFailure.UnsupportedBrowser }, { status: RunStatus.Idle }, [], "Python could not start in this browser. Close other tabs, update your browser or use another one."],
        ["no run yet", up, { status: RunStatus.Idle }, [], ""],
        ["a starting run", up, { status: RunStatus.Starting }, [], "Loading"],
        ["a running run", up, { status: RunStatus.Running }, [], "Running"],
        ["a run awaiting input", up, { status: RunStatus.AwaitingInput, prompt: "" }, [], "Awaiting input"],
        ["a stopping run", up, { status: RunStatus.Stopping }, [], "Stopping"],
        ["a completed run", up, ended(RunOutcome.Completed, RunMode.Run), [], "Code executed in 1.5 s"],
        ["a completed debug run", up, ended(RunOutcome.Completed, RunMode.Debug), [], "Code traced in 1.5 s"],
        ["a stopped run", up, ended(RunOutcome.Stopped), [], "Code interrupted after 1.5 s"],
        ["a crashed run", up, ended(RunOutcome.Crashed), [], "Code crashed after 1.5 s"],
        ["a run whose files failed", up, ended(RunOutcome.FilesFailed), [], ""],
        ["a run without a backend", up, ended(RunOutcome.LaunchFailed), [], "Failed to load"],
    ];

    it.each(cases)("describes %s", (_, backend, run, packages, message) => {
        const papyros = new Papyros();
        papyros.runner.backendStatus = backend;
        papyros.runner.run = run;
        papyros.runner.loadingPackages = packages;

        expect(papyros.runner.statusMessage).toBe(message);
    });
});
