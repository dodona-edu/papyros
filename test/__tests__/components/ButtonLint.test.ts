import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunState } from "../../../src/frontend/state/Runner";
import type { ButtonLint } from "../../../src/frontend/components/code_runner/ButtonLint";
import "../../../src/frontend/components/code_runner/ButtonLint";

function buttons(element: ButtonLint): HTMLElement[] {
    return Array.from(element.shadowRoot!.querySelectorAll("md-filled-button, md-outlined-button"));
}

// Focus-follow is deferred to the next frame, so newly created md-* buttons have
// finished their own initial render before .focus() is called on them.
function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe("ButtonLint", () => {
    it("offers inert run controls instead of a stop button when the backend failed", async () => {
        const element = document.createElement("p-button-lint") as ButtonLint;
        element.papyros = new Papyros();
        document.body.append(element);

        await element.updateComplete;
        expect(buttons(element).map((b) => b.textContent!.trim())).toEqual(["Run", "Debug"]);
        expect(buttons(element).every((b) => !b.hasAttribute("disabled"))).toBe(true);

        element.papyros.runner.setState(RunState.Error);
        await element.updateComplete;
        expect(buttons(element).map((b) => b.textContent!.trim())).toEqual(["Run", "Debug"]);
        expect(buttons(element).every((b) => b.hasAttribute("disabled"))).toBe(true);

        element.papyros.runner.setState(RunState.Running);
        await element.updateComplete;
        expect(buttons(element).map((b) => b.textContent!.trim())).toEqual(["Stop"]);

        element.remove();
    });

    it("moves focus to the next button set when the user was driving this component", async () => {
        const element = document.createElement("p-button-lint") as ButtonLint;
        element.papyros = new Papyros();
        document.body.append(element);
        await element.updateComplete;

        const runButton = buttons(element)[0];
        runButton.focus();
        expect(element.shadowRoot!.activeElement).toBe(runButton);

        element.papyros.runner.setState(RunState.Running);
        await element.updateComplete;
        await nextFrame();
        const stopButton = buttons(element)[0];
        expect(stopButton.textContent!.trim()).toBe("Stop");
        expect(element.shadowRoot!.activeElement).toBe(stopButton);

        element.papyros.runner.setState(RunState.Ready);
        await element.updateComplete;
        await nextFrame();
        const nextRunButton = buttons(element)[0];
        expect(nextRunButton.textContent!.trim()).toBe("Run");
        expect(element.shadowRoot!.activeElement).toBe(nextRunButton);

        element.remove();
    });

    it("never steals focus when the user was driving something else", async () => {
        const element = document.createElement("p-button-lint") as ButtonLint;
        element.papyros = new Papyros();
        document.body.append(element);
        await element.updateComplete;

        const input = document.createElement("input");
        document.body.append(input);
        input.focus();
        expect(document.activeElement).toBe(input);

        element.papyros.runner.setState(RunState.Running);
        await element.updateComplete;
        expect(buttons(element).map((b) => b.textContent!.trim())).toEqual(["Stop"]);
        expect(document.activeElement).toBe(input);

        input.remove();
        element.remove();
    });
});
