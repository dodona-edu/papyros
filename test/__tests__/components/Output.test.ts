import { afterEach, describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { OutputType, TURTLE_TAB } from "../../../src/frontend/state/InputOutput";
import type { Output } from "../../../src/frontend/components/Output";
import "../../../src/frontend/components/Output";

let element: Output;

async function mount(): Promise<Output> {
    element = document.createElement("p-output") as Output;
    element.papyros = new Papyros();
    document.body.append(element);
    await element.updateComplete;
    return element;
}

function content(): HTMLElement {
    return element.shadowRoot!.querySelector<HTMLElement>(".content")!;
}

afterEach(() => {
    element.remove();
});

describe("Output", () => {
    it("shows only its title until a program draws, then the Text and Turtle tabs", async () => {
        await mount();
        expect(element.shadowRoot!.querySelector(".pane-label")!.textContent!.trim()).toBe("Output");
        expect(element.shadowRoot!.querySelectorAll("[role=tab]").length).toBe(0);

        element.papyros.io.hasTurtleOutput = true;
        await element.updateComplete;
        const tabs = Array.from(element.shadowRoot!.querySelectorAll("[role=tab]"));
        expect(tabs.map((tab) => tab.textContent!.trim())).toEqual(["Text", "Turtle"]);
    });

    it("grows up to its maximum height and then follows the newest line", async () => {
        await mount();
        const oneLine = element.getBoundingClientRect().height;

        element.papyros.io.output = Array.from({ length: 20 }, (_, i) => ({
            type: OutputType.stdout,
            content: `line ${i}\n`,
        }));
        await element.updateComplete;

        expect(element.getBoundingClientRect().height).toBeGreaterThan(oneLine);
        expect(element.getBoundingClientRect().height).toBeLessThanOrEqual(160);
        expect(content().scrollHeight).toBeGreaterThan(content().clientHeight);
        expect(content().scrollTop + content().clientHeight).toBeGreaterThanOrEqual(content().scrollHeight - 1);
    });

    it("takes the turtle height on the Turtle tab", async () => {
        await mount();
        element.papyros.io.hasTurtleOutput = true;
        element.papyros.io.selectOutputTab(TURTLE_TAB);
        await element.updateComplete;

        expect(element.getAttribute("active-tab")).toBe(TURTLE_TAB);
        expect(element.getBoundingClientRect().height).toBe(380);
    });
});
