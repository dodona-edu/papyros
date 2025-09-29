import {Papyros} from "../../src/Papyros";
import { expect, it, describe } from "vitest";
import {ProgrammingLanguage} from "../../src/ProgrammingLanguage";
import {RunState} from "../../src/frontend/state/Runner";

describe("Papyros", () => {
    it("can run code", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        papyros.runner.code = `console.log("hello", prompt("input"));`;
        const unsubscribe = papyros.io.subscribe(() => papyros.io.awaitingInput ? papyros.io.provideInput("foo"): "", "awaitingInput");
        await papyros.runner.start();
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.io.output[0].content).toBe("hello foo\n");
        unsubscribe();
    });

    it("can run python code", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `print("hello " + input())`;
        const unsubscribe = papyros.io.subscribe(() => papyros.io.awaitingInput ? papyros.io.provideInput("foo"): "", "awaitingInput");
        await papyros.runner.start();
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.io.output[0].content).toBe("hello foo");
        unsubscribe();
    });
})