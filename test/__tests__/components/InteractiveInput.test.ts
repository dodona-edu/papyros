import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import type { InteractiveInput } from "../../../src/frontend/components/input/InteractiveInput";
import type { Input } from "../../../src/frontend/components/Input";
import "../../../src/frontend/components/input/InteractiveInput";
import "../../../src/frontend/components/Input";

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

    it("shows the Enter button as a named icon button in a narrow input panel", async () => {
        const element = document.createElement("p-input") as Input;
        element.papyros = new Papyros();
        element.style.width = "358px";
        document.body.append(element);
        await element.updateComplete;
        const interactive = element.shadowRoot!.querySelector("p-interactive-input") as InteractiveInput;
        await interactive.updateComplete;

        const labelled = interactive.shadowRoot!.querySelector("md-outlined-button") as HTMLElement;
        const icon = interactive.shadowRoot!.querySelector("md-outlined-icon-button") as HTMLElement;
        expect(labelled.getClientRects().length).toBe(0);
        expect(icon.getClientRects().length).toBeGreaterThan(0);
        expect(icon.getAttribute("aria-label")).toBe("Enter");
        expect(icon.title).toBe("Enter");

        element.remove();
    });
});
