import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import type { InteractiveInput } from "../../../src/frontend/components/input/InteractiveInput";
import "../../../src/frontend/components/input/InteractiveInput";

describe("InteractiveInput", () => {
    it("renders the field and the Enter button 40px high", async () => {
        const element = document.createElement("p-interactive-input") as InteractiveInput;
        element.papyros = new Papyros();
        document.body.append(element);
        await element.updateComplete;

        const field = element.shadowRoot!.querySelector("md-outlined-text-field") as HTMLElement & {
            updateComplete: Promise<boolean>;
        };
        const button = element.shadowRoot!.querySelector("md-outlined-button") as HTMLElement;
        await field.updateComplete;
        expect(field.getBoundingClientRect().height).toBe(40);
        expect(button.getBoundingClientRect().height).toBe(40);

        element.remove();
    });
});
