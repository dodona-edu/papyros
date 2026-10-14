import { afterEach, describe, expect, it, vi } from "vitest";
import type { Frame } from "@dodona/trace-component/dist/trace_types";
import type { TraceComponent } from "@dodona/trace-component";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunState } from "../../../src/frontend/state/Runner";
import { RunMode } from "../../../src/backend/Backend";
import type { Debugger } from "../../../src/frontend/components/Debugger";
import "../../../src/frontend/components/Debugger";

function frame(line: number): Frame {
    return {
        line,
        event: "step_line",
        func_name: "<module>",
        globals: {},
        ordered_globals: [],
        stack_to_render: [],
        heap: {},
    };
}

let element: Debugger;

async function mount(withTrace = true): Promise<Debugger> {
    element = document.createElement("p-debugger") as Debugger;
    element.papyros = new Papyros();
    document.body.append(element);
    if (withTrace) {
        element.papyros.debugger.active = true;
        element.papyros.debugger.trace = [frame(1), frame(2), frame(3)];
    }
    await element.updateComplete;
    return element;
}

function stepper(): HTMLElement {
    return element.shadowRoot!.querySelector<HTMLElement>(".stepper")!;
}

function trace(): TraceComponent {
    return element.shadowRoot!.querySelector("tc-trace")!;
}

function debugButton(): HTMLElement {
    return element.shadowRoot!.querySelector<HTMLElement>("md-outlined-button")!;
}

function title(): string | undefined {
    return element.shadowRoot!.querySelector(".message-title")?.textContent!.trim();
}

/** Waits until the step on screen has rendered, arrows included. */
async function settle(): Promise<void> {
    await element.updateComplete;
    if (!trace()) return;
    await trace().updateComplete;
    const step = trace().shadowRoot!.querySelector<HTMLElement & { deepUpdateComplete: Promise<void> }>("tc-frame");
    await step?.deepUpdateComplete;
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

afterEach(async () => {
    await settle();
    element.remove();
});

describe("Debugger", () => {
    it("shows its step controls in the picker slot of tc-trace, instead of the built-in picker", async () => {
        await mount();
        await trace().updateComplete;

        expect(stepper().assignedSlot?.name).toBe("picker");
        expect(stepper().getClientRects().length).toBe(1);
        expect(trace().shadowRoot!.querySelector("tc-frame-picker")!.getClientRects().length).toBe(0);
    });

    it("names the step controls after their visible label", async () => {
        await mount();
        const label = element.shadowRoot!.getElementById(stepper().getAttribute("aria-labelledby")!)!;
        expect(label.textContent!.trim()).toBe("Step");
        expect(label.getAttribute("aria-hidden")).toBe("true");
    });

    it("steps through the trace with the controls in its header bar", async () => {
        await mount();
        expect(stepper().querySelector("output")!.textContent!.trim()).toBe("1 / 3");

        const [, , next] = stepper().querySelectorAll<HTMLElement>("md-icon-button");
        expect(next.ariaLabel).toBe("Next step");
        next.click();
        await element.updateComplete;
        expect(element.papyros.debugger.activeFrame).toBe(1);
        expect(stepper().querySelector("output")!.textContent!.trim()).toBe("2 / 3");
        expect(trace().selectedFrame).toBe(1);
    });

    it("keeps focus on a step button that it disables, and ignores clicks on it", async () => {
        await mount();
        const [, , next, last] = stepper().querySelectorAll<HTMLElement & { updateComplete: Promise<boolean> }>(
            "md-icon-button",
        );
        last.focus();
        last.click();
        await element.updateComplete;
        await last.updateComplete;
        await nextFrame();

        expect(element.papyros.debugger.activeFrame).toBe(2);
        expect(last.hasAttribute("soft-disabled")).toBe(true);
        expect(element.shadowRoot!.activeElement).toBe(last);

        next.click();
        await element.updateComplete;
        expect(element.papyros.debugger.activeFrame).toBe(2);
    });

    it("follows a step picked in the built-in picker of tc-trace", async () => {
        await mount();
        await trace().updateComplete;

        trace()
            .shadowRoot!.querySelector("tc-frame-picker")!
            .dispatchEvent(new CustomEvent("frame-change", { detail: { frame: 2 }, bubbles: true, composed: true }));
        await element.updateComplete;
        expect(element.papyros.debugger.activeFrame).toBe(2);
    });

    it("invites a first debug run with the Debug button of the code bar", async () => {
        await mount(false);
        const start = vi.spyOn(element.papyros.runner, "start").mockResolvedValue();
        expect(title()).toBe("Debug your code");
        expect(debugButton().textContent!.trim()).toBe("Debug");

        debugButton().click();
        expect(start).toHaveBeenCalledWith(RunMode.Debug);
    });

    it("says that the debugger stopped once the debug run is closed", async () => {
        await mount();
        element.papyros.debugger.active = false;
        await element.updateComplete;
        expect(trace()).toBeNull();
        expect(title()).toBe("The debugger has stopped");
    });

    it("disables its Debug button while another run is in progress", async () => {
        await mount(false);
        element.papyros.runner.setState(RunState.Running);
        await element.updateComplete;
        expect(debugButton().hasAttribute("disabled")).toBe(true);
    });

    it("keeps focus in the pane from its Debug button to the first step control", async () => {
        await mount(false);
        debugButton().focus();
        expect(element.shadowRoot!.activeElement).toBe(debugButton());

        element.papyros.debugger.active = true;
        element.papyros.runner.setState(RunState.Loading);
        await element.updateComplete;
        await nextFrame();
        expect(element.shadowRoot!.activeElement).toBe(element.shadowRoot!.querySelector(".body"));

        element.papyros.debugger.trace = [frame(1), frame(2)];
        await element.updateComplete;
        await nextFrame();
        expect(element.shadowRoot!.activeElement).toBe(stepper().querySelector("md-icon-button"));
    });

    it("shows a named progress bar until the first step of a debug run arrives", async () => {
        await mount(false);
        element.papyros.debugger.active = true;
        element.papyros.runner.setState(RunState.Loading);
        await element.updateComplete;
        const progress = element.shadowRoot!.querySelector("md-linear-progress")!;
        expect(progress.getAttribute("aria-label")).toBe("Preparing the debugger\u2026");
        expect(debugButton()).toBeNull();

        element.papyros.debugger.trace = [frame(1)];
        await element.updateComplete;
        expect(element.shadowRoot!.querySelector("md-linear-progress")).toBeNull();
        expect(trace()).not.toBeNull();
    });
});
