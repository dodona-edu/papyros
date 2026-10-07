import {describe, expect, it} from "vitest";
import {Papyros} from "../../../src/frontend/state/Papyros";
import type {CodeRunner} from "../../../src/frontend/components/CodeRunner";
import "../../../src/frontend/components/CodeRunner";

describe("CodeRunner", () => {
    it("reflects backend readiness on the host", async () => {
        const element = document.createElement("p-code-runner") as CodeRunner;
        element.papyros = new Papyros();
        document.body.append(element);

        await element.updateComplete;
        expect(element.hasAttribute("backend-ready")).toBe(false);

        element.papyros.runner.backendReady = true;
        await element.updateComplete;
        expect(element.hasAttribute("backend-ready")).toBe(true);

        element.remove();
    });

    it("keeps the drop zone working after being moved in the page", async () => {
        const element = document.createElement("p-code-runner") as CodeRunner;
        element.papyros = new Papyros();
        document.body.append(element);
        await element.updateComplete;

        element.remove();
        document.body.append(element);
        await element.updateComplete;

        const dropZone = element.shadowRoot!.querySelector<HTMLElement>(".drop-zone")!;
        dropZone.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, composed: true }));
        await element.updateComplete;
        expect(dropZone.classList.contains("drag-over")).toBe(true);

        dropZone.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, composed: true }));
        await element.updateComplete;
        expect(dropZone.classList.contains("drag-over")).toBe(false);

        element.remove();
    });
});
