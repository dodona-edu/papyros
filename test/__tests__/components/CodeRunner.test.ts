import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { undo } from "@codemirror/commands";
import type { EditorView } from "@codemirror/view";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunMode } from "../../../src/backend/Backend";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { launchPapyros, settlePapyros, waitForPapyrosReady, wipeWorkspace } from "../../helpers";
import { BackendEvent, BackendEventType } from "../../../src/communication/BackendEvent";
import { CODE_TAB, EditorTabId, HOST_TAB } from "../../../src/frontend/state/InputOutput";
import type { CodeRunner } from "../../../src/frontend/components/CodeRunner";
import type { EditorTabs } from "../../../src/frontend/components/EditorTabs";
import type { FileViewer } from "../../../src/frontend/components/FileViewer";
import type { ButtonLint } from "../../../src/frontend/components/code_runner/ButtonLint";
import "../../../src/frontend/components/CodeRunner";

async function mountRunner(hostTab: boolean, code = ""): Promise<CodeRunner> {
    const element = document.createElement("p-code-runner") as CodeRunner;
    element.papyros = new Papyros();
    element.papyros.runner.code = code;
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

function buttons(element: CodeRunner): ButtonLint {
    return element.shadowRoot!.querySelector("p-button-lint") as ButtonLint;
}

function shownButtons(element: CodeRunner): HTMLElement[] {
    return Array.from(buttons(element).shadowRoot!.querySelectorAll<HTMLElement>(".buttons > *")).filter((b) =>
        b.checkVisibility({ visibilityProperty: true }),
    );
}

// The compact choice follows ResizeObserver callbacks, which run between frames.
async function frames(): Promise<void> {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
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
        const shown = Array.from(lint.shadowRoot!.querySelectorAll<HTMLElement>(".buttons > *")).filter((b) =>
            b.checkVisibility({ visibilityProperty: true }),
        );
        expect(shown.map((b) => b.localName)).toEqual(["md-filled-icon-button", "md-outlined-icon-button"]);
        expect(shown.map((b) => b.getAttribute("aria-label"))).toEqual(["Run", "Debug"]);
        expect(shown.map((b) => b.title)).toEqual(["Run", "Debug"]);
        element.remove();
    });

    it("keeps the run buttons labelled while they fit next to the tabs", async () => {
        const element = await mountRunner(false);
        element.style.width = "600px";
        await frames();
        expect(shownButtons(element).map((b) => b.localName)).toEqual(["md-filled-button", "md-outlined-button"]);
        element.remove();
    });

    it("shows icon run buttons when a wide slotted button would wrap the bar", async () => {
        const element = await mountRunner(false);
        element.insertAdjacentHTML(
            "beforeend",
            `<button slot="buttons" style="width: 300px; height: 32px">Copy to hand-in</button>`,
        );
        element.style.width = "600px";
        await frames();
        expect(shownButtons(element).map((b) => b.localName)).toEqual([
            "md-filled-icon-button",
            "md-outlined-icon-button",
        ]);
        expect(buttons(element).getBoundingClientRect().top).toBe(tabs(element).getBoundingClientRect().top);
        element.remove();
    });

    it("compacts the slotted buttons only after the run buttons, when they still do not fit", async () => {
        const style = document.createElement("style");
        style.textContent = `.copy { width: 150px; height: 32px; } p-code-runner[compact-slotted] .copy { width: 32px; }`;
        document.head.append(style);
        const element = await mountRunner(false);
        element.insertAdjacentHTML("beforeend", `<button class="copy" slot="buttons">Copy to hand-in</button>`);
        element.style.width = "400px";
        await frames();
        expect(shownButtons(element).map((b) => b.localName)).toEqual([
            "md-filled-icon-button",
            "md-outlined-icon-button",
        ]);
        expect(element.hasAttribute("compact-slotted")).toBe(false);

        element.style.width = "300px";
        await frames();
        expect(element.hasAttribute("compact-slotted")).toBe(true);
        expect(buttons(element).getBoundingClientRect().top).toBe(tabs(element).getBoundingClientRect().top);

        element.style.width = "400px";
        await frames();
        expect(element.hasAttribute("compact-slotted")).toBe(false);
        element.remove();
        style.remove();
    });

    it("labels Stop debugging in a narrow column where Run and Debug are icons", async () => {
        const element = await mountRunner(false);
        element.insertAdjacentHTML(
            "beforeend",
            `<button slot="buttons" style="width: 150px; height: 32px">Copy to hand-in</button>`,
        );
        element.style.width = "446px";
        await frames();
        expect(shownButtons(element).map((b) => b.localName)).toEqual([
            "md-filled-icon-button",
            "md-outlined-icon-button",
        ]);

        element.papyros.debugger.active = true;
        await frames();
        expect(shownButtons(element).map((b) => b.localName)).toEqual(["md-outlined-button"]);

        element.papyros.debugger.active = false;
        await frames();
        expect(shownButtons(element).map((b) => b.localName)).toEqual([
            "md-filled-icon-button",
            "md-outlined-icon-button",
        ]);
        element.remove();
    });

    it("keeps the run buttons labelled on their own row when icons would not fit either", async () => {
        const element = await mountRunner(false);
        for (let i = 0; i < 8; i++) element.papyros.io.addFile(`data_file_${i}.txt`, "hello");
        element.style.width = "600px";
        await settle(element);
        await frames();
        expect(shownButtons(element).map((b) => b.localName)).toEqual(["md-filled-button", "md-outlined-button"]);
        expect(buttons(element).getBoundingClientRect().top).toBeGreaterThan(tabs(element).getBoundingClientRect().top);
        element.remove();
    });

    it("gives each run mode its own icon in a narrow column", async () => {
        const element = await mountRunner(false);
        element.papyros.runner.runModes = [RunMode.Debug, RunMode.Doctest];
        element.style.width = "400px";
        const lint = element.shadowRoot!.querySelector("p-button-lint")!;
        await (lint as unknown as { updateComplete: Promise<unknown> }).updateComplete;
        const shown = Array.from(lint.shadowRoot!.querySelectorAll<HTMLElement>(".buttons > *")).filter((b) =>
            b.checkVisibility({ visibilityProperty: true }),
        );
        expect(shown.map((b) => b.title)).toEqual(["Run", "Debug", "Run doctests"]);
        const icons = shown.map((b) => b.querySelector("path")!.getAttribute("d"));
        expect(new Set(icons).size).toBe(icons.length);
        element.remove();
    });
});

describe("CodeRunner tab switches", () => {
    const lines = (prefix: string): string => Array.from({ length: 200 }, (_, i) => `${prefix}${i} = ${i}`).join("\n");

    async function mountTall(hostTab = false): Promise<CodeRunner> {
        const element = await mountRunner(hostTab, lines("x"));
        element.style.height = "300px";
        await settle(element);
        return element;
    }

    async function openTab(element: CodeRunner, tab: EditorTabId): Promise<void> {
        element.papyros.io.activeEditorTab = tab;
        await settle(element);
        await frames();
    }

    function codeView(element: CodeRunner): EditorView {
        const editor = element.shadowRoot!.querySelector("p-code")!.shadowRoot!.querySelector("p-code-editor");
        return (editor as unknown as { view: EditorView }).view;
    }

    function fileView(element: CodeRunner, name: string): EditorView {
        const viewer = Array.from(element.shadowRoot!.querySelectorAll<FileViewer>("p-file-viewer")).find(
            (v) => v.file?.name === name,
        )!;
        return (viewer.shadowRoot!.querySelector("p-file-editor") as unknown as { view: EditorView }).view;
    }

    async function scrollTo(view: EditorView, top: number): Promise<void> {
        view.scrollDOM.scrollTop = top;
        await frames();
    }

    function debugLineInView(view: EditorView): boolean {
        const marker = Array.from(view.dom.querySelectorAll(".cm-gutterElement")).find((g) => g.textContent === "▶");
        if (!marker) return false;
        const line = marker.getBoundingClientRect();
        const scroller = view.scrollDOM.getBoundingClientRect();
        return line.top >= scroller.top && line.bottom <= scroller.bottom;
    }

    const frame = (line: number): BackendEvent => ({
        type: BackendEventType.Frame,
        contentType: "application/json",
        data: JSON.stringify({
            line,
            event: "step_line",
            func_name: "<module>",
            globals: {},
            ordered_globals: [],
            stack_to_render: [],
            heap: {},
        }),
    });

    it("keeps the code's scroll position and undo history across a file tab", async () => {
        const element = await mountTall();
        element.papyros.io.addFile("data.txt", "hello");
        await openTab(element, CODE_TAB);
        const view = codeView(element);
        view.dispatch({ changes: { from: 0, insert: "# edited\n" } });
        await scrollTo(view, 1500);

        await openTab(element, "data.txt");
        await openTab(element, CODE_TAB);

        expect(codeView(element).scrollDOM.scrollTop).toBe(1500);
        expect(undo(codeView(element))).toBe(true);
        expect(element.papyros.runner.code).toBe(lines("x"));
        element.remove();
    });

    it("keeps each file's scroll position across the other tabs", async () => {
        const element = await mountTall();
        element.papyros.io.addFile("a.txt", lines("a"));
        element.papyros.io.addFile("b.txt", lines("b"));
        await openTab(element, "a.txt");
        await scrollTo(fileView(element, "a.txt"), 1200);
        await openTab(element, "b.txt");
        await scrollTo(fileView(element, "b.txt"), 600);

        await openTab(element, CODE_TAB);
        await openTab(element, "a.txt");
        expect(fileView(element, "a.txt").scrollDOM.scrollTop).toBe(1200);
        await openTab(element, "b.txt");
        expect(fileView(element, "b.txt").scrollDOM.scrollTop).toBe(600);
        element.remove();
    });

    it("keeps a file's editor when a snapshot lists the files in another order", async () => {
        const element = await mountTall();
        element.papyros.io.addFile("output.txt", "out");
        element.papyros.io.addFile("another.txt", "other");
        await openTab(element, "output.txt");
        const view = fileView(element, "output.txt");
        view.dispatch({ changes: { from: 3, insert: "put" } });
        await settle(element);

        element.papyros.events.publish({
            type: BackendEventType.Files,
            contentType: "text/json",
            data: JSON.stringify({
                "another.txt": { content: "other", binary: false },
                "output.txt": { content: "output", binary: false },
            }),
        });
        await settle(element);

        expect(fileView(element, "output.txt")).toBe(view);
        expect(undo(view)).toBe(true);
        expect(view.state.doc.toString()).toBe("out");
        element.remove();
    });

    it("does not send a file's new content back to the backend as an edit", async () => {
        const element = await mountTall();
        element.papyros.io.addFile("data.txt", "old");
        await openTab(element, CODE_TAB);
        const updateFile = vi.spyOn(element.papyros.runner, "updateFile").mockResolvedValue();

        element.papyros.events.publish({
            type: BackendEventType.Files,
            contentType: "text/json",
            data: JSON.stringify({ "data.txt": { content: "new", binary: false } }),
        });
        await settle(element);
        await new Promise((resolve) => setTimeout(resolve, 400));
        const view = fileView(element, "data.txt");
        expect(view.state.doc.toString()).toBe("new");
        expect(updateFile).not.toHaveBeenCalled();

        view.dispatch({ changes: { from: 3, insert: "er" } });
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(updateFile).toHaveBeenCalledWith("data.txt", "newer", false);
        element.remove();
    });

    it("focuses a file's editor when its tab is opened", async () => {
        const element = await mountTall();
        element.papyros.io.addFile("data.txt", "hello");
        await openTab(element, CODE_TAB);

        await openTab(element, "data.txt");
        expect(fileView(element, "data.txt").hasFocus).toBe(true);
        element.remove();
    });

    it("leaves focus outside an open file's editor when the file gets new content", async () => {
        const element = await mountTall();
        element.papyros.io.addFile("data.txt", "hello");
        await openTab(element, "data.txt");
        const button = document.createElement("button");
        document.body.append(button);
        button.focus();

        element.papyros.events.publish({
            type: BackendEventType.Files,
            contentType: "text/json",
            data: JSON.stringify({ "data.txt": { content: "bye", binary: false } }),
        });
        await settle(element);

        expect(fileView(element, "data.txt").state.doc.toString()).toBe("bye");
        expect(document.activeElement).toBe(button);
        button.remove();
        element.remove();
    });

    it("keeps the host panel's scroll position across the code tab", async () => {
        const element = await mountTall(true);
        element.querySelector("[slot=host-tab-panel]")!.textContent = lines("y");
        await openTab(element, HOST_TAB);
        const panel = element.shadowRoot!.querySelector<HTMLElement>(".host-panel")!;
        panel.scrollTop = 400;

        await openTab(element, CODE_TAB);
        await openTab(element, HOST_TAB);
        expect(panel.scrollTop).toBe(400);
        element.remove();
    });

    it("keeps the debug line marked and in view across a file tab", async () => {
        const element = await mountTall();
        const papyros = element.papyros;
        papyros.debugger.active = true;
        papyros.events.publish({
            type: BackendEventType.Files,
            contentType: "text/json",
            data: JSON.stringify({ "data.txt": { content: "hello", binary: false } }),
        });
        papyros.events.publish(frame(150));
        papyros.events.publish(frame(30));
        await settle(element);
        await frames();
        expect(debugLineInView(codeView(element))).toBe(true);

        await openTab(element, "data.txt");
        await openTab(element, CODE_TAB);
        expect(debugLineInView(codeView(element))).toBe(true);

        // A step taken while the code is hidden is scrolled to once it is shown.
        await openTab(element, "data.txt");
        papyros.debugger.activeFrame = 1;
        await settle(element);
        await openTab(element, CODE_TAB);
        expect(debugLineInView(codeView(element))).toBe(true);
        element.remove();
    });
});

describe.sequential("CodeRunner with a Python backend", () => {
    let papyros: Papyros;

    beforeAll(async () => {
        papyros = await launchPapyros(ProgrammingLanguage.Python);
    }, 180000);

    afterAll(() => papyros.dispose());

    it("leaves the files of consecutive runs to the backend", async () => {
        await settlePapyros(papyros);
        await wipeWorkspace(papyros);
        const element = document.createElement("p-code-runner") as CodeRunner;
        element.papyros = papyros;
        document.body.append(element);
        await settle(element);

        for (const content of ["first", "second"]) {
            papyros.runner.code = `with open("out.txt", "w") as f:\n    f.write("${content}")`;
            await papyros.runner.start();
            await waitForPapyrosReady(papyros, 60000);
            await settle(element);
        }
        papyros.runner.code = [
            "import asyncio",
            `with open("out.txt", "w") as f:`,
            `    f.write("third")`,
            "await asyncio.sleep(0.6)",
            `print(open("out.txt").read())`,
        ].join("\n");
        await papyros.runner.start();
        await waitForPapyrosReady(papyros, 60000);

        expect(papyros.io.output.map((o) => o.content).join("")).toBe("third\n");
        element.remove();
    });
});
