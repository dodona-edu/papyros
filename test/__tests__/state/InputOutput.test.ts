import {Papyros} from "../../../src/frontend/state/Papyros";
import {expect, it, describe, beforeAll, beforeEach, afterAll} from "vitest";
import {ProgrammingLanguage} from "../../../src/ProgrammingLanguage";
import {FriendlyError, InputMode, OutputType} from "../../../src/frontend/state/InputOutput";
import {launchPapyros, settlePapyros, waitForAwaitingInput, waitForInputReady, waitForOutput} from "../../helpers";

// One Pyodide boot for the whole file: the Python tests share an instance, and the
// JavaScript tests get cheap throwaway instances that never boot Pyodide at all.
describe.sequential("InputOutput", () => {
    let papyros: Papyros;

    beforeAll(async () => {
        papyros = await launchPapyros(ProgrammingLanguage.Python);
    }, 180000);

    beforeEach(async () => {
        await settlePapyros(papyros);
    });

    afterAll(() => papyros.dispose());

    it("can log output", async () => {
        const jsPapyros = await launchPapyros(ProgrammingLanguage.JavaScript);
        jsPapyros.runner.code = `console.log("hello world!");`; // eslint-disable-line quotes
        await jsPapyros.runner.start();
        await waitForOutput(jsPapyros);
        expect(jsPapyros.io.output.length).toBe(2);
        expect(jsPapyros.io.output[0].content).toBe("hello world!\n");
        expect(jsPapyros.io.output[0].type).toBe(OutputType.stdout);
        expect(jsPapyros.io.output[1].content).toBe("");
        jsPapyros.dispose();
    });

    it("can log multiple lines of output", async () => {
        const jsPapyros = await launchPapyros(ProgrammingLanguage.JavaScript);
        jsPapyros.runner.code = `
console.log("hello");
console.log("world!");
`;
        await jsPapyros.runner.start();
        await waitForOutput(jsPapyros, 2);
        expect(jsPapyros.io.output[0].content).toBe("hello\n");
        expect(jsPapyros.io.output[1].content).toBe("world!\n");
        jsPapyros.dispose();
    });

    it("can read input", async () => {
        const jsPapyros = await launchPapyros(ProgrammingLanguage.JavaScript);
        jsPapyros.runner.code = `console.log("hello", prompt("input"));`; // eslint-disable-line quotes
        await waitForInputReady(jsPapyros);
        const unsubscribe = jsPapyros.io.subscribe(() => jsPapyros.io.awaitingInput ? jsPapyros.io.provideInput("foo") : "", "awaitingInput");
        await jsPapyros.runner.start();
        await waitForOutput(jsPapyros);
        expect(jsPapyros.io.output[0].content).toBe("hello foo\n");
        unsubscribe();
        jsPapyros.dispose();
    });

    it("can read input in python", async () => {
        papyros.runner.code = `print("hello " + input())`; // eslint-disable-line quotes
        await waitForInputReady(papyros);
        const unsubscribe = papyros.io.subscribe(() => papyros.io.awaitingInput ? papyros.io.provideInput("foo") : "", "awaitingInput");
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("hello foo");
        unsubscribe();
    });

    it("stops asking for input on stop", async () => {
        papyros.runner.code = `print("hello " + input())`; // eslint-disable-line quotes
        await waitForInputReady(papyros);
        const runPromise = papyros.runner.start();
        await waitForAwaitingInput(papyros);
        await papyros.runner.stop();
        expect(papyros.io.awaitingInput).toBe(false);
        await runPromise;
    });

    it("can log friendly errors", async () => {
        const jsPapyros = await launchPapyros(ProgrammingLanguage.JavaScript);
        jsPapyros.runner.code = `throw new Error("test error")`; // eslint-disable-line quotes
        await jsPapyros.runner.start();
        await waitForOutput(jsPapyros);
        expect(jsPapyros.io.output.length).toBe(1);
        expect(jsPapyros.io.output[0].type).toBe(OutputType.stderr);
        expect((jsPapyros.io.output[0].content as FriendlyError).what).toBe("test error");
        jsPapyros.dispose();
    });

    it("can read multiple inputs", async () => {
        papyros.runner.code = `
print("hello " + input("input1"))
print("world! " + input("input2"))
`;
        let inputCount = 0;
        const unsubscribe = papyros.io.subscribe(async () => {
            await new Promise(r => setTimeout(r, 50));
            if (papyros.io.awaitingInput) {
                inputCount++;
                papyros.io.provideInput("foo" + inputCount);
            }
        });
        await waitForInputReady(papyros);
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("hello foo1");
        expect(papyros.io.output[3].content).toBe("world! foo2");
        unsubscribe();
    });

    it("can preprovide multiple inputs in the buffer", async () => {
        papyros.runner.code = `
print("hello " + input("input1"))
print("world! " + input("input2"))
`;
        papyros.io.inputMode = InputMode.batch;
        papyros.io.inputBuffer = "foo1\nfoo2\n";
        await waitForInputReady(papyros);
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("hello foo1");
        expect(papyros.io.output[3].content).toBe("world! foo2");
    });
});
