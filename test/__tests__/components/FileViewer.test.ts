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
});
