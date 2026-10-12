import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunMode } from "../../../src/backend/Backend";
import { CODE_TAB, HOST_TAB } from "../../../src/frontend/state/InputOutput";
import type { CodeRunner } from "../../../src/frontend/components/CodeRunner";
import type { EditorTabs } from "../../../src/frontend/components/EditorTabs";
import "../../../src/frontend/components/CodeRunner";

async function mountRunner(hostTab: boolean): Promise<CodeRunner> {
    const element = document.createElement("p-code-runner") as CodeRunner;
    element.papyros = new Papyros();
    if (hostTab) {
        element.innerHTML = `<span slot="host-tab">Test #1</span><p slot="host-tab-panel">Expected output</p>`;
    }
    document.body.append(element);
    await settle(element);
    return element;
}

// The slotchange that shows or hides the host tab arrives after the render that placed the slot.
async function settle(element: CodeRunner): Promise<void> {
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve));
    await element.updateComplete;
    await tabs(element).updateComplete;
}

function tabs(element: CodeRunner): EditorTabs {
    return element.shadowRoot!.querySelector("p-editor-tabs") as EditorTabs;
}

function hostTabButton(element: CodeRunner): HTMLButtonElement | null {
    return tabs(element).shadowRoot!.querySelector("#host-tab");
}

function pressKey(target: HTMLElement, key: string): void {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true }));
}

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

    it("has no host tab while the host-tab slot is empty", async () => {
        const element = await mountRunner(false);
        expect(hostTabButton(element)).toBeNull();
        element.remove();
    });

    it("shows the host's panel when its tab is selected", async () => {
        const element = await mountRunner(true);
        const button = hostTabButton(element)!;
        expect(button.getAttribute("aria-selected")).toBe("false");

        button.click();
        await settle(element);

        expect(element.papyros.io.activeEditorTab).toBe(HOST_TAB);
        expect(button.getAttribute("aria-selected")).toBe("true");
        expect(button.tabIndex).toBe(0);
        const panel = element.shadowRoot!.querySelector(".editor")!;
        expect(panel.getAttribute("aria-label")).toBe("Test #1");
        const slot = panel.querySelector<HTMLSlotElement>("slot[name=host-tab-panel]")!;
        expect(slot.assignedElements()[0].textContent).toBe("Expected output");

        element.remove();
    });

    it("moves focus between the file tabs and the host tab with the arrow keys", async () => {
        const element = await mountRunner(true);
        const tabsRoot = tabs(element).shadowRoot!;
        const codeTab = tabsRoot.querySelector<HTMLButtonElement>("[role=tab]")!;

        codeTab.focus();
        pressKey(codeTab, "ArrowRight");
        expect(tabsRoot.activeElement).toBe(hostTabButton(element));

        pressKey(hostTabButton(element)!, "ArrowRight");
        expect(tabsRoot.activeElement).toBe(codeTab);

        element.remove();
    });

    it("falls back to the code tab when the host removes its tab while it is open", async () => {
        const element = await mountRunner(true);
        element.papyros.io.activeEditorTab = HOST_TAB;
        element.querySelector("[slot=host-tab]")!.remove();
        await settle(element);

        expect(element.papyros.io.activeEditorTab).toBe(CODE_TAB);
        expect(hostTabButton(element)).toBeNull();

        element.remove();
    });

    it("shows the code until the host adds the tab it was asked to open", async () => {
        const element = await mountRunner(false);
        element.papyros.io.activeEditorTab = HOST_TAB;
        await settle(element);

        const panel = element.shadowRoot!.querySelector(".editor")!;
        expect(panel.querySelector("p-code")).not.toBeNull();
        expect(panel.getAttribute("aria-label")).toBe("Code");
        const codeTab = tabs(element).shadowRoot!.querySelector<HTMLButtonElement>("[role=tab]")!;
        expect(codeTab.getAttribute("aria-selected")).toBe("true");
        expect(codeTab.tabIndex).toBe(0);

        element.insertAdjacentHTML("beforeend", `<span slot="host-tab">Test #1</span>`);
        await settle(element);
        expect(element.papyros.io.activeEditorTab).toBe(HOST_TAB);
        expect(hostTabButton(element)!.getAttribute("aria-selected")).toBe("true");
        expect(panel.getAttribute("aria-label")).toBe("Test #1");

        element.remove();
    });

    it("opens files named like the code and host tabs as files", async () => {
        const element = await mountRunner(true);
        for (const name of ["code", "host-tab"]) {
            element.papyros.io.addFile(name, "hello");
            await settle(element);
            const panel = element.shadowRoot!.querySelector(".editor")!;
            expect(panel.querySelector("p-file-viewer")).not.toBeNull();
            expect(panel.getAttribute("aria-label")).toBe(name);
        }
        element.remove();
    });
    it("renames the open host panel when the host changes or replaces the tab label", async () => {
        const element = await mountRunner(true);
        element.papyros.io.activeEditorTab = HOST_TAB;
        await settle(element);
        const panel = element.shadowRoot!.querySelector(".editor")!;

        element.querySelector("[slot=host-tab]")!.textContent = "Test #2";
        await settle(element);
        expect(panel.getAttribute("aria-label")).toBe("Test #2");

        element.querySelector("[slot=host-tab]")!.outerHTML = `<span slot="host-tab">Test #3</span>`;
        await settle(element);
        expect(panel.getAttribute("aria-label")).toBe("Test #3");

        element.remove();
    });

    it("makes its tab bar as tall as the run buttons without changing other tab bars", async () => {
        const element = await mountRunner(false);
        expect(tabs(element).getBoundingClientRect().height).toBe(44);

        const standalone = document.createElement("p-editor-tabs") as EditorTabs;
        standalone.papyros = new Papyros();
        document.body.append(standalone);
        await standalone.updateComplete;
        expect(standalone.getBoundingClientRect().height).toBe(36);

        standalone.remove();
        element.remove();
    });

    it("shows the run buttons as named icon buttons in a narrow column", async () => {
        const element = await mountRunner(false);
        element.style.width = "400px";
        const lint = element.shadowRoot!.querySelector("p-button-lint")!;
        const shown = Array.from(lint.shadowRoot!.querySelectorAll<HTMLElement>(".buttons > *")).filter(
            (b) => b.getClientRects().length > 0,
        );
        expect(shown.map((b) => b.localName)).toEqual(["md-filled-icon-button", "md-outlined-icon-button"]);
        expect(shown.map((b) => b.getAttribute("aria-label"))).toEqual(["Run", "Debug"]);
        expect(shown.map((b) => b.title)).toEqual(["Run", "Debug"]);
        element.remove();
    });

    it("gives each run mode its own icon in a narrow column", async () => {
        const element = await mountRunner(false);
        element.papyros.runner.runModes = [RunMode.Debug, RunMode.Doctest];
        element.style.width = "400px";
        const lint = element.shadowRoot!.querySelector("p-button-lint")!;
        await (lint as unknown as { updateComplete: Promise<unknown> }).updateComplete;
        const shown = Array.from(lint.shadowRoot!.querySelectorAll<HTMLElement>(".buttons > *")).filter(
            (b) => b.getClientRects().length > 0,
        );
        expect(shown.map((b) => b.title)).toEqual(["Run", "Debug", "Run doctests"]);
        const icons = shown.map((b) => b.querySelector("path")!.getAttribute("d"));
        expect(new Set(icons).size).toBe(icons.length);
        element.remove();
    });
});
