import { describe, expect, it, beforeAll, beforeEach, afterAll } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunMode } from "../../../src/backend/Backend";
import { RunState } from "../../../src/frontend/state/Runner";
import {
    launchPapyros,
    settlePapyros,
    waitForAwaitingInput,
    waitForInputReady,
    waitForOutput,
    waitForPapyrosReady,
    waitForRunning,
} from "../../helpers";
import { NonExceptionFrame } from "@dodona/trace-component/dist/trace_types";

function answerInput(papyros: Papyros, value: string): () => void {
    return papyros.io.subscribe(
        () => (papyros.io.awaitingInput ? papyros.io.provideInput(value) : ""),
        "awaitingInput",
    );
}

// One Pyodide boot per describe block: the tests share a Python instance
describe.sequential("JSPI input transport", () => {
    let papyros: Papyros;

    beforeAll(async () => {
        papyros = await launchPapyros(ProgrammingLanguage.Python);
    }, 180000);

    beforeEach(async () => {
        await settlePapyros(papyros);
    });

    afterAll(() => papyros.dispose());

    it("is used by the python backend on a browser that supports stack switching", async () => {
        const backend = await papyros.runner.backend;
        expect(await backend.workerProxy.usesJspi()).toBe(true);
        expect(backend.usesPromiseTransport).toBe(true);
    });

    it("is never used by the javascript backend", async () => {
        const jsPapyros = await launchPapyros(ProgrammingLanguage.JavaScript);
        const backend = await jsPapyros.runner.backend;
        expect(await backend.workerProxy.usesJspi()).toBe(false);
        expect(backend.usesPromiseTransport).toBe(false);
        jsPapyros.dispose();
    });

    it("reads input without touching the channel", async () => {
        papyros.runner.code = "print('hello ' + input('name?'))";
        await waitForInputReady(papyros);
        const unsubscribe = answerInput(papyros, "jspi");
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("hello jspi");
        unsubscribe();
    });

    it("reads repeated input in a loop", async () => {
        papyros.runner.code = "total = 0\nfor _ in range(3):\n    total += int(input())\nprint(total)";
        await waitForInputReady(papyros);
        const unsubscribe = answerInput(papyros, "7");
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("21");
        unsubscribe();
    });

    it("sleeps for the requested duration", async () => {
        papyros.runner.code = "import time\ntime.sleep(2)";
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in 2/);
    });

    it("keeps tracing frames across a suspended input in debug mode", async () => {
        papyros.runner.code = 'print("hello")\nx = input("input: ")\nprint("world " + x)\nz = 1 + 2';
        const unsubscribe = answerInput(papyros, "foo");
        await waitForInputReady(papyros);
        await papyros.runner.start(RunMode.Debug);
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.debugger.trace.length).toBe(5);
        expect((papyros.debugger.trace[4] as NonExceptionFrame).globals.z).toBe(3);
        expect((papyros.debugger.trace[4] as NonExceptionFrame).globals.x).toBe("foo");
        unsubscribe();
    });

    it("interrupts a waiting input without replacing the worker", async () => {
        papyros.runner.code = "x = input('never answered')\nprint(x)";
        await waitForInputReady(papyros);
        const backendBefore = papyros.runner.backend;
        const runPromise = papyros.runner.start();
        await waitForAwaitingInput(papyros);
        await papyros.runner.stop();
        await runPromise;
        await waitForPapyrosReady(papyros, 10000);
        expect(papyros.runner.stateMessage).toMatch(/^Code interrupted after/);
        expect(papyros.runner.backend).toBe(backendBefore);
        expect(papyros.io.output.every((o) => o.type !== "stderr")).toBe(true);

        // The same interpreter must still be usable, no relaunch needed
        papyros.runner.code = "print('alive')";
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("alive\n");
    });

    it("still replaces the worker to interrupt a busy loop", async () => {
        papyros.runner.code = "while True:\n    pass";
        const backendBefore = papyros.runner.backend;
        const runPromise = papyros.runner.start();
        try {
            // Pyodide startup dominates on CI, so wait for the loop rather than guessing a delay
            await waitForRunning(papyros);
        } finally {
            // Never leave a worker spinning, it would slow down every later test
            await papyros.runner.stop();
            await runPromise;
        }
        await waitForPapyrosReady(papyros, 10000);
        expect(papyros.runner.stateMessage).toMatch(/^Code interrupted after/);
        expect(papyros.runner.backend).not.toBe(backendBefore);
        // Interrupting terminated the worker, and the relaunch is not awaited by start().
        // Drain it, so the test does not finish with a launch still in flight.
        await papyros.runner.backend;
    }, 180000);
});

describe.sequential("channel input transport", () => {
    let papyros: Papyros;

    beforeAll(async () => {
        papyros = await launchPapyros(ProgrammingLanguage.Python, { allowJspi: false });
    }, 180000);

    beforeEach(async () => {
        await settlePapyros(papyros);
    });

    afterAll(() => papyros.dispose());

    it("still reads input when JSPI is disabled", async () => {
        const backend = await papyros.runner.backend;
        expect(await backend.workerProxy.usesJspi()).toBe(false);
        expect(backend.usesPromiseTransport).toBe(false);

        papyros.runner.code = "print('hello ' + input('name?'))";
        await waitForInputReady(papyros);
        const unsubscribe = answerInput(papyros, "channel");
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("hello channel");
        unsubscribe();
    }, 180000);

    it("still interrupts a waiting input when JSPI is disabled", async () => {
        papyros.runner.code = "x = input('never answered')\nprint(x)";
        await waitForInputReady(papyros);
        const runPromise = papyros.runner.start();
        await waitForAwaitingInput(papyros);
        await papyros.runner.stop();
        await runPromise;
        await waitForPapyrosReady(papyros, 10000);
        expect(papyros.runner.stateMessage).toMatch(/^Code interrupted after/);
    }, 180000);
});
