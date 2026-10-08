import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros, papyros as globalPapyros } from "../../../src/frontend/state/Papyros";
import { PapyrosRuntime } from "../../../src/frontend/state/PapyrosRuntime";
import { PapyrosLaunchError } from "../../../src/frontend/state/PapyrosErrors";
import { OutputEntry, OutputType } from "../../../src/frontend/state/InputOutput";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { BackendEvent, BackendEventType } from "../../../src/communication/BackendEvent";
import { RunMode } from "../../../src/backend/Backend";
import type { CodePlayground } from "../../../src/frontend/components/CodePlayground";
import type { FriendlyErrorElement } from "../../../src/frontend/components/FriendlyError";
import type { CodeEditor } from "../../../src/frontend/components/code_mirror/CodeEditor";
import "../../../src/frontend/components/CodePlayground";
import { fakeClient } from "../../fakeClient";

const end: BackendEvent = { type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain" };
const output = (data: string): BackendEvent => ({ type: BackendEventType.Output, data, contentType: "text/plain" });

function failingClient(): any {
    const client = fakeClient();
    client.workerProxy.launch.mockImplementation(() => Promise.reject(new Error("launch failed")));
    return client;
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
    runtime?: PapyrosRuntime;
    client?: any;
    /** Keeps the playground in view, which is what starts the preload */
    visible?: boolean;
    /** Leaves `papyros` unset, so the playground creates its own instance */
    ownPapyros?: boolean;
}

async function mount(options: MountOptions = {}): Promise<CodePlayground> {
    const runtime = options.runtime ?? sharedRuntime(options.client ?? fakeClient());
    const el = document.createElement("p-code-playground") as CodePlayground;
    if (!options.ownPapyros) {
        el.papyros = new Papyros({ runtime });
    }
    el.code = options.code ?? "print(1)";
    if (options.label !== undefined) {
        el.label = options.label;
    }
    if (options.language !== undefined) {
        el.programmingLanguage = options.language;
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
    await vi.waitFor(() => expect(el.papyros.runtime.currentRun?.owner).toBe(el.papyros));
    const client = await clientOf(el);
    await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
    await settle(el);
    return client;
}

async function finishRun(el: CodePlayground, client: any): Promise<void> {
    client.emit(end);
    client.finishRun();
    await vi.waitFor(() => expect(el.papyros.runtime.currentRun).toBeNull());
    await settle(el);
}

async function awaitInput(el: CodePlayground, client: any, prompt: string = ""): Promise<void> {
    // Input requests only count once the worker has reported the start of the run
    client.emit({ type: BackendEventType.Start, data: "RunCode", contentType: "text/plain" });
    client.emit({ type: BackendEventType.Input, data: prompt, contentType: "text/plain" });
    await settle(el);
}

/**
 * Start a run of another instance on the runtime, which stays in progress until the
 * returned function finishes it
 */
function occupy(runtime: PapyrosRuntime): () => Promise<void> {
    const other = new Papyros({ runtime });
    void other.runner.ensureLaunched();
    void other.runner.start(RunMode.Run);
    const run = runtime.currentRun!;
    expect(run.owner).toBe(other);
    return async () => {
        const client = await other.runner.backend;
        await vi.waitFor(() => expect(client.runId).toBe(run.id));
        client.finishRun();
        await vi.waitFor(() => expect(runtime.currentRun).toBeNull());
    };
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Runs the height animations of the panels to their end */
async function finishAnimations(el: CodePlayground): Promise<void> {
    await nextFrame();
    $(el, ".panels")!
        .getAnimations()
        .forEach((animation) => animation.finish());
}

async function setOutputs(el: CodePlayground, outputs: OutputEntry[]): Promise<void> {
    el.papyros.io.output = outputs;
    await settle(el);
}

// Output from an earlier run in an 88px body, which the next run reserves
async function setPreviousOutput(el: CodePlayground): Promise<void> {
    await setOutputs(el, [{ type: OutputType.stdout, content: "a\nb\nc\n" }]);
    Object.defineProperty($(el, ".output-body")!, "offsetHeight", { value: 88, configurable: true });
}

// Fakes the scroll geometry of the output log: the content is as tall as the rendered
// transcript lines, and scrollTop clamps to the browser range 0..(scrollHeight - clientHeight),
// also when the content shrinks after it was set.
function mockScroll(log: HTMLElement, geometry: { clientHeight: number; lineHeight: number }): void {
    const scrollHeight = (): number => {
        const transcript = log.querySelector(".transcript")?.textContent ?? "";
        const lines = transcript.split("\n").length - 1;
        return Math.max(geometry.clientHeight, lines * geometry.lineHeight);
    };
    const clamp = (value: number): number => Math.max(0, Math.min(value, scrollHeight() - geometry.clientHeight));
    let scrollTop = 0;
    Object.defineProperty(log, "clientHeight", { value: geometry.clientHeight, configurable: true });
    Object.defineProperty(log, "scrollHeight", { get: scrollHeight, configurable: true });
    Object.defineProperty(log, "scrollTop", {
        get: () => clamp(scrollTop),
        set: (value: number) => {
            scrollTop = clamp(value);
        },
        configurable: true,
    });
}

afterEach(() => {
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

    it("gets its own Papyros instance on a shared runtime when none is passed", async () => {
        const first = (await mount({ ownPapyros: true })).papyros;
        const second = (await mount({ ownPapyros: true })).papyros;

        expect(first).not.toBe(globalPapyros);
        expect(first.runtime).toBe(second.runtime);
    });

    it("releases the runtime when a playground with its own instance is removed while running", async () => {
        const el = await mount({ ownPapyros: true });
        const runtime = el.papyros.runtime;
        const client = fakeClient();
        runtime.registerBackend(ProgrammingLanguage.Python, () => client);
        await startRun(el);

        el.remove();
        await Promise.resolve();

        expect(runtime.currentRun).toBeNull();
        // The interrupted code could keep the shared worker busy
        expect(client.restart).toHaveBeenCalled();
    });

    it("gives a re-inserted playground a fresh working instance", async () => {
        const el = await mount({ ownPapyros: true });
        const first = el.papyros;
        el.remove();
        await Promise.resolve();
        expect(el.papyros).toBe(globalPapyros);

        document.body.append(el);
        await el.updateComplete;

        expect(el.papyros).not.toBe(first);
        expect(el.papyros).not.toBe(globalPapyros);
        expect(el.papyros.runtime).toBe(first.runtime);
        el.papyros.runtime.registerBackend(ProgrammingLanguage.Python, () => fakeClient());
        await expect(el.papyros.runner.ensureLaunched()).resolves.toBeUndefined();
    });

    it("shows its code with Reset disabled after re-insertion gives it a fresh instance", async () => {
        const el = await mount({ ownPapyros: true, code: "print(7)" });
        el.remove();
        await Promise.resolve();

        document.body.append(el);
        await settle(el);

        expect(el.papyros.runner.code).toBe("print(7)");
        await vi.waitFor(() => expect(editorOf(el)!.value).toBe("print(7)"));
        expect(button(el, "button.reset").getAttribute("aria-disabled")).toBe("true");
    });

    it("shows its code with Reset disabled on an instance the host assigns later", async () => {
        const el = await mount({ code: "print(7)" });
        el.papyros = new Papyros({ runtime: sharedRuntime(fakeClient()) });
        await settle(el);

        expect(el.papyros.runner.code).toBe("print(7)");
        await vi.waitFor(() => expect(editorOf(el)!.value).toBe("print(7)"));
        expect(button(el, "button.reset").getAttribute("aria-disabled")).toBe("true");
    });

    it("disposes its own instance when the host assigns one, and preloads only the host's", async () => {
        const el = document.createElement("p-code-playground") as CodePlayground;
        el.code = "print(1)";
        document.body.append(el);
        mounted.push(el);
        const own = el.papyros;
        expect(own).not.toBe(globalPapyros);
        const dispose = vi.spyOn(own, "dispose");
        const ownLaunch = vi.spyOn(own.runner, "ensureLaunched");

        el.papyros = new Papyros({ runtime: sharedRuntime(fakeClient()) });
        await el.updateComplete;

        expect(dispose).toHaveBeenCalledTimes(1);
        // The playground is in view, so the host's runtime launches while the default one stays idle
        await vi.waitFor(() => expect(el.papyros.runner.backendReady).toBe(true));
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(ownLaunch).not.toHaveBeenCalled();
    });

    it("keeps its own instance when moved within the page", async () => {
        const el = await mount({ ownPapyros: true });
        const own = el.papyros;
        const dispose = vi.spyOn(own, "dispose");

        document.body.prepend(el);
        await Promise.resolve();

        expect(dispose).not.toHaveBeenCalled();
        expect(el.papyros).toBe(own);
    });

    it("does not dispose a host-provided instance when removed", async () => {
        const el = await mount();
        const host = el.papyros;
        const dispose = vi.spyOn(host, "dispose");

        el.remove();
        await Promise.resolve();

        expect(dispose).not.toHaveBeenCalled();
        expect(el.papyros).toBe(host);
    });

    it("does not dispose an instance a host assigned after connecting", async () => {
        const el = await mount({ ownPapyros: true });
        const host = new Papyros({ runtime: sharedRuntime(fakeClient()) });
        const dispose = vi.spyOn(host, "dispose");
        el.papyros = host;

        el.remove();
        await Promise.resolve();

        expect(dispose).not.toHaveBeenCalled();
        expect(el.papyros).toBe(host);
    });

    it("keeps a Papyros instance passed before it is connected", async () => {
        const el = await mount();
        expect(el.papyros.runtime).toBe(runtimes[runtimes.length - 1]);
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
        expect(client.workerProxy.runCode).toHaveBeenCalledWith(
            "print(7)",
            "run",
            expect.any(Number),
            expect.any(Number),
        );
        await finishRun(el, client);
    });

    it("shows a failed launch as an alert and leaves Run usable", async () => {
        const client = failingClient();
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
        const failing = failingClient();
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
        await setOutputs(el, [{ type: OutputType.stdout, content: "earlier\n" }]);
        const finishOther = occupy(el.papyros.runtime);
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
        expect(el.papyros.runtime.currentRun!.owner).not.toBe(el.papyros);
        expect(el.outputs).toHaveLength(1);

        await finishOther();
        await settle(el);
        expect(client.workerProxy.runCode).toHaveBeenCalledTimes(1);
        expect(run.hasAttribute("aria-disabled")).toBe(false);
    });

    it("leaves Run ungated and undescribed when nothing else is running", async () => {
        const el = await mount();
        const run = button(el, "button.run");

        expect(run.hasAttribute("aria-disabled")).toBe(false);
        expect(run.hasAttribute("aria-describedby")).toBe(false);
        expect(run.hasAttribute("title")).toBe(false);
    });

    it("offers Stop while its run waits for the runtime to load, which stops it before it begins", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const el = await mount({ client });

        const pill = button(el);
        pill.click();
        await settle(el);

        expect(pill.textContent).toContain("Stop");
        expect(pill.hasAttribute("aria-disabled")).toBe(false);
        expect($(el, ".output-body .status-line")!.textContent).toContain("Loading");

        pill.click();
        launch.finish();
        await vi.waitFor(() => expect(el.papyros.runtime.currentRun).toBeNull());
        await settle(el);
        expect(client.workerProxy.launch).toHaveBeenCalledTimes(1);
        expect(client.workerProxy.runCode).not.toHaveBeenCalled();
        expect(pill.textContent).toContain("Run");
    });

    it("never puts the native disabled attribute on the run/stop button", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const el = await mount({ client });
        const pill = button(el);
        expect(pill.hasAttribute("disabled")).toBe(false);

        pill.click();
        await el.updateComplete;
        expect(pill.hasAttribute("disabled")).toBe(false);

        launch.finish();
        await vi.waitFor(() => expect(el.papyros.runtime.currentRun?.owner).toBe(el.papyros));
        await settle(el);
        expect(pill.hasAttribute("disabled")).toBe(false);

        await finishRun(el, client);
        const finishOther = occupy(el.papyros.runtime);
        await settle(el);
        expect(pill.hasAttribute("disabled")).toBe(false);
        await finishOther();
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

        expect(reset.getAttribute("aria-disabled")).toBe("true");
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

    it("submits input on Enter without echoing it into the transcript", async () => {
        const el = await mount();
        const client = await startRun(el);
        await awaitInput(el, client);

        const input = $<HTMLInputElement>(el, ".input-row input")!;
        input.value = "Alice";
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        await vi.waitFor(() => expect(client.writeMessage).toHaveBeenCalledWith("Alice"));
        expect(el.outputs).toEqual([]);
        await settle(el);
        expect($(el, ".transcript")).toBeNull();
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
        const client = fakeClient();
        const launch = client.holdLaunch();
        const el = await mount({ client });

        button(el, "button.run").click();
        await el.updateComplete;

        const statusLine = $(el, ".output-body .status-line")!;
        expect(statusLine.textContent).toContain("Loading");

        launch.finish();
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
        await setPreviousOutput(el);

        button(el, "button.run").click();
        await el.updateComplete;
        expect($(el, ".output-body")!.style.minHeight).toBe("88px");

        const client = await clientOf(el);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(output("a\n"));
        await finishRun(el, client);

        expect($(el, ".output-body")!.style.minHeight).toBe("");
    });

    it("leaves only the alert once the launch of a run fails", async () => {
        const client = failingClient();
        const el = await mount({ client });
        el.papyros.setErrorHandler(() => undefined);
        await setPreviousOutput(el);

        button(el, "button.run").click();
        await el.updateComplete;
        expect($(el, ".output-body")!.style.minHeight).toBe("88px");

        await vi.waitFor(() => expect($(el, ".error")).not.toBeNull());
        await settle(el);
        expect($(el, ".output")).toBeNull();
    });

    it("gates the other playgrounds while a run waits for the runtime to load", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const runtime = sharedRuntime(client);
        const first = await mount({ runtime });
        const second = await mount({ runtime });
        await setPreviousOutput(second);

        button(first, "button.run").click();
        await settle(second);
        const gated = button(second, "button.run");
        expect(gated.getAttribute("aria-disabled")).toBe("true");

        gated.click();
        await settle(second);
        expect($(second, ".output-body")!.style.minHeight).toBe("");
        expect(second.outputs).toHaveLength(1);

        launch.finish();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledTimes(1));
        expect(runtime.currentRun?.owner).toBe(first.papyros);
        await finishRun(first, client);
    });

    it("does not reserve height on the first run", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const el = await mount({ client });

        button(el, "button.run").click();
        await el.updateComplete;

        expect($(el, ".output-body")!.style.minHeight).toBe("");

        launch.finish();
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
        log.scrollTop = 100;

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

    it("animates the panels as a run opens them and as Reset closes them", async () => {
        const el = await mount();
        const panels = $(el, ".panels")!;
        expect(panels.getBoundingClientRect().height).toBe(0);

        const client = await startRun(el);
        await vi.waitFor(() => expect(panels.getAnimations()).toHaveLength(1));
        client.emit(output("hi\n"));
        await finishRun(el, client);
        await finishAnimations(el);
        const open = panels.getBoundingClientRect().height;
        expect(open).toBeGreaterThan(0);

        button(el, "button.reset").click();
        await el.updateComplete;
        expect($(el, ".output")).toBeNull();
        // The emptied panels still stand at their old height, and shrink from there
        expect(panels.getBoundingClientRect().height).toBeCloseTo(open, 0);
        await vi.waitFor(() => expect(panels.getAnimations()).toHaveLength(1));
        await finishAnimations(el);
        expect(panels.getBoundingClientRect().height).toBe(0);
    });

    it("grows the log with streamed output without animating the panels", async () => {
        const el = await mount();
        const client = await startRun(el);
        client.emit(output("a\n"));
        await settle(el);
        await finishAnimations(el);
        const panels = $(el, ".panels")!;

        client.emit(output("b\n"));
        await settle(el);
        expect(panels.style.height).toBe("");
        await nextFrame();
        await nextFrame();
        expect(panels.getAnimations()).toHaveLength(0);
        await finishRun(el, client);
    });

    it("keeps the height of the panels when a block runs again", async () => {
        const el = await mount();
        await setOutputs(el, [{ type: OutputType.stdout, content: "a\nb\nc\n" }]);
        await finishAnimations(el);
        const panels = $(el, ".panels")!;
        const height = panels.getBoundingClientRect().height;

        button(el, "button.run").click();
        await settle(el);
        expect(el.outputs).toEqual([]);
        await nextFrame();
        await nextFrame();
        expect(panels.getAnimations()).toHaveLength(0);
        expect(panels.getBoundingClientRect().height).toBeCloseTo(height, 0);

        const client = await clientOf(el);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        await finishRun(el, client);
    });

    it("renders output in an output panel and each error in an error panel of its own", async () => {
        const el = await mount();
        await setOutputs(el, [
            { type: OutputType.stdout, content: "line one\n" },
            { type: OutputType.stderr, content: "a warning\n" },
            { type: OutputType.stderr, content: { name: "ValueError", what: "bad" } },
        ]);

        expect($(el, ".output .panel-label")!.textContent).toContain("Output");
        expect($(el, ".output .transcript")!.textContent).toContain("line one");

        const errors = $$(el, ".error");
        expect(errors).toHaveLength(2);
        expect(errors.map((error) => error.hasAttribute("role"))).toEqual([false, false]);

        const plain = errors[0].querySelector(".error-title")!;
        expect(plain.getAttribute("role")).toBe("alert");
        expect(plain.textContent).toContain("a warning");

        const friendly = errors[1].querySelector<FriendlyErrorElement>("p-friendly-error")!;
        await friendly.updateComplete;
        expect(friendly.shadowRoot!.querySelector(".title")!.getAttribute("role")).toBe("alert");
    });

    it("caps rendered output at maxOutputLength", async () => {
        const el = await mount();
        el.papyros.constants.maxOutputLength = 2;
        await setOutputs(el, [
            { type: OutputType.stdout, content: "one\n" },
            { type: OutputType.stdout, content: "two\n" },
            { type: OutputType.stdout, content: "three\n" },
        ]);

        expect($(el, ".output .transcript")!.textContent).toBe("one\ntwo\n");
        expect($(el, ".output .overflow")).not.toBeNull();
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
        expect(reset.title).toBe("Restore the original code and clear the output");
        expect(reset.disabled).toBe(false);
        expect(reset.getAttribute("aria-disabled")).toBe("true");
    });

    it("resets to the original code and clears the output", async () => {
        const el = await mount({ code: "print(1)" });
        await setOutputs(el, [{ type: OutputType.stdout, content: "old\n" }]);
        const editor = editorOf(el)!;
        editor.dispatchEvent(new CustomEvent("change", { detail: "edited" }));
        await el.updateComplete;

        const reset = button(el, "button.reset");
        expect(reset.hasAttribute("aria-disabled")).toBe(false);
        reset.click();
        await settle(el);

        expect(editor.value).toBe("print(1)");
        expect(el.outputs).toEqual([]);
        expect($(el, ".output")).toBeNull();

        const client = await startRun(el);
        expect(client.workerProxy.runCode).toHaveBeenCalledWith(
            "print(1)",
            "run",
            expect.any(Number),
            expect.any(Number),
        );
        await finishRun(el, client);
    });

    it("offers Reset after a run of unchanged code, and Reset closes the output panel", async () => {
        const el = await mount({ code: "print(1)" });
        const client = await startRun(el);
        client.emit(output("1\n"));
        await settle(el);
        const shown = el.outputs;
        const reset = button(el, "button.reset");
        expect(reset.getAttribute("aria-disabled")).toBe("true");

        // aria-disabled leaves the button clickable, so the click itself must be refused
        reset.click();
        await settle(el);
        expect(el.outputs).toBe(shown);

        await finishRun(el, client);
        expect(reset.hasAttribute("aria-disabled")).toBe(false);

        reset.click();
        await settle(el);
        expect(el.outputs).toEqual([]);
        expect($(el, ".output")).toBeNull();
        expect(reset.getAttribute("aria-disabled")).toBe("true");

        // Nothing is left to hold the height of on the next run
        button(el, "button.run").click();
        await el.updateComplete;
        expect($(el, ".output-body")!.style.minHeight).toBe("");
        const next = await clientOf(el);
        await vi.waitFor(() => expect(next.workerProxy.runCode).toHaveBeenCalledTimes(2));
        await finishRun(el, next);
    });

    it("offers Reset after a failed launch, and Reset clears the alert", async () => {
        const client = failingClient();
        const el = await mount({ client });
        el.papyros.setErrorHandler(() => undefined);

        button(el, "button.run").click();
        await vi.waitFor(() => expect($(el, ".error")).not.toBeNull());
        await settle(el);

        const reset = button(el, "button.reset");
        expect(reset.hasAttribute("aria-disabled")).toBe(false);
        reset.click();
        await settle(el);
        expect($(el, ".error")).toBeNull();
        expect(reset.getAttribute("aria-disabled")).toBe("true");
    });

    it("runs the edited code", async () => {
        const el = await mount({ code: "print(1)" });
        editorOf(el)!.dispatchEvent(new CustomEvent("change", { detail: "print(2)" }));
        await el.updateComplete;

        const client = await startRun(el);
        expect(client.workerProxy.runCode).toHaveBeenCalledWith(
            "print(2)",
            "run",
            expect.any(Number),
            expect.any(Number),
        );
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
        expect(button(el, "button.reset").title).toBe("Oorspronkelijke code herstellen en uitvoer wissen");
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
        const failing = failingClient();
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
