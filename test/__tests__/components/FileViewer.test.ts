import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { FileEntry } from "../../../src/frontend/state/InputOutput";
import type { FileViewer } from "../../../src/frontend/components/FileViewer";
import type { FileEditor } from "../../../src/frontend/components/code_mirror/FileEditor";
import "../../../src/frontend/components/FileViewer";

describe("FileViewer", () => {
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

    it("highlights Python keywords in a .py file", async () => {
        const element = await renderFile({ name: "main.py", content: "def f():\n    pass", binary: false });

        await vi.waitFor(() => {
            expect(highlightSpans(element).some((span) => span.textContent === "def")).toBe(true);
        });

        element.remove();
    });

    it("picks up highlighting when a reused element's file is renamed to .py", async () => {
        const element = await renderFile({ name: "notes.txt", content: "def f():\n    pass", binary: false });
        expect(highlightSpans(element)).toHaveLength(0);

        element.file = { name: "notes.py", content: "def f():\n    pass", binary: false };
        await element.updateComplete;

        await vi.waitFor(() => {
            expect(highlightSpans(element).some((span) => span.textContent === "def")).toBe(true);
        });

        element.remove();
    });
});
