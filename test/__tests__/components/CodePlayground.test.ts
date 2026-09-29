import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { PapyrosRuntime } from "../../../src/frontend/state/PapyrosRuntime";
import { PapyrosLaunchError } from "../../../src/frontend/state/PapyrosErrors";
import { OutputEntry, OutputType } from "../../../src/frontend/state/InputOutput";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { BackendEvent, BackendEventType } from "../../../src/communication/BackendEvent";
import type { CodePlayground } from "../../../src/frontend/components/CodePlayground";
import type { FriendlyErrorElement } from "../../../src/frontend/components/FriendlyError";
import type { CodeEditor } from "../../../src/frontend/components/code_mirror/CodeEditor";
import "../../../src/frontend/components/CodePlayground";

const end: BackendEvent = { type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain" };
const output = (data: string): BackendEvent => ({ type: BackendEventType.Output, data, contentType: "text/plain" });

/**
 * Stand-in for a SyncClient, so a test decides when the launch settles, which events
 * arrive during a run, and when that run ends
 */
function fakeClient(launch: () => Promise<void> = () => Promise.resolve()): any {
    const fake: any = {
        worker: {},
        emit: (e: BackendEvent) => fake.callback(e),
        finishRun: () => fake.resolveRun?.(),
        call: (method: (...args: any[]) => Promise<any>, ...args: any[]) => method(...args),
        interrupt: vi.fn(() => Promise.resolve()),
        writeMessage: vi.fn(() => Promise.resolve()),
        restart: vi.fn(),
        terminate: vi.fn(),
    };
    fake.workerProxy = {
        launch: vi.fn((callback: (e: BackendEvent) => void) => {
            fake.callback = callback;
            return launch();
        }),
        usesJspi: () => Promise.resolve(true),
        runModes: () => Promise.resolve([]),
        lintCode: vi.fn(() => Promise.resolve([])),
        runCode: vi.fn(() => new Promise<void>((resolve) => (fake.resolveRun = resolve))),
        clearWorkspace: vi.fn(() => Promise.resolve()),
        updateFile: vi.fn(() => Promise.resolve()),
    };
    return fake;
}

/** Holds a launch pending; resolve() lets it finish */
function deferred(): { promise: Promise<void>; resolve: () => void; reject: (e: Error) => void } {
    let resolve: () => void = () => undefined;
    let reject: (e: Error) => void = () => undefined;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

const mounted: HTMLElement[] = [];
const runtimes: PapyrosRuntime[] = [];

function sharedRuntime(...clients: any[]): PapyrosRuntime {
    const runtime = new PapyrosRuntime();
    const queue = [...clients];
    const last = clients[clients.length - 1];
    runtime.registerBackend(ProgrammingLanguage.Python, () => queue.shift() ?? last);
    runtimes.push(runtime);
    return runtime;
}

interface MountOptions {
    code?: string;
    label?: string;
    language?: string;
    files?: string;
    runtime?: PapyrosRuntime;
    client?: any;
    /** Keeps the playground in view, which is what starts the preload */
    visible?: boolean;
}

async function mount(options: MountOptions = {}): Promise<CodePlayground> {
    const runtime = options.runtime ?? sharedRuntime(options.client ?? fakeClient());
    const el = document.createElement("p-code-playground") as CodePlayground;
    el.papyros = new Papyros({ runtime });
    el.code = options.code ?? "print(1)";
    if (options.label !== undefined) {
        el.label = options.label;
    }
    if (options.language !== undefined) {
        el.programmingLanguage = options.language;
    }
    if (options.files !== undefined) {
        el.files = options.files;
    }
    if (!options.visible) {
        // Out of view, so the preload leaves the launch to the test
        el.style.position = "fixed";
        el.style.top = "-10000px";
        el.style.width = "600px";
    }
    document.body.append(el);
    mounted.push(el);
    await el.updateComplete;
    return el;
}

async function settle(el: CodePlayground): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await el.updateComplete;
}

function $<T extends Element = HTMLElement>(el: CodePlayground, selector: string): T | null {
    return el.shadowRoot!.querySelector<T>(selector);
}

/** The editor inside the playground's p-code */
function editorOf(el: CodePlayground): CodeEditor | null {
    return $(el, "p-code")?.shadowRoot?.querySelector<CodeEditor>("p-code-editor") ?? null;
}

function $$<T extends Element = HTMLElement>(el: CodePlayground, selector: string): T[] {
    return Array.from(el.shadowRoot!.querySelectorAll<T>(selector));
}

function button(el: CodePlayground, selector: string = "button.pill"): HTMLButtonElement {
    return $<HTMLButtonElement>(el, selector)!;
}

function clientOf(el: CodePlayground): Promise<any> {
    return el.papyros.runner.backend;
}

async function startRun(el: CodePlayground): Promise<any> {
    button(el, "button.run").click();
    await vi.waitFor(() => expect(el.papyros.runtime.running).toBe(el.papyros));
    const client = await clientOf(el);
    await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
    await settle(el);
    return client;
}

async function finishRun(el: CodePlayground, client: any): Promise<void> {
    client.emit(end);
    client.finishRun();
    await vi.waitFor(() => expect(el.papyros.runtime.running).toBeNull());
    await settle(el);
}

async function awaitInput(el: CodePlayground, client: any, prompt: string = ""): Promise<void> {
    client.emit({ type: BackendEventType.Input, data: prompt, contentType: "text/plain" });
    await settle(el);
}

async function setOutputs(el: CodePlayground, outputs: OutputEntry[]): Promise<void> {
    el.papyros.io.output = outputs;
    await settle(el);
}

// Fakes the scroll geometry of the output log: the content is as tall as the rendered
// transcript lines, and scrollTop clamps to the browser range 0..(scrollHeight - clientHeight).
function mockScroll(log: HTMLElement, geometry: { clientHeight: number; lineHeight: number }): void {
    const scrollHeight = (): number => {
        const transcript = log.querySelector(".transcript")?.textContent ?? "";
        const lines = transcript.split("\n").length - 1;
        return Math.max(geometry.clientHeight, lines * geometry.lineHeight);
    };
    let scrollTop = 0;
    Object.defineProperty(log, "clientHeight", { value: geometry.clientHeight, configurable: true });
    Object.defineProperty(log, "scrollHeight", { get: scrollHeight, configurable: true });
    Object.defineProperty(log, "scrollTop", {
        get: () => scrollTop,
        set: (value: number) => {
            scrollTop = Math.max(0, Math.min(value, scrollHeight() - geometry.clientHeight));
        },
        configurable: true,
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
    for (const el of mounted.splice(0)) {
        el.remove();
    }
    for (const runtime of runtimes.splice(0)) {
        runtime.dispose();
    }
});

describe("p-code-playground", () => {
    it("shows a config error for an unsupported language", async () => {
        const el = await mount({ language: "haskell" });

        const error = $(el, ".config-error")!;
        expect(error.textContent).toContain("Configuration error");
        expect(error.textContent).toContain('Only Python is supported in code playgrounds (got "haskell").');
        expect($(el, "p-code")).toBeNull();
    });

    it("accepts the language in any case", async () => {
        const el = await mount({ language: ProgrammingLanguage.Python });

        expect($(el, ".config-error")).toBeNull();
        expect(editorOf(el)).not.toBeNull();
    });

    it("hands its code to the editor through its own runner", async () => {
        const el = await mount({ code: "print(42)" });

        expect(editorOf(el)!.value).toBe("print(42)");
        expect(el.papyros.runner.code).toBe("print(42)");
    });

    it("does not lint before the runtime is launched", async () => {
        const client = fakeClient();
        const el = await mount({ client });

        // Past CodeMirror's lint delay: no lint may reach a runtime that is not launched
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(client.workerProxy.launch).not.toHaveBeenCalled();
        expect(client.workerProxy.lintCode).not.toHaveBeenCalled();

        await el.papyros.runner.launch();
        await settle(el);
        // The editor re-lints when a package finishes loading
        client.emit({
            type: BackendEventType.Loading,
            data: JSON.stringify({ modules: ["numpy"], status: "loaded" }),
            contentType: "text/json",
        });
        await vi.waitFor(() => expect(client.workerProxy.lintCode).toHaveBeenCalledWith("print(1)"), { timeout: 3000 });
    });

    it("launches then runs its own code from an empty workspace when Run is clicked", async () => {
        const client = fakeClient();
        const el = await mount({ client, code: "print(7)" });

        await startRun(el);

        expect(client.workerProxy.launch).toHaveBeenCalledTimes(1);
        expect(client.workerProxy.clearWorkspace).toHaveBeenCalled();
        expect(client.workerProxy.runCode).toHaveBeenCalledWith("print(7)", "run", expect.any(Number));
        await finishRun(el, client);
    });

    it("shows a failed launch as an alert and leaves Run usable", async () => {
        const client = fakeClient(() => Promise.reject(new Error("launch failed")));
        const el = await mount({ client });
        const handler = vi.fn();
        el.papyros.setErrorHandler(handler);

        button(el, "button.run").click();
        await vi.waitFor(() => expect($(el, ".error .error-title")).not.toBeNull());

        const title = $(el, ".error .error-title")!;
        expect(title.getAttribute("role")).toBe("alert");
        expect(title.textContent).toContain("Python failed to load. Try again, or reload the page.");
        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(handler.mock.calls[0][0]).toBeInstanceOf(PapyrosLaunchError);
        expect(button(el, "button.run").hasAttribute("aria-disabled")).toBe(false);
    });

    it("drops the launch error once a retried launch succeeds", async () => {
        const failing = fakeClient(() => Promise.reject(new Error("launch failed")));
        const working = fakeClient();
        const el = await mount({ runtime: sharedRuntime(failing, working) });

        button(el, "button.run").click();
        await vi.waitFor(() => expect($(el, ".error")).not.toBeNull());

        button(el, "button.run").click();
        await vi.waitFor(() => expect(working.workerProxy.runCode).toHaveBeenCalled());
        await settle(el);

        expect($(el, ".error")).toBeNull();
        await finishRun(el, working);
    });

    it("gates Run while another instance on the runtime is running, without making it unfocusable", async () => {
        const client = fakeClient();
        const el = await mount({ client });
        const other = new Papyros({ runtime: el.papyros.runtime });
        other.runtime.tryAcquire(other);
        await settle(el);

        const run = button(el, "button.run");
        expect(run.disabled).toBe(false);
        expect(run.getAttribute("aria-disabled")).toBe("true");
        expect(run.title).toBe("Another code block is running");

        const reason = el.shadowRoot!.getElementById(run.getAttribute("aria-describedby")!)!;
        expect(reason.classList.contains("visually-hidden")).toBe(true);
        expect(reason.textContent).toContain("Another code block is running");

        run.click();
        await settle(el);
        expect(client.workerProxy.launch).not.toHaveBeenCalled();
        expect(client.workerProxy.runCode).not.toHaveBeenCalled();

        other.runtime.release(other);
        await settle(el);
        expect(run.hasAttribute("aria-disabled")).toBe(false);
    });

    it("leaves Run ungated and undescribed when nothing else is running", async () => {
        const el = await mount();
        const run = button(el, "button.run");

        expect(run.hasAttribute("aria-disabled")).toBe(false);
        expect(run.hasAttribute("aria-describedby")).toBe(false);
        expect(run.hasAttribute("title")).toBe(false);
    });

    it("gates Run while launching without describing a reason", async () => {
        const launch = deferred();
        const client = fakeClient(() => launch.promise);
        const el = await mount({ client });

        const run = button(el);
        run.click();
        await el.updateComplete;

        expect(run.getAttribute("aria-disabled")).toBe("true");
        // The status line inside the live output panel already says "loading".
        expect(run.hasAttribute("aria-describedby")).toBe(false);

        run.click();
        await settle(el);
        expect(client.workerProxy.launch).toHaveBeenCalledTimes(1);

        launch.resolve();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledTimes(1));
        await finishRun(el, client);
    });

    it("never puts the native disabled attribute on the run/stop button", async () => {
        const launch = deferred();
        const client = fakeClient(() => launch.promise);
        const el = await mount({ client });
        const pill = button(el);
        expect(pill.hasAttribute("disabled")).toBe(false);

        pill.click();
        await el.updateComplete;
        expect(pill.hasAttribute("disabled")).toBe(false);

        launch.resolve();
        await vi.waitFor(() => expect(el.papyros.runtime.running).toBe(el.papyros));
        await settle(el);
        expect(pill.hasAttribute("disabled")).toBe(false);

        await finishRun(el, client);
        const other = new Papyros({ runtime: el.papyros.runtime });
        other.runtime.tryAcquire(other);
        await settle(el);
        expect(pill.hasAttribute("disabled")).toBe(false);
        other.runtime.release(other);
    });

    it("shows Stop (not Run) while it runs, and stops its run", async () => {
        const el = await mount();
        const client = await startRun(el);

        expect($(el, "button.stop")).not.toBeNull();
        expect($(el, "button.run")).toBeNull();

        button(el, "button.stop").click();
        await vi.waitFor(() => expect(client.interrupt).toHaveBeenCalledTimes(1));
        await finishRun(el, client);
    });

    it("keeps the same run/stop button element across the active flip", async () => {
        const el = await mount();
        const pill = button(el);

        const client = await startRun(el);
        expect(button(el)).toBe(pill);
        expect(pill.textContent).toContain("Stop");

        await finishRun(el, client);
        expect(button(el)).toBe(pill);
        expect(pill.textContent).toContain("Run");
    });

    it("hands focus to the run button when Reset disables itself", async () => {
        const el = await mount();
        editorOf(el)!.dispatchEvent(new CustomEvent("change", { detail: "edited" }));
        await el.updateComplete;

        const reset = button(el, "button.reset");
        reset.focus();
        reset.click();
        await el.updateComplete;

        expect(reset.disabled).toBe(true);
        expect(el.shadowRoot!.activeElement).toBe(button(el));
    });

    it("leaves focus alone on reset when Reset was not holding it", async () => {
        const el = await mount();
        editorOf(el)!.dispatchEvent(new CustomEvent("change", { detail: "edited" }));
        await el.updateComplete;

        button(el, "button.reset").click();
        await el.updateComplete;

        expect(document.activeElement).toBe(document.body);
    });

    it("moves focus into the input row, and to the run/stop button once the row goes", async () => {
        const el = await mount();
        const client = await startRun(el);

        await awaitInput(el, client, "Name: ");
        const input = $<HTMLInputElement>(el, ".input-row input")!;
        expect(el.shadowRoot!.activeElement).toBe(input);

        await finishRun(el, client);
        expect($(el, ".input-row")).toBeNull();
        expect(el.shadowRoot!.activeElement).toBe(button(el));
    });

    it("shows the input row only while its own run awaits input", async () => {
        const el = await mount();
        const client = await startRun(el);

        await awaitInput(el, client, "Name: ");
        expect($(el, ".input-row")).not.toBeNull();

        el.papyros.io.awaitingInput = false;
        await settle(el);
        expect($(el, ".input-row")).toBeNull();

        await finishRun(el, client);
        el.papyros.io.awaitingInput = true;
        await settle(el);
        expect($(el, ".input-row")).toBeNull();
    });

    it("describes the input by its prompt, and only when there is one", async () => {
        const el = await mount();
        const client = await startRun(el);

        await awaitInput(el, client, "Name: ");
        const input = $<HTMLInputElement>(el, ".input-row input")!;
        const described = el.shadowRoot!.getElementById(input.getAttribute("aria-describedby")!)!;
        expect(described.textContent).toContain("Name: ");

        el.papyros.io.prompt = "";
        await settle(el);
        expect($<HTMLInputElement>(el, ".input-row input")!.hasAttribute("aria-describedby")).toBe(false);
        await finishRun(el, client);
    });

    it("labels the card as a group by its title, unless the title is hidden", async () => {
        const el = await mount();
        const card = $(el, ".card")!;

        expect(card.getAttribute("role")).toBe("group");
        expect(card.getAttribute("aria-labelledby")).toBe($(el, ".title")!.id);

        const hidden = await mount({ label: "" });
        expect($(hidden, ".card")!.hasAttribute("aria-labelledby")).toBe(false);
    });

    it("submits input on Enter and echoes it into the transcript", async () => {
        const el = await mount();
        const client = await startRun(el);
        await awaitInput(el, client);

        const input = $<HTMLInputElement>(el, ".input-row input")!;
        input.value = "Alice";
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        await vi.waitFor(() => expect(client.writeMessage).toHaveBeenCalledWith("Alice"));
        expect(el.outputs).toEqual([{ type: OutputType.stdout, content: "Alice\n" }]);
        await settle(el);
        expect($(el, ".transcript")!.textContent).toBe("Alice\n");
        await finishRun(el, client);
    });

    it("ignores the Enter that confirms composed IME text", async () => {
        const el = await mount();
        const client = await startRun(el);
        await awaitInput(el, client);

        const input = $<HTMLInputElement>(el, ".input-row input")!;
        input.value = "こんにちは";
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true }));
        await settle(el);

        expect(client.writeMessage).not.toHaveBeenCalled();
        expect(input.value).toBe("こんにちは");
        expect(el.outputs).toEqual([]);
        await finishRun(el, client);
    });

    it("has no output panel when idle with no output", async () => {
        const el = await mount();
        expect($(el, ".output")).toBeNull();
    });

    it("keeps the output panel mounted while running with no output", async () => {
        const el = await mount();
        const client = await startRun(el);

        const panel = $(el, ".output")!;
        expect(panel.querySelector(".output-body")).not.toBeNull();
        expect(panel.querySelector(".transcript")).toBeNull();
        await finishRun(el, client);
    });

    it("shows the loading status line inside the output panel while launching", async () => {
        const launch = deferred();
        const client = fakeClient(() => launch.promise);
        const el = await mount({ client });

        button(el, "button.run").click();
        await el.updateComplete;

        const statusLine = $(el, ".output-body .status-line")!;
        expect(statusLine.textContent).toContain("Loading");

        launch.resolve();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        await finishRun(el, client);
    });

    it("shows the status line while running with no output, gone once output arrives", async () => {
        const el = await mount();
        const client = await startRun(el);
        client.emit({ type: BackendEventType.Start, data: "RunCode", contentType: "text/plain" });
        await settle(el);

        const statusLine = $(el, ".output-body .status-line")!;
        expect(statusLine.textContent).toContain("Running");
        expect(statusLine.closest(".toolbar")).toBeNull();

        client.emit(output("hi\n"));
        await settle(el);

        expect($(el, ".output-body .status-line")).toBeNull();
        expect($(el, ".output-body .transcript")!.textContent).toContain("hi");
        await finishRun(el, client);
    });

    it("reserves the previous output height on re-run and releases it when the run ends", async () => {
        const el = await mount();
        await setOutputs(el, [{ type: OutputType.stdout, content: "a\nb\nc\n" }]);

        const body = $(el, ".output-body")!;
        Object.defineProperty(body, "offsetHeight", { value: 88, configurable: true });

        button(el, "button.run").click();
        await el.updateComplete;
        expect($(el, ".output-body")!.style.minHeight).toBe("88px");

        const client = await clientOf(el);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(output("a\n"));
        await finishRun(el, client);

        expect($(el, ".output-body")!.style.minHeight).toBe("");
    });

    it("does not reserve height on the first run", async () => {
        const launch = deferred();
        const client = fakeClient(() => launch.promise);
        const el = await mount({ client });

        button(el, "button.run").click();
        await el.updateComplete;

        expect($(el, ".output-body")!.style.minHeight).toBe("");

        launch.resolve();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        await finishRun(el, client);
    });

    it("caps the reserved height at what fits in the output log", async () => {
        const el = await mount();
        await setOutputs(el, [{ type: OutputType.stdout, content: "a\nb\nc\nd\ne\n" }]);

        // Five 410px lines make a 2050px log around a 2000px body: 50px of label and padding.
        const body = $(el, ".output-body")!;
        Object.defineProperty(body, "offsetHeight", { value: 2000, configurable: true });
        mockScroll($(el, ".output")!, { clientHeight: 300, lineHeight: 410 });

        button(el, "button.run").click();
        await el.updateComplete;
        expect($(el, ".output-body")!.style.minHeight).toBe("250px");

        const client = await clientOf(el);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        await finishRun(el, client);
    });

    it("scrolls the output log to the top when a run starts", async () => {
        const el = await mount();
        await setOutputs(el, [{ type: OutputType.stdout, content: "a\nb\nc\nd\ne\nf\n" }]);

        const log = $(el, ".output")!;
        mockScroll(log, { clientHeight: 300, lineHeight: 100 });
        log.scrollTop = 300;

        button(el, "button.run").click();
        await settle(el);

        expect(log.scrollTop).toBe(0);
        const client = await clientOf(el);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        await finishRun(el, client);
    });

    it("follows new output only while the log is scrolled to the bottom", async () => {
        const el = await mount();
        await setOutputs(el, [{ type: OutputType.stdout, content: "a\nb\nc\nd\n" }]);

        // Four 100px lines in a 300px log: the bottom is at 100.
        const log = $(el, ".output")!;
        mockScroll(log, { clientHeight: 300, lineHeight: 100 });
        log.scrollTop = 100;

        await setOutputs(el, [...el.outputs, { type: OutputType.stdout, content: "e\n" }]);
        expect(log.scrollTop).toBe(200);

        log.scrollTop = 50;
        await setOutputs(el, [...el.outputs, { type: OutputType.stdout, content: "f\n" }]);
        expect(log.scrollTop).toBe(50);
    });

    it("renders output in an output panel and errors in error panels", async () => {
        const el = await mount();
        await setOutputs(el, [
            { type: OutputType.stdout, content: "line one\n" },
            { type: OutputType.stderr, content: "a warning\n" },
            { type: OutputType.stderr, content: { name: "ValueError", what: "bad", traceback: "Traceback…" } },
            { type: OutputType.img, content: "AAAA", contentType: "image/png" },
        ]);

        expect($(el, ".output .panel-label")!.textContent).toContain("Output");
        expect($(el, ".output .transcript")!.textContent).toContain("line one");
        expect($<HTMLImageElement>(el, ".output img.output-img")!.getAttribute("src")).toBe(
            "data:image/png;base64,AAAA",
        );

        const errors = $$(el, ".error");
        expect(errors).toHaveLength(2);
        expect(errors.map((error) => error.hasAttribute("role"))).toEqual([false, false]);

        const plain = errors[0].querySelector(".error-title")!;
        expect(plain.getAttribute("role")).toBe("alert");
        expect(plain.textContent).toContain("a warning");

        const friendly = errors[1].querySelector<FriendlyErrorElement>("p-friendly-error")!;
        await friendly.updateComplete;
        const title = friendly.shadowRoot!.querySelector(".title")!;
        expect(title.getAttribute("role")).toBe("alert");
        expect(title.textContent).toBe("ValueError: bad");
        expect(friendly.shadowRoot!.querySelector(".traceback-toggle")).not.toBeNull();
        expect(friendly.shadowRoot!.querySelector(".traceback-body")).toBeNull();
    });

    it("caps rendered output at maxOutputLength and shows a truncated notice", async () => {
        const el = await mount();
        el.papyros.constants.maxOutputLength = 2;
        await setOutputs(el, [
            { type: OutputType.stdout, content: "one\n" },
            { type: OutputType.stdout, content: "two\n" },
            { type: OutputType.stdout, content: "three\n" },
        ]);

        const text = $$(el, ".output .transcript")
            .map((node) => node.textContent)
            .join("");
        expect(text).toContain("one");
        expect(text).toContain("two");
        expect(text).not.toContain("three");
        expect(text).toContain("Output truncated; showing the first 2 entries.");
    });

    it("makes the output log a keyboard-scrollable live log", async () => {
        const el = await mount();
        await setOutputs(el, [{ type: OutputType.stdout, content: "hi\n" }]);

        const log = $(el, ".output")!;
        expect(log.getAttribute("role")).toBe("log");
        expect(log.getAttribute("aria-live")).toBe("polite");
        expect(log.getAttribute("tabindex")).toBe("0");
        expect(log.getAttribute("aria-label")).toBe("Program output");
    });

    it("shows the translated title, overridable via the label", async () => {
        const el = await mount();
        expect($(el, ".title")!.textContent).toContain("Try it yourself");

        const custom = await mount({ label: "My snippet" });
        expect($(custom, ".title")!.textContent).toContain("My snippet");

        const hidden = await mount({ label: "" });
        expect($(hidden, ".title")).toBeNull();
    });

    it("shows a labelled reset button with an icon hidden from assistive technology", async () => {
        const el = await mount();
        const reset = button(el, "button.reset");

        expect(reset.textContent).toContain("Reset");
        expect(reset.querySelector(".icon[aria-hidden='true'] svg")).not.toBeNull();
        expect(reset.title).toBe("Reset code");
        expect(reset.disabled).toBe(true);
    });

    it("resets to the original code and clears the output", async () => {
        const el = await mount({ code: "print(1)" });
        await setOutputs(el, [{ type: OutputType.stdout, content: "old\n" }]);
        const editor = editorOf(el)!;
        editor.dispatchEvent(new CustomEvent("change", { detail: "edited" }));
        await el.updateComplete;

        const reset = button(el, "button.reset");
        expect(reset.disabled).toBe(false);
        reset.click();
        await settle(el);

        expect(editor.value).toBe("print(1)");
        expect(el.outputs).toEqual([]);
        expect($(el, ".output")).toBeNull();

        const client = await startRun(el);
        expect(client.workerProxy.runCode).toHaveBeenCalledWith("print(1)", "run", expect.any(Number));
        await finishRun(el, client);
    });

    it("runs the edited code", async () => {
        const el = await mount({ code: "print(1)" });
        editorOf(el)!.dispatchEvent(new CustomEvent("change", { detail: "print(2)" }));
        await el.updateComplete;

        const client = await startRun(el);
        expect(client.workerProxy.runCode).toHaveBeenCalledWith("print(2)", "run", expect.any(Number));
        await finishRun(el, client);
    });

    it("translates its chrome", async () => {
        const el = await mount();
        const run = button(el, "button.run");
        expect(run.textContent).toContain("Run");
        expect(run.querySelector(".icon[aria-hidden='true'] svg")).not.toBeNull();

        el.papyros.i18n.locale = "nl";
        await settle(el);

        expect(run.textContent).toContain("Uitvoeren");
        expect($(el, ".title")!.textContent).toContain("Probeer het zelf");
        expect(button(el, "button.reset").title).toBe("Code herstellen");
    });
});

describe("p-code-playground preload", () => {
    it("launches every playground on a runtime once one of them is in view", async () => {
        const client = fakeClient();
        const runtime = sharedRuntime(client);
        const hidden = await mount({ runtime });
        const visible = await mount({ runtime, visible: true });

        await vi.waitFor(() => expect(visible.papyros.runner.backendReady).toBe(true));
        await vi.waitFor(() => expect(hidden.papyros.runner.backendReady).toBe(true));
        expect(client.workerProxy.launch).toHaveBeenCalledTimes(1);
    });

    it("waits while no playground is in view", async () => {
        const client = fakeClient();
        const el = await mount({ client });

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(client.workerProxy.launch).not.toHaveBeenCalled();
        expect(el.papyros.runner.backendReady).toBe(false);
    });

    it("launches a playground added after the preload right away", async () => {
        const client = fakeClient();
        const runtime = sharedRuntime(client);
        const first = await mount({ runtime, visible: true });
        await vi.waitFor(() => expect(first.papyros.runner.backendReady).toBe(true));

        const later = await mount({ runtime });
        await vi.waitFor(() => expect(later.papyros.runner.backendReady).toBe(true));
        expect(client.workerProxy.launch).toHaveBeenCalledTimes(1);
    });

    it("does not preload for an unsupported language", async () => {
        const client = fakeClient();
        await mount({ client, language: "haskell", visible: true });

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(client.workerProxy.launch).not.toHaveBeenCalled();
    });

    it("reports a failed preload once and lets Run retry", async () => {
        const failing = fakeClient(() => Promise.reject(new Error("launch failed")));
        const working = fakeClient();
        const runtime = sharedRuntime(failing, working);
        const handler = vi.fn();
        const first = document.createElement("p-code-playground") as CodePlayground;
        first.papyros = new Papyros({ runtime });
        first.papyros.setErrorHandler(handler);
        const second = await mount({ runtime });
        second.papyros.setErrorHandler(handler);
        document.body.append(first);
        mounted.push(first);

        await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
        expect(handler.mock.calls[0][0]).toBeInstanceOf(PapyrosLaunchError);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(handler).toHaveBeenCalledTimes(1);

        const client = await startRun(first);
        expect(client).toBe(working);
        await finishRun(first, client);
    });
});

// Loaded files are cached per URL for the whole module, so every test uses its own file names.
function stubFiles(files: Record<string, () => Response>): ReturnType<typeof vi.fn> {
    const realFetch = globalThis.fetch;
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
        const name = new URL(String(input), document.baseURI).pathname.split("/").pop()!;
        return files[name] ? files[name]() : realFetch(input);
    });
    vi.stubGlobal("fetch", fetch);
    return fetch;
}

function fileTabs(el: CodePlayground): HTMLElement | null {
    return $(el, "p-editor-tabs");
}

function tabButtons(el: CodePlayground): HTMLButtonElement[] {
    const tabs = Array.from(fileTabs(el)!.shadowRoot!.querySelectorAll<HTMLElement>("[role=tab], p-editor-tab"));
    return tabs.flatMap((tab) =>
        tab.matches("p-editor-tab")
            ? [tab.shadowRoot!.querySelector<HTMLButtonElement>("button")!]
            : [tab as HTMLButtonElement],
    );
}

describe("p-code-playground files", () => {
    it("has no tabs without files", async () => {
        const el = await mount();

        expect(fileTabs(el)).toBeNull();
    });

    it("shows a read-only tab per file next to the code tab", async () => {
        stubFiles({ "tabs-a.txt": () => new Response("a"), "tabs-b.txt": () => new Response("b") });
        const el = await mount({ files: " media/tabs-a.txt\n media/tabs-b.txt " });
        await settle(el);

        const tabs = fileTabs(el)! as HTMLElement & { readonly: boolean };
        await (tabs as any).updateComplete;
        expect(tabs.readonly).toBe(true);
        expect(tabButtons(el).map((b) => b.textContent!.trim())).toEqual(["Code", "tabs-a.txt", "tabs-b.txt"]);
    });

    it("shows a loading state, then the file content, when a file tab is opened", async () => {
        let respond: (r: Response) => void = () => undefined;
        const pending = new Promise<Response>((resolve) => (respond = resolve));
        stubFiles({ "open-me.txt": () => pending as unknown as Response });
        const el = await mount({ files: "open-me.txt" });

        tabButtons(el)[1].click();
        await settle(el);
        expect($(el, ".file-panel")!.textContent).toContain("Loading file");
        expect($(el, "p-code")!.hidden).toBe(true);

        respond(new Response("naam;score\n"));
        await vi.waitFor(() => expect($(el, "p-file-viewer")).not.toBeNull());
        const viewer = $<
            HTMLElement & { file: { content: string }; readonly: boolean; updateComplete: Promise<boolean> }
        >(el, "p-file-viewer")!;
        expect(viewer.file.content).toBe("naam;score\n");
        expect(viewer.readonly).toBe(true);
    });

    it("passes the loaded files to the run", async () => {
        stubFiles({ "run-grades.txt": () => new Response("18\n15\n") });
        const client = fakeClient();
        const el = await mount({ client, files: "media/run-grades.txt" });

        await startRun(el);

        expect(client.workerProxy.clearWorkspace).toHaveBeenCalled();
        expect(client.workerProxy.updateFile).toHaveBeenCalledWith("run-grades.txt", "18\n15\n", false);
        await finishRun(el, client);
    });

    it("shows an alert and does not run when a file fails to load", async () => {
        stubFiles({ "gone.txt": () => new Response("Not found", { status: 404 }) });
        const client = fakeClient();
        const el = await mount({ client, files: "gone.txt" });

        button(el, "button.run").click();
        await vi.waitFor(() => expect($(el, ".file-error")).not.toBeNull());

        expect($(el, ".file-error")!.getAttribute("role")).toBe("alert");
        expect($(el, ".file-error")!.textContent).toContain("gone.txt");
        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(el.papyros.runtime.running).toBeNull();
    });

    it("runs on the next attempt once the file loads", async () => {
        const responses = [() => new Response("nope", { status: 500 }), () => new Response("fine")];
        stubFiles({ "retry.txt": () => responses.shift()!() });
        const client = fakeClient();
        const el = await mount({ client, files: "retry.txt" });

        button(el, "button.run").click();
        await vi.waitFor(() => expect($(el, ".file-error")).not.toBeNull());
        await startRun(el);

        expect($(el, ".file-error")).toBeNull();
        expect(client.workerProxy.updateFile).toHaveBeenCalledWith("retry.txt", "fine", false);
        await finishRun(el, client);
    });

    it("shows a config error for duplicate file names", async () => {
        const el = await mount({ files: "a/data.txt b/data.txt" });

        expect($(el, ".config-error")!.textContent).toContain('"data.txt"');
        expect(fileTabs(el)).toBeNull();
    });

    it("lets a real run read a declared file", async () => {
        stubFiles({ "grades.txt": () => new Response("18\n15\n") });
        const runtime = new PapyrosRuntime();
        runtimes.push(runtime);
        const el = await mount({
            runtime,
            code: 'print(open("grades.txt").read().split())',
            files: "media/grades.txt",
        });

        button(el, "button.run").click();

        await vi.waitFor(() => expect(el.outputs.map((o) => o.content).join("")).toContain("['18', '15']"), {
            timeout: 120000,
        });
    }, 180000);
});
