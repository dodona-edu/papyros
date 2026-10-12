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

function lines(count: number): OutputEntry[] {
    return Array.from({ length: count }, (_, i) => ({ type: OutputType.stdout, content: `line ${i}\n` }));
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Scrolls up the way a reader does, after the panel has settled at the end. */
async function scrollToTop(): Promise<void> {
    await nextFrame();
    await nextFrame();
    content().scrollTop = 0;
    await nextFrame();
    await nextFrame();
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

    it("follows the output of a new run after the reader scrolled up in the previous one", async () => {
        await mount();
        element.papyros.io.output = lines(20);
        await element.updateComplete;
        await scrollToTop();
        expect(atEnd()).toBe(false);

        element.papyros.io.output = [];
        await element.updateComplete;
        element.papyros.io.output = lines(20);
        await element.updateComplete;
        expect(atEnd()).toBe(true);
    });

    it("follows the output again once it fits in the panel", async () => {
        await mount();
        element.papyros.io.output = lines(20);
        await element.updateComplete;
        await scrollToTop();

        element.papyros.io.output = lines(1);
        await element.updateComplete;
        element.papyros.io.output = lines(20);
        await element.updateComplete;
        expect(atEnd()).toBe(true);
    });

    it("keeps its live region in the page while there is no output, so the first line is announced", async () => {
        await mount();
        const log = element.shadowRoot!.querySelector("[role=log]")!;
        expect(log.textContent).toBe("");
        expect(log.closest(".place-holder")).toBeNull();
        expect(log.querySelector(".place-holder")).toBeNull();

        element.papyros.io.output = lines(1);
        await element.updateComplete;
        expect(element.shadowRoot!.querySelector("[role=log]")).toBe(log);
        expect(log.textContent).toBe("line 0\n");
        expect(element.shadowRoot!.querySelector(".place-holder")).toBeNull();
    });

    it("says that nothing was printed yet at the current debug step", async () => {
        await mount();
        element.papyros.debugger.active = true;
        await element.updateComplete;

        expect(element.shadowRoot!.querySelector(".place-holder")!.textContent!.trim()).toBe(
            "Nothing printed yet at this step",
        );
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
