import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import type { AddFileButton } from "../../../src/frontend/components/AddFileButton";
import type { EditorTab } from "../../../src/frontend/components/EditorTab";
import "../../../src/frontend/components/AddFileButton";
import "../../../src/frontend/components/EditorTab";

function pressEscape(target: HTMLElement): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
}

describe("File tabs", () => {
    it("cancels the Escape that ends a rename", async () => {
        const element = document.createElement("p-editor-tab") as EditorTab;
        element.papyros = new Papyros();
        element.file = { name: "data.txt", content: "", binary: false };
        document.body.append(element);
        await element.updateComplete;

        element.shadowRoot!.querySelector("button")!.dispatchEvent(new MouseEvent("dblclick"));
        await element.updateComplete;
        const input = element.shadowRoot!.querySelector("input")!;

        expect(pressEscape(input).defaultPrevented).toBe(true);
        element.remove();
    });

    it("cancels the Escape that ends adding a file", async () => {
        const element = document.createElement("p-add-file-button") as AddFileButton;
        element.papyros = new Papyros();
        document.body.append(element);
        await element.updateComplete;

        element.shadowRoot!.querySelector("button")!.click();
        await element.updateComplete;
        const input = element.shadowRoot!.querySelector("input")!;

        expect(pressEscape(input).defaultPrevented).toBe(true);
        element.remove();
    });
});
