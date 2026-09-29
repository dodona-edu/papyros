import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { FileEntry } from "../../../src/frontend/state/InputOutput";
import type { EditorTabs } from "../../../src/frontend/components/EditorTabs";
import type { EditorTab } from "../../../src/frontend/components/EditorTab";
import type { FileViewer } from "../../../src/frontend/components/FileViewer";
import "../../../src/frontend/components/EditorTabs";
import "../../../src/frontend/components/FileViewer";

const files: FileEntry[] = [{ name: "grades.txt", content: "18", binary: false }];
const mounted: HTMLElement[] = [];

afterEach(() => {
    for (const el of mounted.splice(0)) {
        el.remove();
    }
});

async function mountTabs(readonly: boolean): Promise<EditorTabs> {
    const el = document.createElement("p-editor-tabs") as EditorTabs;
    el.papyros = new Papyros();
    el.files = files;
    el.readonly = readonly;
    document.body.append(el);
    mounted.push(el);
    await el.updateComplete;
    const tab = el.shadowRoot!.querySelector<EditorTab>("p-editor-tab")!;
    await tab.updateComplete;
    return el;
}

function contentOf(viewer: FileViewer): Element | null {
    return viewer.shadowRoot!.querySelector("p-file-editor")?.shadowRoot?.querySelector(".cm-content") ?? null;
}

async function mountViewer(file: FileEntry, options: { readonly?: boolean; url?: string } = {}): Promise<FileViewer> {
    const el = document.createElement("p-file-viewer") as FileViewer;
    el.papyros = new Papyros();
    el.file = file;
    el.readonly = options.readonly ?? false;
    el.url = options.url;
    document.body.append(el);
    mounted.push(el);
    await el.updateComplete;
    return el;
}

describe("p-editor-tabs readonly", () => {
    it("offers add, rename and close by default", async () => {
        const el = await mountTabs(false);
        const tab = el.shadowRoot!.querySelector<EditorTab>("p-editor-tab")!;

        expect(el.shadowRoot!.querySelector("p-add-file-button")).not.toBeNull();
        expect(tab.shadowRoot!.querySelector(".rename-btn")).not.toBeNull();
        expect(tab.shadowRoot!.querySelector(".close-btn")).not.toBeNull();
    });

    it("hides the add button and gives the tabs no rename or close", async () => {
        const el = await mountTabs(true);
        const tab = el.shadowRoot!.querySelector<EditorTab>("p-editor-tab")!;

        expect(el.shadowRoot!.querySelector("p-add-file-button")).toBeNull();
        expect(tab.shadowRoot!.querySelector(".rename-btn")).toBeNull();
        expect(tab.shadowRoot!.querySelector(".close-btn")).toBeNull();
        expect(tab.shadowRoot!.querySelector("[aria-describedby]")).toBeNull();
    });

    it("does not rename on double click, F2 or delete on Delete", async () => {
        const el = await mountTabs(true);
        const tab = el.shadowRoot!.querySelector<EditorTab>("p-editor-tab")!;
        const button = tab.shadowRoot!.querySelector<HTMLButtonElement>("button")!;

        button.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        button.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true }));
        button.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));
        await tab.updateComplete;

        expect(tab.shadowRoot!.querySelector("input")).toBeNull();
        expect(button.isConnected).toBe(true);
    });

    it("still opens the tab on click", async () => {
        const el = await mountTabs(true);
        const tab = el.shadowRoot!.querySelector<EditorTab>("p-editor-tab")!;

        tab.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();

        expect(el.papyros.io.activeEditorTab).toBe("grades.txt");
    });
});

describe("p-file-viewer readonly", () => {
    it("shows the text in a read-only editor", async () => {
        const el = await mountViewer({ name: "a.txt", content: "hello", binary: false }, { readonly: true });
        await vi.waitFor(() => expect(contentOf(el)).not.toBeNull());

        expect(contentOf(el)!.getAttribute("aria-readonly")).toBe("true");
    });

    it("keeps the editor editable by default", async () => {
        const el = await mountViewer({ name: "a.txt", content: "hello", binary: false });
        await vi.waitFor(() => expect(contentOf(el)).not.toBeNull());

        expect(contentOf(el)!.getAttribute("aria-readonly")).not.toBe("true");
    });

    it("links to the file instead of previewing a binary one", async () => {
        const url = "https://files.test/image.png";
        const el = await mountViewer({ name: "image.png", content: "iVBO", binary: true }, { readonly: true, url });
        const link = el.shadowRoot!.querySelector<HTMLAnchorElement>("a.open-link")!;

        expect(el.shadowRoot!.querySelector("p-file-editor")).toBeNull();
        expect(link.href).toBe(url);
        expect(link.target).toBe("_blank");
        expect(link.rel).toBe("noopener");
        expect(el.shadowRoot!.textContent).toContain("image.png");
    });

    it("links to the file instead of previewing text over 100 kB", async () => {
        const url = "https://files.test/big.txt";
        const el = await mountViewer(
            { name: "big.txt", content: "a".repeat(100_001), binary: false },
            { readonly: true, url },
        );

        expect(el.shadowRoot!.querySelector("p-file-editor")).toBeNull();
        expect(el.shadowRoot!.querySelector<HTMLAnchorElement>("a.open-link")!.href).toBe(url);
    });

    it("offers a download button when the file has no URL", async () => {
        const el = await mountViewer({ name: "image.png", content: "iVBO", binary: true }, { readonly: true });

        expect(el.shadowRoot!.querySelector("a.open-link")).toBeNull();
        expect(el.shadowRoot!.querySelector("button")).not.toBeNull();
    });

    it("keeps the download button for binary files when not read-only", async () => {
        const el = await mountViewer({ name: "image.png", content: "iVBO", binary: true }, { url: "https://x.test/a" });

        expect(el.shadowRoot!.querySelector("a.open-link")).toBeNull();
        expect(el.shadowRoot!.querySelector("button")).not.toBeNull();
    });
});
