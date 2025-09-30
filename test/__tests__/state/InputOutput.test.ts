import {Papyros} from "../../../src/Papyros";
import {expect, it, describe} from "vitest";
import {ProgrammingLanguage} from "../../../src/ProgrammingLanguage";
import {FriendlyError, OutputType} from "../../../src/frontend/state/InputOutput";
import {waitForInputReady, waitForOutput} from "../../helpers";

describe.sequential("InputOutput", () => {
    it("can log output", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        papyros.runner.code = `console.log("hello world!");`; // eslint-disable-line quotes
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output.length).toBe(2);
        expect(papyros.io.output[0].content).toBe("hello world!\n");
        expect(papyros.io.output[0].type).toBe(OutputType.stdout);
        expect(papyros.io.output[1].content).toBe("");

    });

    it("can log multiple lines of output", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        papyros.runner.code = `
console.log("hello");
console.log("world!");
`;
        await papyros.runner.start();
        await waitForOutput(papyros, 2);
        expect(papyros.io.output[0].content).toBe("hello\n");
        expect(papyros.io.output[1].content).toBe("world!\n");
    });


    it("can read input", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        papyros.runner.code = `console.log("hello", prompt("input"));`; // eslint-disable-line quotes
        await waitForInputReady();
        const unsubscribe = papyros.io.subscribe(() => papyros.io.awaitingInput ? papyros.io.provideInput("foo") : "", "awaitingInput");
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("hello foo\n");
        unsubscribe();
    });

    it("can read input in python", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `print("hello " + input())`; // eslint-disable-line quotes
        await waitForInputReady();
        const unsubscribe = papyros.io.subscribe(() => papyros.io.awaitingInput ? papyros.io.provideInput("foo") : "", "awaitingInput");
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("hello foo");
        unsubscribe();
    });

    it("can log friendly errors", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        papyros.runner.code = `throw new Error("test error")`; // eslint-disable-line quotes
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output.length).toBe(1);
        expect(papyros.io.output[0].type).toBe(OutputType.stderr);
        expect((papyros.io.output[0].content as FriendlyError).what).toBe("test error");
    });

    it("can read multiple inputs", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        papyros.runner.code = `
console.log("hello", prompt("input1"));
console.log("world!", prompt("input2"));
`;
        let inputCount = 0;
        const unsubscribe = papyros.io.subscribe(async () => {
            await new Promise(r => setTimeout(r, 50));
            if (papyros.io.awaitingInput) {
                inputCount++;
                papyros.io.provideInput("foo" + inputCount);
            }
        });
        await waitForInputReady();
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("hello foo1\n");
        expect(papyros.io.output[1].content).toBe("world! foo2\n");
        unsubscribe();
    });
});