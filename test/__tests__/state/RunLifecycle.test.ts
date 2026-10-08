import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunState } from "../../../src/frontend/state/Runner";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunMode } from "../../../src/backend/Backend";
import { OutputType } from "../../../src/frontend/state/InputOutput";
import { fakeClient } from "../../fakeClient";

function withClient(client: any): Papyros {
    const papyros = new Papyros();
    papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
    papyros.setErrorHandler(vi.fn());
    return papyros;
}

describe("Runner launch", () => {
    it("is Loading until the backend is up, and Ready after", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const papyros = withClient(client);

        const launching = papyros.runner.launch();
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalled());
        expect(papyros.runner.state).toBe(RunState.Loading);
        expect(papyros.runner.stateMessage).toBe("Loading");
        expect(papyros.runner.backendReady).toBe(false);

        launch.finish();
        await launching;
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.backendReady).toBe(true);
        papyros.dispose();
    });

    it("is in Error after a failed launch", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const papyros = withClient(client);

        const launching = papyros.runner.launch();
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalled());
        expect(papyros.runner.state).toBe(RunState.Loading);

        launch.fail(new Error("worker failed to start"));
        await expect(launching).rejects.toThrow("worker failed to start");
        expect(papyros.runner.state).toBe(RunState.Error);
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
        // The run, not the launch, decides when this instance is Ready again
        expect(papyros.runner.state).toBe(RunState.Loading);

        client.finishRun();
        await running;
        expect(papyros.runtime.isRunning(papyros)).toBe(false);
        papyros.dispose();
    });

    it("is Loading while a terminated run relaunches the worker", async () => {
        const client = fakeClient();
        const papyros = withClient(client);
        await papyros.runner.launch();

        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        const relaunch = client.holdLaunch();
        papyros.runtime.restartWorker(ProgrammingLanguage.Python);
        await vi.waitFor(() => expect(client.workerProxy.launch).toHaveBeenCalledTimes(2));
        expect(papyros.runner.state).toBe(RunState.Loading);

        relaunch.finish();
        await running;
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code interrupted after/);
        papyros.dispose();
    });
});

describe("starting a run from given files", () => {
    const files = [
        { name: "a.txt", content: "aaa", binary: false },
        { name: "b.bin", content: "AAEC", binary: true },
    ];

    async function launched(client: any): Promise<Papyros> {
        const papyros = withClient(client);
        await papyros.runner.launch();
        return papyros;
    }

    it("writes the files into an emptied workspace before running", async () => {
        const client = fakeClient();
        const papyros = await launched(client);

        const running = papyros.runner.start(RunMode.Run, files);
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

        const running = papyros.runner.start(RunMode.Run, files);
        await vi.waitFor(() => expect(client.workerProxy.clearWorkspace).toHaveBeenCalled());
        const stopping = papyros.runner.stop();
        finishClearing();
        await Promise.all([running, stopping]);

        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(papyros.runner.state).toBe(RunState.Ready);

        papyros.dispose();
    });

    it("reports a file that cannot be written instead of running", async () => {
        const error = new Error("No space left on device");
        const client = fakeClient();
        client.workerProxy.updateFile.mockImplementation(() => Promise.reject(error));
        const papyros = await launched(client);

        await papyros.runner.start(RunMode.Run, files);

        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(papyros.io.output).toEqual([{ type: OutputType.stderr, content: error }]);
        expect(papyros.runner.state).toBe(RunState.Ready);

        papyros.dispose();
    });
});
