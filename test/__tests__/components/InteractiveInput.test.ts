import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import type { InteractiveInput } from "../../../src/frontend/components/input/InteractiveInput";
import "../../../src/frontend/components/input/InteractiveInput";

const mounted: HTMLElement[] = [];

async function mount(): Promise<InteractiveInput> {
    const papyros = new Papyros();
    papyros.io.awaitingInput = true;
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

function pressEnter(el: InteractiveInput, isComposing: boolean): void {
    el.shadowRoot!.querySelector("md-outlined-text-field")!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", isComposing, bubbles: true, cancelable: true }),
    );
}

afterEach(() => {
    for (const el of mounted.splice(0)) {
        el.remove();
    }
});

describe("p-interactive-input", () => {
    it("submits the line on Enter", async () => {
        const el = await mount();
        pressEnter(el, false);

        expect(el.papyros.io.provideInput).toHaveBeenCalledWith("こんにちは");
        expect(el.value).toBe("");
    });

    it("ignores the Enter that confirms composed IME text", async () => {
        const el = await mount();
        pressEnter(el, true);

        expect(el.papyros.io.provideInput).not.toHaveBeenCalled();
        expect(el.value).toBe("こんにちは");
    });
});
