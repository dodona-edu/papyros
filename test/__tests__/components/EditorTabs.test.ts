import { afterEach, describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { FileEntry } from "../../../src/frontend/state/InputOutput";
import type { EditorTabs } from "../../../src/frontend/components/EditorTabs";
import type { EditorTab } from "../../../src/frontend/components/EditorTab";
import "../../../src/frontend/components/EditorTabs";

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
