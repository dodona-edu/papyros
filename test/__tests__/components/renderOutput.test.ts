import { afterEach, describe, expect, it } from "vitest";
import { render } from "lit";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { OutputType } from "../../../src/frontend/state/InputOutput";
import {
    outputAsText,
    renderEntry,
    renderOverflow,
} from "../../../src/frontend/components/output/renderOutput";
import type { Output } from "../../../src/frontend/components/Output";
import "../../../src/frontend/components/Output";

const mounted: HTMLElement[] = [];

function container(): HTMLElement {
    const el = document.createElement("div");
    document.body.append(el);
    mounted.push(el);
    return el;
}

afterEach(() => {
    for (const el of mounted.splice(0)) {
        el.remove();
    }
});

describe("renderEntry", () => {
    it("renders an image as a data URL built from its content type, with a translated alt", () => {
        const el = container();
        render(renderEntry({ type: OutputType.img, content: "AAAA", contentType: "image/png;base64" }, new Papyros()), el);

        const img = el.querySelector("img")!;
        expect(img.getAttribute("src")).toBe("data:image/png;base64,AAAA");
        expect(img.getAttribute("alt")).toBe("Image output");
    });

    it("assumes a base64 PNG for an image without a content type", () => {
        const el = container();
        render(renderEntry({ type: OutputType.img, content: "AAAA" }, new Papyros()), el);

        expect(el.querySelector("img")!.getAttribute("src")).toBe("data:image/png;base64,AAAA");
    });

    it("prefixes a plain error for screen readers only", () => {
        const el = container();
        render(renderEntry({ type: OutputType.stderr, content: "oops" }, new Papyros()), el);

        expect(el.querySelector(".error .visually-hidden")!.textContent).toBe("Error: ");
        expect(el.querySelector(".error")!.textContent).toBe("Error: oops");
    });

    it("follows a friendly error with why it happened", () => {
        const el = container();
        render(
            renderEntry(
                { type: OutputType.stderr, content: { name: "ZeroDivisionError", why: "  x / 0  " } },
                new Papyros(),
            ),
            el,
        );

        expect(el.querySelector(".error p-friendly-error")).not.toBeNull();
        expect(el.querySelector(".error .why")!.textContent).toBe("x / 0");
    });

    it("leaves out why when the error has none", () => {
        const el = container();
        render(renderEntry({ type: OutputType.stderr, content: { name: "ValueError" } }, new Papyros()), el);

        expect(el.querySelector(".why")).toBeNull();
    });
});

describe("renderOverflow", () => {
    it("downloads the output that is not shown", async () => {
        const papyros = new Papyros();
        papyros.io.output = [
            { type: OutputType.stdout, content: "shown\n" },
            { type: OutputType.stdout, content: "hidden\n" },
            { type: OutputType.stderr, content: "oops" },
        ];
        const el = container();
        render(renderOverflow(papyros, 1), el);

        expect(el.textContent).toContain("Output truncated. No more results will be shown.");
        const link = el.querySelector<HTMLAnchorElement>("a[download]")!;
        expect(link.getAttribute("download")).toBe("papyros_output.txt");

        // Keep the test page from following the download link
        el.addEventListener("click", (e) => e.preventDefault());
        link.click();

        expect(link.href).toMatch(/^blob:/);
        expect(await (await fetch(link.href)).text()).toBe("hidden\nError: oops\n");
    });

    it("writes friendly errors and images out as text", () => {
        expect(
            outputAsText([
                { type: OutputType.img, content: "AAAA", contentType: "image/png;base64" },
                {
                    type: OutputType.stderr,
                    content: { name: "ValueError", info: "info", traceback: "tb", what: " bad ", why: " because " },
                },
            ]),
        ).toBe(
            "[Image output of type image/png;base64 omitted]\n" +
                "Error: ValueError\nInfo: info\nTraceback: tb\nWhat: bad\nWhy: because\n",
        );
    });
});

describe("p-output", () => {
    async function mountOutput(papyros: Papyros): Promise<Output> {
        const output = document.createElement("p-output") as Output;
        output.papyros = papyros;
        document.body.append(output);
        mounted.push(output);
        await output.updateComplete;
        return output;
    }

    it("renders its entries with the shared markup and offers the overflow as a download", async () => {
        const papyros = new Papyros();
        papyros.constants.maxOutputLength = 2;
        papyros.io.output = [
            { type: OutputType.stdout, content: "text\n" },
            { type: OutputType.img, content: "AAAA", contentType: "image/png;base64" },
            { type: OutputType.stdout, content: "cut off\n" },
        ];
        const output = await mountOutput(papyros);
        const root = output.shadowRoot!;

        expect(root.querySelector("pre[role='log']")!.textContent).toContain("text");
        expect(root.querySelector("pre[role='log']")!.textContent).not.toContain("cut off");
        expect(root.querySelector("img.output-img")!.getAttribute("src")).toBe("data:image/png;base64,AAAA");
        expect(root.querySelector(".overflow a[download]")).not.toBeNull();
    });
});
