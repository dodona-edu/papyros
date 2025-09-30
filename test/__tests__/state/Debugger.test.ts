import {describe, it, expect} from "vitest";
import {ProgrammingLanguage} from "../../../src/ProgrammingLanguage";
import {Papyros} from "../../../src/Papyros";
import {RunMode} from "../../../src/backend/Backend";
import {NonExceptionFrame} from "@dodona/trace-component/dist/trace_types";

describe("Debugger", () => {
    it("can run in debug mode", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `x = 1
y = 2
z = x + y`;
        const runPromise = papyros.runner.start(RunMode.Debug);
        await new Promise(r => setTimeout(r, 100));
        expect(papyros.debugger.active).toBe(true);
        await runPromise;
        expect(papyros.debugger.trace.length).toBeGreaterThan(0);
        expect(papyros.debugger.active).toBe(true);
        expect(papyros.debugger.trace[0].line).toBe(1);
        expect(papyros.debugger.trace[3].line).toBe(3);
        expect((papyros.debugger.trace[3] as NonExceptionFrame).globals.z).toBe(3);
    });

    it("keep track of used inputs and outputs", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `print("hello")
input("input: ")
print("world")
z = 1 + 2`;
        const unsubscribe = papyros.io.subscribe(() => papyros.io.awaitingInput ? papyros.io.provideInput("foo") : "", "awaitingInput");
        await papyros.runner.start(RunMode.Debug);
        expect(papyros.debugger.trace.length).toBe(5);
        papyros.debugger.activeFrame = 0;
        expect(papyros.debugger.debugOutputs).toBe(0);
        expect(papyros.debugger.debugUsedInputs).toBe(0);
        papyros.debugger.activeFrame = 1;
        expect(papyros.debugger.debugOutputs).toBe(2);
        expect(papyros.debugger.debugUsedInputs).toBe(0);
        papyros.debugger.activeFrame = 2;
        expect(papyros.debugger.debugOutputs).toBe(2);
        expect(papyros.debugger.debugUsedInputs).toBe(1);
        papyros.debugger.activeFrame = 3;
        expect(papyros.debugger.debugOutputs).toBe(4);
        expect(papyros.debugger.debugUsedInputs).toBe(1);
        papyros.debugger.activeFrame = 4;
        expect(papyros.debugger.debugOutputs).toBe(4);
        expect(papyros.debugger.debugUsedInputs).toBe(1);
        unsubscribe();
    });

    it("resets when deactivated", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `x = 1
y = 2
z = x + y`;
        await papyros.runner.start(RunMode.Debug);
        expect(papyros.debugger.trace.length).toBeGreaterThan(0);
        papyros.debugger.active = false;
        expect(papyros.debugger.trace.length).toBe(0);
    });

});