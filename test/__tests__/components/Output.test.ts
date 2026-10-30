import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunOutcome, RunStatus } from "../../../src/frontend/state/Runner";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { BackendEvent, BackendEventType } from "../../../src/communication/BackendEvent";
import { fakeClient } from "../../fakeClient";
import { OUTPUT_TAB, OutputEntry, OutputType, TURTLE_TAB } from "../../../src/frontend/state/InputOutput";
import type { Output } from "../../../src/frontend/components/Output";
import type { FriendlyErrorElement } from "../../../src/frontend/components/FriendlyError";
import "../../../src/frontend/components/Output";

let element: Output;

async function mount(papyros = new Papyros()): Promise<Output> {
    element = document.createElement("p-output") as Output;
    element.papyros = papyros;
    document.body.append(element);
    await element.updateComplete;
    return element;
}

function content(): HTMLElement {
    return element.shadowRoot!.querySelector<HTMLElement>(".content")!;
}

function atEnd(): boolean {
    return content().scrollTop + content().clientHeight >= content().scrollHeight - 1;
}

function lines(count: number): OutputEntry[] {
    return Array.from({ length: count }, (_, i) => ({ type: OutputType.stdout, content: `line ${i}\n` }));
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Lets the panel finish resizing into a new tab. */
async function settle(): Promise<void> {
    await nextFrame();
    element.getAnimations().forEach((animation) => animation.finish());
}

/** Scrolls up the way a reader does, after the panel has settled at the end. */
async function scrollToTop(): Promise<void> {
    await nextFrame();
    await nextFrame();
    content().scrollTop = 0;
    await nextFrame();
    await nextFrame();
}

afterEach(() => {
    element.remove();
});

describe("Output", () => {
    it("shows only its title until a program draws, then the Text and Turtle tabs", async () => {
        await mount();
        expect(element.shadowRoot!.querySelector(".pane-label")!.textContent!.trim()).toBe("Output");
        expect(element.shadowRoot!.querySelectorAll("[role=tab]").length).toBe(0);

        element.papyros.io.hasTurtleOutput = true;
        await element.updateComplete;
        const tabs = Array.from(element.shadowRoot!.querySelectorAll("[role=tab]"));
        expect(tabs.map((tab) => tab.textContent!.trim())).toEqual(["Text", "Turtle"]);
    });

    it("grows up to its maximum height and then follows the newest line", async () => {
        await mount();
        const oneLine = element.getBoundingClientRect().height;

        element.papyros.io.output = Array.from({ length: 20 }, (_, i) => ({
            type: OutputType.stdout,
            content: `line ${i}\n`,
        }));
        await element.updateComplete;

        expect(element.getBoundingClientRect().height).toBeGreaterThan(oneLine);
        expect(element.getBoundingClientRect().height).toBeLessThanOrEqual(160);
        expect(content().scrollHeight).toBeGreaterThan(content().clientHeight);
        expect(atEnd()).toBe(true);
    });

    it("keeps following the newest line when an inline image loads", async () => {
        await mount();
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 300;
        const png = canvas.toDataURL("image/png").split(",")[1];
        const text = (content: string): OutputEntry => ({ type: OutputType.stdout, content });

        element.papyros.io.output = [
            ...Array.from({ length: 5 }, (_, i) => text(`line ${i}\n`)),
            { type: OutputType.img, content: png, contentType: "image/png;base64" },
            text("after the image\n"),
        ];
        await element.updateComplete;
        await element.shadowRoot!.querySelector("img")!.decode();
        await nextFrame();
        await nextFrame();
        expect(atEnd()).toBe(true);

        element.papyros.io.output = [...element.papyros.io.output, text("one more line\n")];
        await element.updateComplete;
        expect(atEnd()).toBe(true);
    });

    it("follows the output of a new run after the reader scrolled up in the previous one", async () => {
        await mount();
        element.papyros.io.output = lines(20);
        await element.updateComplete;
        await scrollToTop();
        expect(atEnd()).toBe(false);

        element.papyros.io.output = [];
        await element.updateComplete;
        element.papyros.io.output = lines(20);
        await element.updateComplete;
        expect(atEnd()).toBe(true);
    });

    it("follows the output again once it fits in the panel", async () => {
        await mount();
        element.papyros.io.output = lines(20);
        await element.updateComplete;
        await scrollToTop();

        element.papyros.io.output = lines(1);
        await element.updateComplete;
        element.papyros.io.output = lines(20);
        await element.updateComplete;
        expect(atEnd()).toBe(true);
    });

    it("follows a friendly error, which renders after the output", async () => {
        await mount();
        element.papyros.io.output = [
            ...lines(20),
            {
                type: OutputType.stderr,
                content: { name: "NameError", what: "name 'x' is not defined", traceback: "line 1" },
            },
        ];
        await element.updateComplete;
        await element.shadowRoot!.querySelector<FriendlyErrorElement>("p-friendly-error")!.updateComplete;
        await nextFrame();
        await nextFrame();

        expect(atEnd()).toBe(true);
    });

    it("keeps the traceback toggle in view when the reader opens the traceback at the end", async () => {
        await mount();
        const traceback = Array.from({ length: 30 }, (_, i) => `  File "/__main__.py", line ${i}`).join("\n");
        element.papyros.io.output = [
            ...lines(3),
            { type: OutputType.stderr, content: { name: "NameError", what: "name 'x' is not defined", traceback } },
        ];
        await element.updateComplete;
        const error = element.shadowRoot!.querySelector<FriendlyErrorElement>("p-friendly-error")!;
        await error.updateComplete;
        await nextFrame();
        await nextFrame();
        expect(atEnd()).toBe(true);

        const toggle = error.shadowRoot!.querySelector<HTMLButtonElement>(".traceback-toggle")!;
        toggle.focus();
        toggle.click();
        await error.updateComplete;
        await nextFrame();
        await nextFrame();

        const panel = content().getBoundingClientRect();
        const button = toggle.getBoundingClientRect();
        expect(button.top).toBeGreaterThanOrEqual(panel.top);
        expect(button.bottom).toBeLessThanOrEqual(panel.bottom);
    });

    it("keeps its live region in the page while there is no output, so the first line is announced", async () => {
        await mount();
        const log = element.shadowRoot!.querySelector("[role=log]")!;
        expect(log.textContent).toBe("");
        expect(log.closest(".place-holder")).toBeNull();
        expect(log.querySelector(".place-holder")).toBeNull();

        element.papyros.io.output = lines(1);
        await element.updateComplete;
        expect(element.shadowRoot!.querySelector("[role=log]")).toBe(log);
        expect(log.textContent).toBe("line 0\n");
        expect(element.shadowRoot!.querySelector(".place-holder")).toBeNull();
    });

    it("says that nothing was printed yet at the current debug step", async () => {
        await mount();
        element.papyros.debugger.active = true;
        await element.updateComplete;

        expect(element.shadowRoot!.querySelector(".place-holder")!.textContent!.trim()).toBe(
            "Nothing printed yet at this step",
        );
    });

    it("takes the turtle height on the Turtle tab", async () => {
        await mount();
        element.papyros.io.hasTurtleOutput = true;
        element.papyros.io.selectOutputTab(TURTLE_TAB);
        await element.updateComplete;
        // The panel resizes into the new tab; the turtle height is where it comes to rest.
        await settle();

        expect(element.getAttribute("active-tab")).toBe(TURTLE_TAB);
        expect(element.getBoundingClientRect().height).toBe(380);
    });

    it("resizes from the turtle height back to the text height", async () => {
        await mount();
        const textHeight = element.getBoundingClientRect().height;
        element.papyros.io.hasTurtleOutput = true;
        element.papyros.io.selectOutputTab(TURTLE_TAB);
        await element.updateComplete;
        await settle();

        element.papyros.io.selectOutputTab(OUTPUT_TAB);
        await element.updateComplete;
        // The Text tab's max-height must not cut the turtle height short before the animation starts.
        expect(element.getBoundingClientRect().height).toBe(380);

        await settle();
        expect(element.getBoundingClientRect().height).toBe(textHeight);
    });
});

describe("Output without output", () => {
    const start: BackendEvent = { type: BackendEventType.Start, data: "RunCode", contentType: "text/plain" };
    const end: BackendEvent = { type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain" };
    const noOutput = "No output";
    const status = "Program finished without output";

    afterEach(() => element.papyros.dispose());

    /** A Papyros whose runs the test steers through the returned fake worker */
    async function mountWithRuns(client = fakeClient()): Promise<{ papyros: Papyros; client: any }> {
        const papyros = new Papyros();
        papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
        papyros.setErrorHandler(vi.fn());
        await papyros.runner.launch();
        await mount(papyros);
        return { papyros, client };
    }

    /** The run is returned in an object, so awaiting this does not wait for it to end */
    async function startRun(papyros: Papyros, client: any): Promise<{ running: Promise<void> }> {
        const calls = client.workerProxy.runCode.mock.calls.length;
        const running = papyros.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode.mock.calls.length).toBe(calls + 1));
        await element.updateComplete;
        return { running };
    }

    async function finishRun(client: any, running: Promise<void>): Promise<void> {
        client.emit(end);
        client.finishRun();
        await running;
        await element.updateComplete;
    }

    function placeholder(): HTMLElement | null {
        return element.shadowRoot!.querySelector<HTMLElement>(".no-output");
    }

    function statusRegion(): HTMLElement | null {
        return element.shadowRoot!.querySelector<HTMLElement>("[role=status]");
    }

    it("shows a muted placeholder after a run that printed nothing", async () => {
        const { papyros, client } = await mountWithRuns();

        await finishRun(client, (await startRun(papyros, client)).running);

        expect(papyros.runner.lifecycle).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Completed });
        expect(placeholder()!.textContent).toBe(noOutput);
        expect(element.shadowRoot!.querySelector(".place-holder")).toBeNull();
        const style = getComputedStyle(placeholder()!);
        expect(style.fontStyle).toBe("italic");
        expect(style.fontFamily).not.toMatch(/monospace/);
        expect(style.userSelect).toBe("none");
    });

    it("keeps the usual placeholder before the first run", async () => {
        const { papyros } = await mountWithRuns();

        expect(papyros.runner.lifecycle.status).toBe(RunStatus.Idle);
        expect(placeholder()).toBeNull();
        expect(element.shadowRoot!.querySelector(".place-holder")!.textContent).toBe(
            "The output of your code will appear here.",
        );
        expect(statusRegion()!.textContent).toBe("");
    });

    it("shows no placeholder while the run runs or waits for input", async () => {
        const { papyros, client } = await mountWithRuns();
        const { running } = await startRun(papyros, client);
        expect(placeholder()).toBeNull();

        client.emit(start);
        client.emit({ type: BackendEventType.Input, data: "", contentType: "text/plain" });
        await element.updateComplete;
        expect(papyros.runner.lifecycle.status).toBe(RunStatus.AwaitingInput);
        expect(placeholder()).toBeNull();
        expect(statusRegion()!.textContent).toBe("");

        await finishRun(client, running);
    });

    it("removes the placeholder as soon as the next run starts", async () => {
        const { papyros, client } = await mountWithRuns();
        await finishRun(client, (await startRun(papyros, client)).running);
        expect(placeholder()).not.toBeNull();

        const { running: next } = await startRun(papyros, client);
        expect(placeholder()).toBeNull();
        expect(statusRegion()!.textContent).toBe("");

        await finishRun(client, next);
        expect(placeholder()).not.toBeNull();
    });

    it("shows no placeholder when the run printed something", async () => {
        const { papyros, client } = await mountWithRuns();
        const { running } = await startRun(papyros, client);

        client.emit({ type: BackendEventType.Output, data: "hi\n", contentType: "text/plain" });
        await finishRun(client, running);

        expect(placeholder()).toBeNull();
        expect(statusRegion()!.textContent).toBe("");
    });

    it("shows no placeholder when the run raised an error", async () => {
        const { papyros, client } = await mountWithRuns();
        const { running } = await startRun(papyros, client);

        client.emit({ type: BackendEventType.Error, data: "boom", contentType: "text/plain" });
        await finishRun(client, running);

        expect(papyros.runner.lifecycle).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Completed });
        expect(papyros.io.output.map((o) => o.type)).toEqual([OutputType.stderr]);
        expect(placeholder()).toBeNull();
        expect(statusRegion()!.textContent).toBe("");
    });

    it("shows no placeholder after a stopped run", async () => {
        const client = fakeClient();
        client.interrupt.mockImplementation(() => Promise.resolve(client.finishRun()));
        const { papyros } = await mountWithRuns(client);
        const { running } = await startRun(papyros, client);

        client.emit(start);
        await papyros.runner.stop();
        await running;
        await element.updateComplete;

        expect(papyros.runner.lifecycle).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Stopped });
        expect(placeholder()).toBeNull();
        expect(element.shadowRoot!.querySelector(".place-holder")).not.toBeNull();
        expect(statusRegion()!.textContent).toBe("");
    });

    it("shows no placeholder after a crashed run", async () => {
        const client = fakeClient();
        client.workerProxy.runCode.mockImplementationOnce(() => Promise.reject(new Error("DataCloneError")));
        const { papyros } = await mountWithRuns(client);

        await papyros.runner.start();
        await element.updateComplete;

        expect(papyros.runner.lifecycle).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.Crashed });
        expect(placeholder()).toBeNull();
        expect(statusRegion()!.textContent).toBe("");
    });

    it("shows no placeholder when the files of the run failed to load", async () => {
        const { papyros } = await mountWithRuns();

        await papyros.runner.start(undefined, { files: Promise.reject(new Error("HTTP 404")) });
        await element.updateComplete;

        expect(papyros.runner.lifecycle).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.FilesFailed });
        expect(placeholder()).toBeNull();
        expect(statusRegion()!.textContent).toBe("");
    });

    it("shows no placeholder when the run could not launch", async () => {
        const papyros = new Papyros();
        papyros.setErrorHandler(vi.fn());
        await mount(papyros);

        await papyros.runner.start();
        await element.updateComplete;

        expect(papyros.runner.lifecycle).toMatchObject({ status: RunStatus.Ended, outcome: RunOutcome.LaunchFailed });
        expect(placeholder()).toBeNull();
        expect(statusRegion()!.textContent).toBe("");
    });

    it("brings back the usual placeholder when the runner is reset", async () => {
        const { papyros, client } = await mountWithRuns();
        await finishRun(client, (await startRun(papyros, client)).running);
        expect(placeholder()).not.toBeNull();

        await papyros.runner.reset();
        await element.updateComplete;

        expect(papyros.runner.lifecycle.status).toBe(RunStatus.Idle);
        expect(placeholder()).toBeNull();
        expect(element.shadowRoot!.querySelector(".place-holder")).not.toBeNull();
        expect(statusRegion()!.textContent).toBe("");
    });

    it("keeps the debug placeholder while debugging", async () => {
        const { papyros, client } = await mountWithRuns();
        await finishRun(client, (await startRun(papyros, client)).running);

        papyros.debugger.active = true;
        await element.updateComplete;

        expect(placeholder()).toBeNull();
        expect(element.shadowRoot!.querySelector(".place-holder")!.textContent).toBe(
            "Nothing printed yet at this step",
        );
        expect(statusRegion()!.textContent).toBe("");
    });

    it("leaves the placeholder and its announcement out of the selected text", async () => {
        const { papyros, client } = await mountWithRuns();
        await finishRun(client, (await startRun(papyros, client)).running);
        expect(statusRegion()!.textContent).toBe(status);

        const selection = getSelection()!;
        selection.selectAllChildren(content());

        expect(selection.toString()).not.toContain(noOutput);
        expect(selection.toString()).not.toContain(status);
        selection.removeAllRanges();
    });

    it("announces the empty run as a status, apart from the output log", async () => {
        const { papyros, client } = await mountWithRuns();
        const region = statusRegion()!;
        expect(region.textContent).toBe("");

        await finishRun(client, (await startRun(papyros, client)).running);

        // The region that was already in the page, so assistive technology announces the change
        expect(statusRegion()).toBe(region);
        expect(region.textContent).toBe(status);
        expect(element.shadowRoot!.querySelector("[role=log]")!.contains(region)).toBe(false);
        expect(placeholder()!.getAttribute("aria-hidden")).toBe("true");
        expect(placeholder()!.closest("[role=log]")).toBeNull();
    });

    it("announces the empty run also while the Turtle tab is open", async () => {
        const { papyros, client } = await mountWithRuns();
        const region = statusRegion()!;
        await finishRun(client, (await startRun(papyros, client)).running);

        papyros.io.hasTurtleOutput = true;
        papyros.io.selectOutputTab(TURTLE_TAB);
        await element.updateComplete;

        expect(statusRegion()).toBe(region);
        expect(region.textContent).toBe(status);
    });
});
