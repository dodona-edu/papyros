import { Papyros } from "../../../src/frontend/state/Papyros";
import { expect, it, describe } from "vitest";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { waitForFiles, waitForPapyrosReady, waitForInputReady, waitForOutput } from "../../helpers";

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

    it("writing a file in a subdirectory emits it with relative path", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `
import os
os.makedirs("subdir", exist_ok=True)
open("subdir/nested.txt", "w").write("nested content")
`;
        await waitForInputReady();
        await papyros.runner.start();
        await waitForFiles(papyros, 1);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("subdir/nested.txt");
        expect(papyros.io.files[0].content).toBe("nested content");
        expect(papyros.io.files[0].binary).toBe(false);
    });

    it("provided inline files appear before code execution", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await waitForInputReady();
        await papyros.runner.provideFiles({ "provided.txt": "provided content" }, {});
        await waitForFiles(papyros, 1);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("provided.txt");
        expect(papyros.io.files[0].content).toBe("provided content");
        expect(papyros.io.files[0].binary).toBe(false);
    });

    it("multiple provided inline files all appear before code execution", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await waitForInputReady();
        await papyros.runner.provideFiles({ "a.txt": "aaa", "b.txt": "bbb" }, {});
        await waitForFiles(papyros, 2);
        expect(papyros.io.files.length).toBe(2);
        const names = papyros.io.files.map((f) => f.name).sort();
        expect(names).toEqual(["a.txt", "b.txt"]);
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

    it("updateFileContent updates the in-memory content of an existing file", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await waitForInputReady();
        await papyros.runner.provideFiles({ "editable.txt": "original content" }, {});
        await waitForFiles(papyros, 1);

        papyros.io.updateFileContent("editable.txt", "updated content", false);

        expect(papyros.io.files[0].content).toBe("updated content");
    });

    it("runner.updateFile updates the file content in the backend", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await waitForInputReady();
        await papyros.runner.provideFiles({ "editable.txt": "original content" }, {});
        await waitForFiles(papyros, 1);

        await papyros.runner.updateFile("editable.txt", "updated content", false);

        papyros.runner.code = `
with open("editable.txt", "r") as f:
    print(f.read(), end="")
`;
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("updated content");
    });

    it("renameFile updates the file name in the files list", () => {
        const papyros = new Papyros();
        papyros.io.addFile("old.txt", "hello content");

        const result = papyros.io.renameFile("old.txt", "new.txt");

        expect(result).toBe(true);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("new.txt");
        expect(papyros.io.files[0].content).toBe("hello content");
    });

    it("renameFile updates activeEditorTab when renaming the active file", () => {
        const papyros = new Papyros();
        papyros.io.addFile("old.txt", "");
        expect(papyros.io.activeEditorTab).toBe("old.txt");

        papyros.io.renameFile("old.txt", "new.txt");

        expect(papyros.io.activeEditorTab).toBe("new.txt");
    });

    it("renameFile does not update activeEditorTab when renaming a non-active file", () => {
        const papyros = new Papyros();
        papyros.io.addFile("a.txt", "");
        papyros.io.addFile("b.txt", "");
        papyros.io.activeEditorTab = "b.txt";

        papyros.io.renameFile("a.txt", "renamed.txt");

        expect(papyros.io.activeEditorTab).toBe("b.txt");
    });

    it("renameFile returns false for empty new name", () => {
        const papyros = new Papyros();
        papyros.io.addFile("old.txt", "content");

        const result = papyros.io.renameFile("old.txt", "");

        expect(result).toBe(false);
        expect(papyros.io.files[0].name).toBe("old.txt");
    });

    it("renameFile returns false when new name equals old name", () => {
        const papyros = new Papyros();
        papyros.io.addFile("same.txt", "content");

        const result = papyros.io.renameFile("same.txt", "same.txt");

        expect(result).toBe(false);
    });

    it("renameFile returns false when oldName does not exist", () => {
        const papyros = new Papyros();
        papyros.io.addFile("existing.txt", "content");

        const result = papyros.io.renameFile("nonexistent.txt", "other.txt");

        expect(result).toBe(false);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("existing.txt");
    });

    it("renameFile returns false when new name conflicts with existing file", () => {
        const papyros = new Papyros();
        papyros.io.addFile("a.txt", "aaa");
        papyros.io.addFile("b.txt", "bbb");

        const result = papyros.io.renameFile("a.txt", "b.txt");

        expect(result).toBe(false);
        expect(papyros.io.files.map((f) => f.name).sort()).toEqual(["a.txt", "b.txt"]);
    });

    it("runner.renameFile renames the file in the backend", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await waitForInputReady();
        await papyros.runner.provideFiles({ "old.txt": "renamed content" }, {});
        await waitForFiles(papyros, 1);

        papyros.io.renameFile("old.txt", "new.txt");
        await papyros.runner.renameFile("old.txt", "new.txt");

        papyros.runner.code = `
with open("new.txt", "r") as f:
    print(f.read(), end="")
`;
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("renamed content");
    });
});
