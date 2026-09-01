import {describe, expect, it, beforeAll, beforeEach, afterAll} from "vitest";
import {Papyros} from "../../../src/frontend/state/Papyros";
import {ProgrammingLanguage} from "../../../src/ProgrammingLanguage";
import {RunState} from "../../../src/frontend/state/Runner";
import {RunMode} from "../../../src/backend/Backend";
import {launchPapyros, settlePapyros, waitForOutput, waitForPapyrosReady} from "../../helpers";
import {FriendlyError, OutputType} from "../../../src/frontend/state/InputOutput";

// One Pyodide boot for the whole file: instances are isolated now, so the suite
// shares a single Python instance and settles it between tests.
describe.sequential("Runner", () => {
    let papyros: Papyros;

    beforeAll(async () => {
        papyros = await launchPapyros(ProgrammingLanguage.Python);
    }, 180000);

    beforeEach(async () => {
        await settlePapyros(papyros, ProgrammingLanguage.Python);
    });

    afterAll(() => papyros.dispose());

    it("should run code", async () => {
        const jsPapyros = await launchPapyros(ProgrammingLanguage.JavaScript);
        jsPapyros.runner.code = `const a = 1;
const b = 7;
const c = a + b;`;
        expect(jsPapyros.runner.state).toBe(RunState.Ready);
        expect(jsPapyros.runner.stateMessage).toBe("");
        await jsPapyros.runner.start();
        await waitForPapyrosReady(jsPapyros);
        expect(jsPapyros.runner.stateMessage).toMatch(/^Code executed in/);
        jsPapyros.dispose();
    });

    it("only reports the backend as ready once it has loaded", async () => {
        const jsPapyros = new Papyros();
        jsPapyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;

        // Runs are queued while the backend loads, so the run state is Ready first
        expect(jsPapyros.runner.state).toBe(RunState.Ready);
        expect(jsPapyros.runner.backendReady).toBe(false);

        await jsPapyros.runner.backend;
        expect(jsPapyros.runner.backendReady).toBe(true);
        jsPapyros.dispose();
    });

    it("does not report a superseded launch as ready", async () => {
        // A fresh instance, so the current Python launch is a real boot that is
        // still in flight when the superseded JavaScript one settles
        const racePapyros = new Papyros();
        racePapyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        const superseded = racePapyros.runner.backend;
        racePapyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        const current = racePapyros.runner.backend;

        let currentLoaded = false;
        current.then(() => (currentLoaded = true));

        // Only the current backend may flip the flag, whichever finishes first
        await superseded;
        expect(racePapyros.runner.backendReady).toBe(currentLoaded);

        await current;
        expect(racePapyros.runner.backendReady).toBe(true);
        racePapyros.dispose();
    }, 180000);

    it("should run code that raises an error", async () => {
        papyros.runner.code = "raise ValueError(\"test\")\n";
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in/);
        expect((papyros.io.output[0].content as FriendlyError).traceback).toMatch(/ValueError: test/);
    });

    it("should finish a run that fails to compile", async () => {
        papyros.runner.code = "print 'hello'\n";
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in/);
        expect((papyros.io.output[0].content as FriendlyError).traceback).toMatch(/SyntaxError/);
    });

    it("should keep running while the program writes to stderr", async () => {
        const jsPapyros = await launchPapyros(ProgrammingLanguage.JavaScript);
        jsPapyros.runner.code = `console.error("warning");
console.log("started");
const deadline = Date.now() + 500;
while (Date.now() < deadline) {}
console.log("done");`;
        const runPromise = jsPapyros.runner.start();
        await waitForOutput(jsPapyros, 2);
        // the stderr output is in, the program is still busy
        expect(jsPapyros.runner.state).toBe(RunState.Running);
        await runPromise;
        await waitForPapyrosReady(jsPapyros);
        expect(jsPapyros.io.output[0].type).toBe(OutputType.stderr);
        expect(jsPapyros.io.output.slice(1).every(o => o.type === OutputType.stdout)).toBe(true);
        expect(jsPapyros.io.output.map(o => o.content).join("")).toMatch(/started[\s\S]*done/);
        jsPapyros.dispose();
    });

    it("should show what a program writes to stderr as error output", async () => {
        papyros.runner.code = `import sys
print("to stdout")
print("to stderr", file=sys.stderr)`;
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros, 2);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in/);
        // output streams in chunks, so compare the text per stream
        const text = (type: OutputType) => papyros.io.output.filter(o => o.type === type).map(o => o.content).join("");
        expect(text(OutputType.stdout)).toBe("to stdout\n");
        expect(text(OutputType.stderr)).toBe("to stderr\n");
    });

    it("should be able to interrupt code", async () => {
        // Interrupting a busy loop replaces the worker, so use a throwaway instance
        const jsPapyros = await launchPapyros(ProgrammingLanguage.JavaScript);
        jsPapyros.runner.code = "while(true) {}";
        const runPromise = jsPapyros.runner.start();
        await new Promise(r => setTimeout(r, 100));
        expect(jsPapyros.runner.state).toBe(RunState.Running);
        await jsPapyros.runner.stop();
        await runPromise;
        expect(jsPapyros.runner.state).toBe(RunState.Ready);
        expect(jsPapyros.runner.stateMessage).toMatch(/^Code interrupted after /);
        // The relaunch started by stop() is not awaited by start(); drain it
        await jsPapyros.runner.backend;
        jsPapyros.dispose();
    });

    it("should be able to import re", async () => {
        papyros.runner.code = "import re\nprint(re.findall(r'\\d+', 'a1 b2 c3'))";
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in/);
        expect(papyros.io.output[0].content).toBe("['1', '2', '3']\n");
    });

    it("should lint bare import re", async () => {
        papyros.runner.code = "import re\n";
        const diagnostics = await papyros.runner.lintSource();
        expect(Array.isArray(diagnostics)).toBe(true);
    }, 60000);

    it("should lint code that uses pandas without hanging or a false import-error", async () => {
        papyros.runner.code = "import pandas as pd\ndf = pd.DataFrame({'a': [1, 2, 3]})\n";
        const diagnostics = await papyros.runner.lintSource();
        expect(Array.isArray(diagnostics)).toBe(true);
        // pandas is installed before linting, so it must not be flagged as unimportable
        expect(diagnostics.some((d) => /import-error|Unable to import/.test(d.message))).toBe(false);
    }, 60000);

    it("should report an import-error for a genuinely missing module", async () => {
        papyros.runner.code = "import this_module_truly_does_not_exist_xyz\n";
        const diagnostics = await papyros.runner.lintSource();
        expect(diagnostics.some((d) => /import-error|Unable to import/.test(d.message))).toBe(true);
    }, 60000);

    it("should not flag stdlib modules astroid cannot build (os) as unimportable", async () => {
        // astroid can't build `os` under Emscripten (it pulls in the posix built-in),
        // which used to surface as a false "Unable to import 'os'".
        papyros.runner.code = "import os\nfrom os import getcwd\nprint(os.getcwd(), getcwd())\n";
        const diagnostics = await papyros.runner.lintSource();
        expect(
            diagnostics.some((d) => /import-error|Unable to import|No name '.*' in module 'os'/.test(d.message)),
        ).toBe(false);
    }, 60000);

    it("should report a wrong name imported from a stubbed stdlib module (os)", async () => {
        papyros.runner.code = "from os import asdfjasdlf\n";
        const diagnostics = await papyros.runner.lintSource();
        expect(diagnostics.some((d) => /No name 'asdfjasdlf' in module 'os'/.test(d.message))).toBe(true);
    }, 60000);

    it("should be able to handle sleep", async () => {
        papyros.runner.code = "import time\ntime.sleep(2)";
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in 2/);
    });

    it("should be able to load python packages", async () => {
        papyros.runner.code = "import numpy as np\nprint(np.arange(10))";
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        // Whether the line arrives in one output event or split around the newline
        // depends on how the queue flushes, so compare the trimmed content
        expect((papyros.io.output[0].content as string).trim()).toBe("[0 1 2 3 4 5 6 7 8 9]");
    });

    it("should show lint errors", async () => {
        papyros.runner.code = `
x = 1
y = 2
print
`;
        const diagnostics = await papyros.runner.lintSource();
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].message).toBe("Statement seems to have no effect");
    });

    it("should show syntax errors", async () => {
        papyros.runner.code = `print 'hello'
`;
        const diagnostics = await papyros.runner.lintSource();
        expect(diagnostics.length).toBe(1);
        expect(diagnostics[0].message).toBe("Missing parentheses in call to 'print'. Did you mean print(...)?");
        // The error is reported on the p of print, not after it
        expect(diagnostics[0].columnNr).toBe(0);
    });

    it("should report style issues as info", async () => {
        papyros.runner.code = `def foo():
    return 1
`;
        const diagnostics = await papyros.runner.lintSource();
        expect(diagnostics.length).toBe(1);
        expect(diagnostics[0].severity).toBe("info");
    });

    it("should run doctests", async () => {
        papyros.runner.code = `"""
>>> 1 + 1
2
"""`;
        await papyros.runner.start(RunMode.Doctest);
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.runner.state).toBe(RunState.Ready);
        expect(papyros.runner.stateMessage).toMatch(/^Code executed in /);
        expect(papyros.io.output[0].content).toBe("Trying:\n");
        expect(papyros.io.output[1].content).toBe("    1 + 1\n");
        expect(papyros.io.output[2].content).toBe("Expecting:\n");
        expect(papyros.io.output[3].content).toBe("    2\n");
        expect(papyros.io.output[4].content).toBe("ok\n");
    });

    it("can work with provided files in python", async () => {
        await papyros.runner.provideFiles({"test.txt": "Hello from file!"}, {"readme.md": "https://raw.githubusercontent.com/dodona-edu/papyros/refs/heads/main/README.md"});
        papyros.runner.code = `
with open("test.txt", "r") as f:
    print(f.read())
with open("readme.md", "r") as g:
    print(g.readline())
`;
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        expect(papyros.io.output[0].content).toBe("Hello from file!\n");
        expect(papyros.io.output[1].content).toBe("# Papyros\n");
    });
});
