import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { FileEntry } from "../../../src/frontend/state/InputOutput";
import type { FileViewer } from "../../../src/frontend/components/FileViewer";
import type { FileEditor } from "../../../src/frontend/components/code_mirror/FileEditor";
import "../../../src/frontend/components/FileViewer";

// Matches the debounce in FileViewer
const DEBOUNCE_DELAY = 300;

const mounted: HTMLElement[] = [];

afterEach(() => {
    for (const el of mounted.splice(0)) {
        el.remove();
    }
});

async function renderFile(file: FileEntry, options: { readonly?: boolean; url?: string } = {}): Promise<FileViewer> {
    const element = document.createElement("p-file-viewer") as FileViewer;
    element.papyros = new Papyros();
    element.readonly = options.readonly ?? false;
    element.url = options.url;
    element.file = file;
    document.body.append(element);
    mounted.push(element);
    await element.updateComplete;
    await element.shadowRoot!.querySelector<FileEditor>("p-file-editor")?.updateComplete;
    return element;
}

function contentOf(viewer: FileViewer): Element | null {
    return viewer.shadowRoot!.querySelector("p-file-editor")?.shadowRoot?.querySelector(".cm-content") ?? null;
}

describe("FileViewer", () => {
    const content = "def f():\n    pass";

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
            vi.advanceTimersByTime(DEBOUNCE_DELAY);
            element.remove();
            expect(updateFile).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it("does not write when switching between read-only previews", async () => {
        const element = await renderFile({ name: "a.txt", content: "a", binary: false }, { readonly: true });
        element.papyros.io.files = [
            { name: "a.txt", content: "a", binary: false },
            { name: "b.txt", content: "b", binary: false },
        ];
        const updateFile = vi.spyOn(element.papyros.runner, "updateFile").mockResolvedValue();
        const updateFileContent = vi.spyOn(element.papyros.io, "updateFileContent");

        vi.useFakeTimers();
        try {
            element.file = { name: "b.txt", content: "b", binary: false };
            await element.updateComplete;
            vi.advanceTimersByTime(DEBOUNCE_DELAY);
        } finally {
            vi.useRealTimers();
        }

        expect(updateFile).not.toHaveBeenCalled();
        expect(updateFileContent).not.toHaveBeenCalled();
        element.remove();
    });
});

describe("p-file-viewer readonly", () => {
    it("shows the text in a read-only editor", async () => {
        const el = await renderFile({ name: "a.txt", content: "hello", binary: false }, { readonly: true });
        await vi.waitFor(() => expect(contentOf(el)).not.toBeNull());

        expect(contentOf(el)!.getAttribute("aria-readonly")).toBe("true");
    });

    it("keeps the editor editable by default", async () => {
        const el = await renderFile({ name: "a.txt", content: "hello", binary: false });
        await vi.waitFor(() => expect(contentOf(el)).not.toBeNull());

        expect(contentOf(el)!.getAttribute("aria-readonly")).not.toBe("true");
    });

    it("links to the file instead of previewing a binary one", async () => {
        const url = "https://files.test/image.png";
        const el = await renderFile({ name: "image.png", content: "iVBO", binary: true }, { readonly: true, url });
        const link = el.shadowRoot!.querySelector<HTMLAnchorElement>("a.open-link")!;

        expect(el.shadowRoot!.querySelector("p-file-editor")).toBeNull();
        expect(link.href).toBe(url);
        expect(link.target).toBe("_blank");
        expect(link.rel).toBe("noopener");
        expect(el.shadowRoot!.textContent).toContain("image.png");
    });

    it("links to the file instead of previewing text over 100 kB", async () => {
        const url = "https://files.test/big.txt";
        const el = await renderFile(
            { name: "big.txt", content: "a".repeat(100_001), binary: false },
            { readonly: true, url },
        );

        expect(el.shadowRoot!.querySelector("p-file-editor")).toBeNull();
        expect(el.shadowRoot!.querySelector<HTMLAnchorElement>("a.open-link")!.href).toBe(url);
    });

    it("offers a download button when the file has no URL", async () => {
        const el = await renderFile({ name: "image.png", content: "iVBO", binary: true }, { readonly: true });

        expect(el.shadowRoot!.querySelector("a.open-link")).toBeNull();
        expect(el.shadowRoot!.querySelector("button")).not.toBeNull();
    });

    it("keeps the download button for binary files when not read-only", async () => {
        const el = await renderFile({ name: "image.png", content: "iVBO", binary: true }, { url: "https://x.test/a" });

        expect(el.shadowRoot!.querySelector("a.open-link")).toBeNull();
        expect(el.shadowRoot!.querySelector("button")).not.toBeNull();
    });
});
