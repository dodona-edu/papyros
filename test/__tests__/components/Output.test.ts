import { afterEach, describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { OutputEntry, OutputType, TURTLE_TAB } from "../../../src/frontend/state/InputOutput";
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

function atEnd(): boolean {
    return content().scrollTop + content().clientHeight >= content().scrollHeight - 1;
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
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
        expect(atEnd()).toBe(true);
    });

    it("keeps following the newest line when an inline image loads", async () => {
        await mount();
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 300;
        const png = canvas.toDataURL("image/png").split(",")[1];
        const text = (content: string): OutputEntry => ({ type: OutputType.stdout, content });

        element.papyros.io.output = [
            ...Array.from({ length: 5 }, (_, i) => text(`line ${i}\n`)),
            { type: OutputType.img, content: png, contentType: "image/png;base64" },
            text("after the image\n"),
        ];
        await element.updateComplete;
        await element.shadowRoot!.querySelector("img")!.decode();
        await nextFrame();
        await nextFrame();
        expect(atEnd()).toBe(true);

        element.papyros.io.output = [...element.papyros.io.output, text("one more line\n")];
        await element.updateComplete;
        expect(atEnd()).toBe(true);
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
