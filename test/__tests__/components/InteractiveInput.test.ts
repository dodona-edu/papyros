import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import type { InteractiveInput } from "../../../src/frontend/components/input/InteractiveInput";
import type { Input } from "../../../src/frontend/components/Input";
import "../../../src/frontend/components/input/InteractiveInput";
import "../../../src/frontend/components/Input";
import { RunStatus } from "../../../src/frontend/state/Runner";

const mounted: HTMLElement[] = [];

async function mount(): Promise<InteractiveInput> {
    const papyros = new Papyros();
    papyros.runner.run = { status: RunStatus.AwaitingInput, prompt: "" };
    vi.spyOn(papyros.io, "provideInput").mockImplementation(() => undefined);
    const el = document.createElement("p-interactive-input") as InteractiveInput;
    el.papyros = papyros;
    document.body.append(el);
    mounted.push(el);
    await el.updateComplete;
    el.value = "こんにちは";
    await el.updateComplete;
    return el;
}

function pressEnter(el: InteractiveInput, init: KeyboardEventInit = {}): void {
    el.shadowRoot!.querySelector("md-outlined-text-field")!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, ...init }),
    );
}

afterEach(() => {
    for (const el of mounted.splice(0)) {
        el.remove();
    }
});

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

describe("p-interactive-input", () => {
    it("submits the line on Enter", async () => {
        const el = await mount();
        pressEnter(el);

        expect(el.papyros.io.provideInput).toHaveBeenCalledWith("こんにちは");
        expect(el.value).toBe("");
    });

    it.each([
        { browser: "most browsers", init: { isComposing: true } },
        { browser: "Safari", init: { keyCode: 229 } },
    ])("ignores the Enter that confirms composed IME text in $browser", async ({ init }) => {
        const el = await mount();
        pressEnter(el, init);

        expect(el.papyros.io.provideInput).not.toHaveBeenCalled();
        expect(el.value).toBe("こんにちは");
    });
});
