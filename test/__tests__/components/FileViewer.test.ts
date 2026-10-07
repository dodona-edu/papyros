import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { FileEntry } from "../../../src/frontend/state/InputOutput";
import type { FileViewer } from "../../../src/frontend/components/FileViewer";
import type { FileEditor } from "../../../src/frontend/components/code_mirror/FileEditor";
import "../../../src/frontend/components/FileViewer";

describe("FileViewer", () => {
    const content = "def f():\n    pass";

    async function renderFile(file: FileEntry): Promise<FileViewer> {
        const element = document.createElement("p-file-viewer") as FileViewer;
        element.papyros = new Papyros();
        element.file = file;
        document.body.append(element);
        await element.updateComplete;
        const editor = element.shadowRoot!.querySelector("p-file-editor") as FileEditor;
        await editor.updateComplete;
        return element;
    }

    function highlightSpans(element: FileViewer): Element[] {
        const editorRoot = element.shadowRoot!.querySelector("p-file-editor")!.shadowRoot!;
        return [...editorRoot.querySelectorAll(".cm-line")].flatMap((line) => [...line.querySelectorAll("span")]);
    }

    it.each([
        { name: "main.py", source: content, keyword: "def" },
        { name: "main.js", source: "function f() {}", keyword: "function" },
    ])("highlights keywords in $name", async ({ name, source, keyword }) => {
        const element = await renderFile({ name, content: source, binary: false });

        await vi.waitFor(() => {
            expect(highlightSpans(element).some((span) => span.textContent === keyword)).toBe(true);
        });

        element.remove();
    });

    it("picks up highlighting when a reused element's file is renamed to .py", async () => {
        const element = await renderFile({ name: "notes.txt", content, binary: false });
        expect(highlightSpans(element)).toHaveLength(0);

        element.file = { name: "notes.py", content, binary: false };
        await element.updateComplete;

        await vi.waitFor(() => {
            expect(highlightSpans(element).some((span) => span.textContent === "def")).toBe(true);
        });

        element.remove();
    });

    it("writes a pending edit to the backend when it switches to another file", async () => {
        const element = await renderFile({ name: "a.txt", content: "a", binary: false });
        element.papyros.io.files = [{ name: "a.txt", content: "a", binary: false }];
        const updateFile = vi.spyOn(element.papyros.runner, "updateFile").mockResolvedValue();
        const editor = element.shadowRoot!.querySelector("p-file-editor")!;

        editor.dispatchEvent(new CustomEvent("change", { detail: "a edited" }));
        element.file = { name: "a.txt", content: "a edited", binary: false };
        await element.updateComplete;
        expect(updateFile).not.toHaveBeenCalled();

        element.file = { name: "b.txt", content: "b", binary: false };
        await element.updateComplete;
        expect(updateFile).toHaveBeenCalledExactlyOnceWith("a.txt", "a edited", false);

        element.remove();
    });

    it("does not write a pending edit of a file that is closed before it is written", async () => {
        const element = await renderFile({ name: "a.txt", content: "a", binary: false });
        element.papyros.io.files = [{ name: "a.txt", content: "a", binary: false }];
        const updateFile = vi.spyOn(element.papyros.runner, "updateFile").mockResolvedValue();
        const editor = element.shadowRoot!.querySelector("p-file-editor")!;
        vi.useFakeTimers();
        try {
            editor.dispatchEvent(new CustomEvent("change", { detail: "a edited" }));
            element.papyros.io.removeFile("a.txt");
            vi.advanceTimersByTime(300);
            element.remove();
            expect(updateFile).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });
});
