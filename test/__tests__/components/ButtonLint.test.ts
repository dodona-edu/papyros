import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunState } from "../../../src/frontend/state/Runner";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { fakeClient } from "../../fakeClient";
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

    it("offers Run while the backend starts, and Stop once a run waits for it", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const papyros = new Papyros();
        papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
        const element = document.createElement("p-button-lint") as ButtonLint;
        element.papyros = papyros;
        document.body.append(element);

        const launching = papyros.runner.launch();
        await element.updateComplete;
        expect(papyros.runner.state).toBe(RunState.Loading);
        expect(buttons(element).map((b) => b.textContent!.trim())).toEqual(["Run", "Debug"]);
        expect(buttons(element).every((b) => !b.hasAttribute("disabled"))).toBe(true);

        buttons(element)[0].click();
        await element.updateComplete;
        expect(papyros.runtime.isRunning(papyros)).toBe(true);
        expect(buttons(element).map((b) => b.textContent!.trim())).toEqual(["Stop"]);

        launch.finish();
        await launching;
        await element.updateComplete;
        expect(buttons(element).map((b) => b.textContent!.trim())).toEqual(["Stop"]);

        element.remove();
        papyros.dispose();
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
