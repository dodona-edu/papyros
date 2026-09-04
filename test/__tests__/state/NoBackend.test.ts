import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunState } from "../../../src/frontend/state/Runner";

// Fails fast instead of letting a regression hit the suite timeout
function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${what} did not settle within ${ms} ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Everything the controls can trigger must settle without a backend: the run and
// stop buttons stay reachable when the launch never happened or failed
describe("Runner without a backend", () => {
    it("stops without throwing when nothing was launched", async () => {
        const papyros = new Papyros();

        await withTimeout(papyros.runner.stop(), 2000, "runner.stop()");

        expect(papyros.runner.state).toBe(RunState.Error);
    });

    it("refuses to start when nothing was launched", async () => {
        const papyros = new Papyros();
        papyros.runner.code = "print(1)";

        await withTimeout(papyros.runner.start(), 2000, "runner.start()");

        expect(papyros.runner.state).toBe(RunState.Error);
        expect(papyros.io.output).toEqual([]);
    });

    it("does not stay loading when files cannot be handed over", async () => {
        const papyros = new Papyros();

        await withTimeout(papyros.runner.provideFiles({ "data.txt": "1" }, {}), 2000, "runner.provideFiles()");

        expect(papyros.runner.loadingPackages).toEqual([]);
        expect(papyros.runner.state).not.toBe(RunState.Loading);
    });

    it("ignores input and file operations when nothing was launched", async () => {
        const papyros = new Papyros();

        await withTimeout(
            Promise.all([
                papyros.runner.provideInput("42"),
                papyros.runner.updateFile("a.txt", "1", false),
                papyros.runner.renameFile("a.txt", "b.txt"),
                papyros.runner.deleteFile("b.txt"),
            ]),
            2000,
            "runner file operations",
        );

        expect(await papyros.runner.lintSource()).toEqual([]);
    });

    it("stops without throwing after a failed launch", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);

        const papyros = new Papyros();
        papyros.setErrorHandler(vi.fn());
        papyros.runner.registerBackend(
            ProgrammingLanguage.Python,
            () =>
                ({
                    workerProxy: {
                        launch: () => Promise.reject(new Error("worker failed to start")),
                    },
                }) as any,
        );
        await withTimeout(papyros.launch(), 2000, "Papyros.launch()");
        expect(papyros.runner.state).toBe(RunState.Error);

        await withTimeout(papyros.runner.stop(), 2000, "runner.stop()");
        expect(papyros.runner.state).toBe(RunState.Error);

        await withTimeout(papyros.runner.start(), 2000, "runner.start()");
        expect(papyros.runner.state).toBe(RunState.Error);

        // Nothing is running, so there is nothing for a reset to stop
        await withTimeout(papyros.runner.reset(), 2000, "runner.reset()");
        expect(papyros.runner.state).toBe(RunState.Error);
    });

    it("marks the runner as failed when the input channel cannot be created", async () => {
        const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);

        const papyros = new Papyros();
        vi.spyOn(papyros as any, "canDeferChannel").mockReturnValue(false);
        vi.spyOn(papyros, "ensureChannel").mockResolvedValue(false);

        await withTimeout(papyros.launch(), 2000, "Papyros.launch()");

        expect(alert).toHaveBeenCalledOnce();
        expect(papyros.runner.state).toBe(RunState.Error);
        expect(papyros.runner.stateMessage).toBe(papyros.i18n.t("Papyros.service_worker_error"));
        expect(papyros.runner.backendReady).toBe(false);

        await withTimeout(papyros.runner.stop(), 2000, "runner.stop()");
        expect(papyros.runner.state).toBe(RunState.Error);
    });
});
