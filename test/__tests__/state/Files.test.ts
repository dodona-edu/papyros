import { Papyros } from "../../../src/frontend/state/Papyros";
import { expect, it, describe } from "vitest";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { waitForFiles, waitForPapyrosReady } from "../../helpers";
import { waitForInputReady } from "../../helpers";

describe.sequential("Files", () => {
    it("writing a single file emits it", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `open("test.txt", "w").write("hello")`;
        await waitForInputReady();
        await papyros.runner.start();
        await waitForFiles(papyros, 1);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("test.txt");
        expect(papyros.io.files[0].content).toBe("hello");
        expect(papyros.io.files[0].binary).toBe(false);
    });

    it("writing multiple files emits all of them", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `
open("a.txt", "w").write("aaa")
open("b.txt", "w").write("bbb")
`;
        await waitForInputReady();
        await papyros.runner.start();
        await waitForFiles(papyros, 2);
        expect(papyros.io.files.length).toBe(2);
        const names = papyros.io.files.map((f) => f.name).sort();
        expect(names).toEqual(["a.txt", "b.txt"]);
    });

    it("no files written means empty files list", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `print("hello")`;
        await waitForInputReady();
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        expect(papyros.io.files.length).toBe(0);
    });

    it("file written before crash still appears", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `
open("crash_test.txt", "w").write("before crash")
raise ValueError("intentional error")
`;
        await waitForInputReady();
        await papyros.runner.start();
        await waitForFiles(papyros, 1);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("crash_test.txt");
        expect(papyros.io.files[0].content).toBe("before crash");
    });
});
