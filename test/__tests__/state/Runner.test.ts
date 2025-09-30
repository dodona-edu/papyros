import {describe, expect, it} from "vitest";
import {Papyros} from "../../../src/Papyros";
import {ProgrammingLanguage} from "../../../src/ProgrammingLanguage";
import {RunState} from "../../../src/frontend/state/Runner";
import {RunMode} from "../../../src/backend/Backend";
import {waitForOutput} from "../../helpers";

describe("Runner", () => {
    it("should run code", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        papyros.runner.code = `const a = 1;
const b = 7;
const c = a + b;`;
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toBe("");
        await papyros.runner.start();
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in/);
    });

    it("should be able to interrupt code", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        papyros.runner.code = "while(true) {}";
        const runPromise = papyros.runner.start();
        await new Promise(r => setTimeout(r, 100));
        expect(papyros.runner.state).toBe(RunState.Running);
        await papyros.runner.stop();
        await runPromise;
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code interrupted after /);
    });

    it("should be able to handle sleep", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = "import time\ntime.sleep(2)";
        await papyros.runner.start();
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in 2/);
    });

    it("should be able to load python packages", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = "import numpy as np\nprint(np.arange(10))";
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("[0 1 2 3 4 5 6 7 8 9]");
    });

    it("should show lint errors", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python
        papyros.runner.code = `
x = 1
y = 2
print
`;
        const diagnostics = await papyros.runner.lintSource();
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].message).toBe("Statement seems to have no effect");
    });

    it("should run doctests", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python
        papyros.runner.code = `"""
>>> 1 + 1
2
"""`;
        await papyros.runner.start(RunMode.Doctest);
        await waitForOutput(papyros);
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in /);
        expect(papyros.io.output[0].content).toBe("Trying:\n");
        expect(papyros.io.output[1].content).toBe("    1 + 1\n");
        expect(papyros.io.output[2].content).toBe("Expecting:\n");
        expect(papyros.io.output[3].content).toBe("    2\n");
        expect(papyros.io.output[4].content).toBe("ok\n");
    });

    it("can work with provided files in python", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await papyros.runner.provideFiles({"test.txt": "Hello from file!"}, {"readme.md": "https://raw.githubusercontent.com/dodona-edu/papyros/refs/heads/main/README.md"});
        papyros.runner.code = `
with open("test.txt", "r") as f:
    print(f.read())
with open("readme.md", "r") as g:
    print(g.readline())
`;
        await papyros.runner.start();
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("Hello from file!\n");
        expect(papyros.io.output[1].content).toBe("# Papyros\n");
    });
});