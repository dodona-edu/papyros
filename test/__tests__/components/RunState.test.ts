import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunLifecycle, RunOutcome, RunStatus } from "../../../src/frontend/state/Runner";
import { prefersReducedMotion } from "../../../src/frontend/components/motion";
import type { RunStateEl } from "../../../src/frontend/components/code_runner/RunState";
import "../../../src/frontend/components/code_runner/RunState";
import { emulateReducedMotion } from "../../helpers";

// Spies that call through, so a single test can ask for reduced motion
vi.mock("../../../src/frontend/components/motion", { spy: true });

let element: RunStateEl;

async function mount(run: RunLifecycle): Promise<RunStateEl> {
    element = document.createElement("p-run-state") as RunStateEl;
    element.papyros = new Papyros();
    document.body.append(element);
    element.papyros.runner.run = run;
    await element.updateComplete;
    return element;
}

function mountRunning(): Promise<RunStateEl> {
    return mount({ status: RunStatus.Running });
}

function message(): string {
    return element.shadowRoot!.querySelector(".message")!.textContent!;
}

function spinner(): Element | null {
    return element.shadowRoot!.querySelector("md-circular-progress");
}

afterEach(async () => {
    element.remove();
    vi.mocked(prefersReducedMotion).mockRestore();
    await emulateReducedMotion(false);
});

describe("RunState", () => {
    it("shows a spinner next to the message while code runs", async () => {
        await mountRunning();
        expect(element.shadowRoot!.querySelector("md-circular-progress")).not.toBeNull();
        expect(element.shadowRoot!.querySelector(".message")!.textContent).toBe("Running");
    });

    it("keeps the spinner while the run awaits input", async () => {
        await mount({ status: RunStatus.AwaitingInput, prompt: "Name: " });
        expect(spinner()).not.toBeNull();
        expect(message()).toBe("Awaiting input");
    });

    it("shows how long a crashed run took, without a spinner", async () => {
        await mount({ status: RunStatus.Ended, outcome: RunOutcome.Crashed, duration: 1500 });
        expect(spinner()).toBeNull();
        expect(message()).toBe("Code crashed after 1.5 s");
        expect(element.hasAttribute("empty")).toBe(false);
    });

    it("leaves the spinner out under reduced motion, and keeps the message", async () => {
        vi.mocked(prefersReducedMotion).mockReturnValue(true);
        await mountRunning();
        expect(element.shadowRoot!.querySelector("md-circular-progress")).toBeNull();
        expect(element.shadowRoot!.querySelector('[role="status"] .message')!.textContent).toBe("Running");
    });

    it("follows a change of the preference during a run", async () => {
        await mountRunning();
        expect(spinner()).not.toBeNull();

        await emulateReducedMotion(true);
        await expect.poll(spinner).toBeNull();

        await emulateReducedMotion(false);
        await expect.poll(spinner).not.toBeNull();
    });
});
