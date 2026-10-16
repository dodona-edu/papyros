import { afterEach, describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { FileEntry } from "../../../src/frontend/state/InputOutput";
import type { EditorTabs } from "../../../src/frontend/components/EditorTabs";
import type { EditorTab } from "../../../src/frontend/components/EditorTab";
import type { AddFileButton } from "../../../src/frontend/components/AddFileButton";
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

    it("locks the tabs the same way while debugging, and unlocks them after", async () => {
        const el = await mountTabs(false);
        const tab = el.shadowRoot!.querySelector<EditorTab>("p-editor-tab")!;
        const locked = (): boolean[] => [
            el.shadowRoot!.querySelector("p-add-file-button") === null,
            tab.shadowRoot!.querySelector(".rename-btn") === null,
            tab.shadowRoot!.querySelector(".close-btn") === null,
        ];

        el.papyros.debugger.active = true;
        await el.updateComplete;
        await tab.updateComplete;
        expect(locked()).toEqual([true, true, true]);

        el.papyros.debugger.active = false;
        await el.updateComplete;
        await tab.updateComplete;
        expect(locked()).toEqual([false, false, false]);
    });

    it("still opens the tab on click", async () => {
        const el = await mountTabs(true);
        const tab = el.shadowRoot!.querySelector<EditorTab>("p-editor-tab")!;

        tab.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();

        expect(el.papyros.io.activeEditorTab).toBe("grades.txt");
    });
});

function pressEscape(target: HTMLElement): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
}

describe("Escape in the file tabs", () => {
    it("cancels the Escape that ends a rename", async () => {
        const element = document.createElement("p-editor-tab") as EditorTab;
        element.papyros = new Papyros();
        element.file = { name: "data.txt", content: "", binary: false };
        document.body.append(element);
        mounted.push(element);
        await element.updateComplete;

        element.shadowRoot!.querySelector("button")!.dispatchEvent(new MouseEvent("dblclick"));
        await element.updateComplete;
        const input = element.shadowRoot!.querySelector("input")!;

        expect(pressEscape(input).defaultPrevented).toBe(true);
    });

    it("cancels the Escape that ends adding a file", async () => {
        const element = document.createElement("p-add-file-button") as AddFileButton;
        element.papyros = new Papyros();
        document.body.append(element);
        mounted.push(element);
        await element.updateComplete;

        element.shadowRoot!.querySelector("button")!.click();
        await element.updateComplete;
        const input = element.shadowRoot!.querySelector("input")!;

        expect(pressEscape(input).defaultPrevented).toBe(true);
    });
});
