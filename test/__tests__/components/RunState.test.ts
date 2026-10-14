import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunState } from "../../../src/frontend/state/Runner";
import { prefersReducedMotion } from "../../../src/frontend/components/motion";
import type { RunStateEl } from "../../../src/frontend/components/code_runner/RunState";
import "../../../src/frontend/components/code_runner/RunState";

// Spies that call through, so a single test can ask for reduced motion
vi.mock("../../../src/frontend/components/motion", { spy: true });

let element: RunStateEl;

async function mountRunning(): Promise<RunStateEl> {
    element = document.createElement("p-run-state") as RunStateEl;
    element.papyros = new Papyros();
    document.body.append(element);
    element.papyros.runner.setState(RunState.Running);
    await element.updateComplete;
    return element;
}

afterEach(() => {
    element.remove();
    vi.mocked(prefersReducedMotion).mockRestore();
});

describe("RunState", () => {
    it("shows a spinner next to the message while code runs", async () => {
        await mountRunning();
        expect(element.shadowRoot!.querySelector("md-circular-progress")).not.toBeNull();
        expect(element.shadowRoot!.querySelector(".message")!.textContent).toBe("Running");
    });

    it("leaves the spinner out under reduced motion, and keeps the message", async () => {
        vi.mocked(prefersReducedMotion).mockReturnValue(true);
        await mountRunning();
        expect(element.shadowRoot!.querySelector("md-circular-progress")).toBeNull();
        expect(element.shadowRoot!.querySelector('[role="status"] .message')!.textContent).toBe("Running");
    });
});
