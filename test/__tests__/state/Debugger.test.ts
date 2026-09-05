import {describe, it, expect, beforeAll, beforeEach, afterAll} from "vitest";
import {ProgrammingLanguage} from "../../../src/ProgrammingLanguage";
import {Papyros} from "../../../src/frontend/state/Papyros";
import {RunMode} from "../../../src/backend/Backend";
import {RunState} from "../../../src/frontend/state/Runner";
import {NonExceptionFrame} from "@dodona/trace-component/dist/trace_types";
import {launchPapyros, settlePapyros, waitForInputReady, waitForOutput, waitForPapyrosReady, wipeWorkspace} from "../../helpers";
import {BackendEvent, BackendEventType} from "../../../src/communication/BackendEvent";

// One Pyodide boot for the whole file: the tests share a Python instance. The frame
// history records a file snapshot per run, so the workspace is wiped between tests.
describe.sequential("Debugger", () => {
    let papyros: Papyros;
    let defaultMaxDebugFrames: number;

    beforeAll(async () => {
        papyros = await launchPapyros(ProgrammingLanguage.Python);
        defaultMaxDebugFrames = papyros.constants.maxDebugFrames;
    }, 180000);

    beforeEach(async () => {
        await settlePapyros(papyros);
        papyros.constants.maxDebugFrames = defaultMaxDebugFrames;
        await wipeWorkspace(papyros);
    });

    afterAll(() => papyros.dispose());

    it("can run in debug mode", async () => {
        papyros.runner.code = `x = 1
y = 2
z = x + y
print(z)`;
        const runPromise = papyros.runner.start(RunMode.Debug);
        await new Promise(r => setTimeout(r, 100));
        expect(papyros.debugger.active).toBe(true);
        await runPromise;
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.debugger.trace.length).toBeGreaterThan(0);
        expect(papyros.debugger.active).toBe(true);
        expect(papyros.debugger.trace[0].line).toBe(1);
        expect(papyros.debugger.trace[3].line).toBe(4);
        expect((papyros.debugger.trace[3] as NonExceptionFrame).globals.z).toBe(3);
    });

    it("keep track of used inputs and outputs", async () => {
        papyros.runner.code = `print("hello")
input("input: ")
print("world")
z = 1 + 2`;
        const unsubscribe = papyros.io.subscribe(() => papyros.io.awaitingInput ? papyros.io.provideInput("foo") : "", "awaitingInput");
        await waitForInputReady(papyros);
        await papyros.runner.start(RunMode.Debug);
        await waitForOutput(papyros);
        // waitForOutput returns on the first output, but the assertions below need every frame
        await waitForPapyrosReady(papyros);

        const firstNOutputs = (n: number): string => "".concat(
            ...papyros.io.output
                .slice(0, n)
                .filter(o => o.type === "stdout")
                .map(o => o.content as string)
        );

        expect(papyros.debugger.trace.length).toBe(5);
        papyros.debugger.activeFrame = 0;
        expect(firstNOutputs(papyros.debugger.debugOutputs as number)).toBe("");
        expect(papyros.debugger.debugUsedInputs).toBe(0);
        papyros.debugger.activeFrame = 2;
        expect(firstNOutputs(papyros.debugger.debugOutputs as number)).toBe("hello\n");
        expect(papyros.debugger.debugUsedInputs).toBe(1);
        papyros.debugger.activeFrame = 4;
        expect(firstNOutputs(papyros.debugger.debugOutputs as number)).toBe("hello\nworld\n");
        expect(papyros.debugger.debugUsedInputs).toBe(1);
        unsubscribe();
    });

    it("shows correct files per debug frame", async () => {
        papyros.runner.code = `x = 1\nwith open('test.txt', 'w') as f:\n    f.write('hello')\ny = 2`;
        await papyros.runner.start(RunMode.Debug);
        await waitForPapyrosReady(papyros);

        expect(papyros.debugger.trace.length).toBeGreaterThanOrEqual(4);

        // At the first frame, no file has been created yet
        papyros.debugger.activeFrame = 0;
        expect(papyros.debugger.debugFiles).toEqual([]);

        // At the last frame, test.txt should be visible
        papyros.debugger.activeFrame = papyros.debugger.trace.length - 1;
        expect(papyros.debugger.debugFiles.length).toBe(1);
        expect(papyros.debugger.debugFiles[0].name).toBe("test.txt");

        // Stepping backward restores the empty state
        papyros.debugger.activeFrame = 0;
        expect(papyros.debugger.debugFiles).toEqual([]);
    });

    it("batches frame updates but delivers the complete trace", async () => {
        papyros.runner.code = `total = 0
for i in range(50):
    total += i`;
        let traceUpdates = 0;
        const unsubscribe = papyros.debugger.subscribe(() => traceUpdates++, "trace");
        await papyros.runner.start(RunMode.Debug);
        await waitForPapyrosReady(papyros);
        unsubscribe();

        // 50 iterations of a 2-line loop body: > 100 frames
        expect(papyros.debugger.trace.length).toBeGreaterThan(100);
        // frames arrive batched: far fewer reactive updates than frames
        expect(traceUpdates).toBeLessThan(papyros.debugger.trace.length / 2);
        // the last frame is the loop's final state
        const last = papyros.debugger.trace[papyros.debugger.trace.length - 1] as NonExceptionFrame;
        expect(last.globals.total).toBe(1225);
        // frameStates stayed in sync with the trace
        papyros.debugger.activeFrame = papyros.debugger.trace.length - 1;
        expect(papyros.debugger.debugLine).toBe(last.line);
    });

    it("caps a debug run at maxDebugFrames without stalling", async () => {
        papyros.constants.maxDebugFrames = 5;
        papyros.runner.code = `total = 0
for i in range(50):
    total += i`;
        await papyros.runner.start(RunMode.Debug);
        await waitForPapyrosReady(papyros);

        // The tracer stops at the frame budget on its own, so the run finishes
        // normally rather than being interrupted by the frontend
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code traced in/);
        expect(papyros.debugger.trace.length).toBe(5);
    });

    it("resets when deactivated", async () => {
        papyros.runner.code = `x = 1
y = 2
z = x + y
print(z)`;
        await papyros.runner.start(RunMode.Debug);
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.debugger.trace.length).toBeGreaterThan(0);
        papyros.debugger.active = false;
        expect(papyros.debugger.trace.length).toBe(0);
    });

});

// The events a worker sends during a debug run, replayed by hand on an instance
// without a worker: the ordering between two runs is what these tests are about,
// and it cannot be reproduced reliably against a live worker.
describe("Debugger run boundaries", () => {
    const start: BackendEvent = { type: BackendEventType.Start, data: "RunCode", contentType: "text/plain" };
    const end: BackendEvent = { type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain" };
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
    const exception: BackendEvent = {
        type: BackendEventType.Frame,
        contentType: "application/json",
        data: JSON.stringify({ line: 2, event: "uncaught_exception", exception_msg: "boom" }),
    };

    let papyros: Papyros;

    beforeEach(() => {
        papyros = new Papyros();
        papyros.debugger.active = true;
    });

    afterAll(() => papyros.dispose());

    it("drops frames of the previous run that arrive before the worker starts the next one", () => {
        papyros.debugger.onRunStart();
        papyros.events.publish(start);
        papyros.events.publish(frame(1));
        papyros.events.publish(exception);
        papyros.events.publish(end);
        expect(papyros.debugger.trace.map(f => f.event)).toEqual(["step_line", "uncaught_exception"]);

        // the next run starts while the previous one is still delivering its last frame
        papyros.debugger.onRunStart();
        papyros.events.publish(exception);
        expect(papyros.debugger.trace).toEqual([]);

        papyros.events.publish(start);
        papyros.events.publish(frame(1));
        papyros.events.publish(end);
        expect(papyros.debugger.trace.map(f => f.event)).toEqual(["step_line"]);
    });

    it("ignores anything sent after the uncaught_exception frame of a run", () => {
        papyros.debugger.onRunStart();
        papyros.events.publish(start);
        papyros.events.publish(frame(1));
        papyros.events.publish(exception);
        papyros.events.publish(frame(3));
        papyros.events.publish(end);
        expect(papyros.debugger.trace.map(f => f.event)).toEqual(["step_line", "uncaught_exception"]);
    });

    it("keeps batching frames when the previous run ends after the next one started", () => {
        papyros.debugger.onRunStart();
        // the end event of the previous run lands after the reset
        papyros.events.publish(end);
        papyros.events.publish(start);
        papyros.events.publish(frame(1));
        expect(papyros.debugger.trace).toEqual([]);
        papyros.events.publish(end);
        expect(papyros.debugger.trace.map(f => f.line)).toEqual([1]);
    });
});
