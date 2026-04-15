import { Papyros } from "../../../src/frontend/state/Papyros";
import { expect, it, describe } from "vitest";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { waitForFiles, waitForPapyrosReady, waitForInputReady, waitForOutput, waitForAwaitingInput } from "../../helpers";
import { isValidFileName } from "../../../src/util/Util";

describe("isValidFileName", () => {
    it.each(["../escape", "/absolute", "trailing/", "a//b", ".", "a/./b", "a/../b", ""])
        ("rejects invalid name: %s", (name) => {
            expect(isValidFileName(name)).toBe(false);
        });

    it.each(["file.py", "subdir/file.py", "a/b/c/file.py", ".gitignore", "file name.txt"])
        ("accepts valid name: %s", (name) => {
            expect(isValidFileName(name)).toBe(true);
        });
});

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

    it("files from previous run persist while awaiting input in next run", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `open("persist.txt", "w").write("hello")`;
        await waitForInputReady();
        await papyros.runner.start();
        await waitForFiles(papyros, 1);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("persist.txt");

        papyros.runner.code = `x = input("name?")`;
        await waitForPapyrosReady(papyros);
        void papyros.runner.start();
        await waitForAwaitingInput(papyros);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("persist.txt");

        papyros.io.provideInput("test");
        await waitForPapyrosReady(papyros);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("persist.txt");
    });

    it("files from previous run are cleared when next run deletes them", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `open("temp.txt", "w").write("hello")`;
        await waitForInputReady();
        await papyros.runner.start();
        await waitForFiles(papyros, 1);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("temp.txt");

        papyros.runner.code = `import os; os.remove("temp.txt")`;
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        expect(papyros.io.files.length).toBe(0);
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

    it("addFile accepts names with subdirectory paths", () => {
        const papyros = new Papyros();

        const result = papyros.io.addFile("subdir/file.py");

        expect(result).toBe(true);
        expect(papyros.io.files.length).toBe(1);
        expect(papyros.io.files[0].name).toBe("subdir/file.py");
    });

    it("addFile rejects path traversal names", () => {
        const papyros = new Papyros();

        expect(papyros.io.addFile("../escape.txt")).toBe(false);
        expect(papyros.io.addFile("/absolute.txt")).toBe(false);
        expect(papyros.io.addFile("a/../b.txt")).toBe(false);
        expect(papyros.io.files.length).toBe(0);
    });

    it("renameFile accepts subdirectory paths as new name", () => {
        const papyros = new Papyros();
        papyros.io.addFile("flat.txt", "content");

        const result = papyros.io.renameFile("flat.txt", "subdir/flat.txt");

        expect(result).toBe(true);
        expect(papyros.io.files[0].name).toBe("subdir/flat.txt");
    });

    it("renameFile rejects path traversal as new name", () => {
        const papyros = new Papyros();
        papyros.io.addFile("file.txt", "content");

        expect(papyros.io.renameFile("file.txt", "../escape.txt")).toBe(false);
        expect(papyros.io.files[0].name).toBe("file.txt");
    });

    it("runner.updateFile creates intermediate directories in backend", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await waitForInputReady();

        papyros.io.addFile("subdir/new.txt");
        await papyros.runner.updateFile("subdir/new.txt", "subdir content", false);

        papyros.runner.code = `
with open("subdir/new.txt", "r") as f:
    print(f.read(), end="")
`;
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("subdir content");
    });

    it("runner.renameFile into subdirectory works in backend", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await waitForInputReady();
        await papyros.runner.provideFiles({ "flat.txt": "moved content" }, {});
        await waitForFiles(papyros, 1);

        papyros.io.renameFile("flat.txt", "subdir/flat.txt");
        await papyros.runner.renameFile("flat.txt", "subdir/flat.txt");

        papyros.runner.code = `
with open("subdir/flat.txt", "r") as f:
    print(f.read(), end="")
`;
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("moved content");
    });

    it("runner.renameFile cleans up empty source directory", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        await waitForInputReady();
        await papyros.runner.provideFiles({ "subdir/file.txt": "content" }, {});
        await waitForFiles(papyros, 1);

        papyros.io.renameFile("subdir/file.txt", "file.txt");
        await papyros.runner.renameFile("subdir/file.txt", "file.txt");

        papyros.runner.code = `
import os
print(os.path.exists("subdir"), end="")
`;
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("False");
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
