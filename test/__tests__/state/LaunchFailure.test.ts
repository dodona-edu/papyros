import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunState } from "../../../src/frontend/state/Runner";
import { PapyrosLaunchError } from "../../../src/frontend/state/PapyrosErrors";
// eslint-disable-next-line jest/no-mocks-import
import { MockBackend } from "../../__mocks__/MockBackend";

// Fails fast instead of letting a regression hit the suite timeout
function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${what} did not settle within ${ms} ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

describe("Papyros launch failure", () => {
    it("surfaces a failed backend launch instead of hanging", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);

        const papyros = new Papyros();
        papyros.runner.registerBackend(
            ProgrammingLanguage.Python,
            () =>
                ({
                    workerProxy: {
                        launch: () => Promise.reject(new Error("worker failed to start")),
                    },
                }) as any,
        );
        const errorHandler = vi.fn();
        papyros.setErrorHandler(errorHandler);

        await withTimeout(papyros.launch(), 2000, "Papyros.launch()");

        expect(errorHandler).toHaveBeenCalledOnce();
        const error = errorHandler.mock.calls[0][0];
        expect(error).toBeInstanceOf(PapyrosLaunchError);
        expect((error.cause as Error).message).toBe("worker failed to start");
        expect(papyros.runner.state).toBe(RunState.Error);
        expect(papyros.runner.backendReady).toBe(false);

        // Callers awaiting the backend must reject instead of waiting forever
        await expect(withTimeout(papyros.runner.backend, 2000, "runner.backend")).rejects.toThrow(
            "worker failed to start",
        );
    });

    it("launches a fresh backend after a failed one", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);

        const terminate = vi.fn();
        const creator = vi
            .fn()
            .mockImplementationOnce(
                () =>
                    ({
                        workerProxy: {
                            launch: () => Promise.reject(new Error("worker failed to start")),
                        },
                        terminate,
                    }) as any,
            )
            .mockImplementationOnce(() => ({ workerProxy: new MockBackend() }) as any);

        const papyros = new Papyros();
        papyros.runner.registerBackend(ProgrammingLanguage.Python, creator);
        papyros.setErrorHandler(vi.fn());

        await withTimeout(papyros.launch(), 2000, "Papyros.launch()");

        expect(creator).toHaveBeenCalledOnce();
        expect(terminate).toHaveBeenCalledOnce();
        expect(papyros.runner.state).toBe(RunState.Error);
        expect(papyros.runner.backendReady).toBe(false);

        // A longer budget than the failed launch: this one reaches ensureChannel, which may
        // register the input service worker
        await withTimeout(papyros.runner.launch(), 10000, "runner.launch() retry");

        expect(creator).toHaveBeenCalledTimes(2);
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.backendReady).toBe(true);

        papyros.dispose();
    });
});
