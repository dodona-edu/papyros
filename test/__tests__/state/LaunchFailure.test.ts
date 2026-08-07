import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunState } from "../../../src/frontend/state/Runner";
import { PapyrosLaunchError } from "../../../src/frontend/state/PapyrosErrors";

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
});
