import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunState } from "../../../src/frontend/state/Runner";
import type { ButtonLint } from "../../../src/frontend/components/code_runner/ButtonLint";
import "../../../src/frontend/components/code_runner/ButtonLint";

function buttons(element: ButtonLint): HTMLElement[] {
    return Array.from(element.shadowRoot!.querySelectorAll("md-filled-button, md-outlined-button"));
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
});
