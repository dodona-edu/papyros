import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunMode } from "../../../src/backend/Backend";
import { RunState } from "../../../src/frontend/state/Runner";
import { waitForAwaitingInput, waitForInputReady, waitForOutput, waitForPapyrosReady } from "../../helpers";
import { NonExceptionFrame } from "@dodona/trace-component/dist/trace_types";

async function pythonPapyros(allowJspi: boolean = true): Promise<Papyros> {
    const papyros = new Papyros();
    papyros.runner.allowJspi = allowJspi;
    await papyros.launch();
    papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
    return papyros;
}

function answerInput(papyros: Papyros, value: string): () => void {
    return papyros.io.subscribe(
        () => (papyros.io.awaitingInput ? papyros.io.provideInput(value) : ""),
        "awaitingInput",
    );
}

describe.sequential("JSPI input transport", () => {
    it("is used by the python backend on a browser that supports stack switching", async () => {
        const papyros = await pythonPapyros();
        const backend = await papyros.runner.backend;
        expect(await backend.workerProxy.usesJspi()).toBe(true);
        expect(backend.usesPromiseTransport).toBe(true);
    });

    it("is never used by the javascript backend", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        const backend = await papyros.runner.backend;
        expect(await backend.workerProxy.usesJspi()).toBe(false);
        expect(backend.usesPromiseTransport).toBe(false);
    });

    it("reads input without touching the channel", async () => {
        const papyros = await pythonPapyros();
        papyros.runner.code = "print('hello ' + input('name?'))";
        await waitForInputReady();
        const unsubscribe = answerInput(papyros, "jspi");
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("hello jspi");
        unsubscribe();
    });

    it("reads repeated input in a loop", async () => {
        const papyros = await pythonPapyros();
        papyros.runner.code = "total = 0\nfor _ in range(3):\n    total += int(input())\nprint(total)";
        await waitForInputReady();
        const unsubscribe = answerInput(papyros, "7");
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("21");
        unsubscribe();
    });

    it("sleeps for the requested duration", async () => {
        const papyros = await pythonPapyros();
        papyros.runner.code = "import time\ntime.sleep(2)";
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in 2/);
    });

    it("keeps tracing frames across a suspended input in debug mode", async () => {
        const papyros = await pythonPapyros();
        papyros.runner.code = 'print("hello")\nx = input("input: ")\nprint("world " + x)\nz = 1 + 2';
        const unsubscribe = answerInput(papyros, "foo");
        await waitForInputReady();
        await papyros.runner.start(RunMode.Debug);
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.debugger.trace.length).toBe(5);
        expect((papyros.debugger.trace[4] as NonExceptionFrame).globals.z).toBe(3);
        expect((papyros.debugger.trace[4] as NonExceptionFrame).globals.x).toBe("foo");
        unsubscribe();
    });

    it("interrupts a waiting input without replacing the worker", async () => {
        const papyros = await pythonPapyros();
        papyros.runner.code = "x = input('never answered')\nprint(x)";
        await waitForInputReady();
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
        const papyros = await pythonPapyros();
        papyros.runner.code = "while True:\n    pass";
        const backendBefore = papyros.runner.backend;
        const runPromise = papyros.runner.start();
        await new Promise((r) => setTimeout(r, 3000));
        expect(papyros.runner.state).toBe(RunState.Running);
        await papyros.runner.stop();
        await runPromise;
        await waitForPapyrosReady(papyros, 10000);
        expect(papyros.runner.stateMessage).toMatch(/^Code interrupted after/);
        expect(papyros.runner.backend).not.toBe(backendBefore);
    });
});

describe.sequential("channel input transport", () => {
    it("still reads input when JSPI is disabled", async () => {
        const papyros = await pythonPapyros(false);
        const backend = await papyros.runner.backend;
        expect(await backend.workerProxy.usesJspi()).toBe(false);
        expect(backend.usesPromiseTransport).toBe(false);

        papyros.runner.code = "print('hello ' + input('name?'))";
        await waitForInputReady();
        const unsubscribe = answerInput(papyros, "channel");
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("hello channel");
        unsubscribe();
    });

    it("still interrupts a waiting input when JSPI is disabled", async () => {
        const papyros = await pythonPapyros(false);
        papyros.runner.code = "x = input('never answered')\nprint(x)";
        await waitForInputReady();
        const runPromise = papyros.runner.start();
        await waitForAwaitingInput(papyros);
        await papyros.runner.stop();
        await runPromise;
        await waitForPapyrosReady(papyros, 10000);
        expect(papyros.runner.stateMessage).toMatch(/^Code interrupted after/);
    });
});
