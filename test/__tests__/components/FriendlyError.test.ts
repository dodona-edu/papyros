import { afterEach, describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { FriendlyError, OutputType } from "../../../src/frontend/state/InputOutput";
import type { FriendlyErrorElement } from "../../../src/frontend/components/FriendlyError";
import type { Output } from "../../../src/frontend/components/Output";
import "../../../src/frontend/components/FriendlyError";
import "../../../src/frontend/components/Output";

const mounted: HTMLElement[] = [];

async function mount(error: FriendlyError, papyros: Papyros = new Papyros()): Promise<FriendlyErrorElement> {
    const el = document.createElement("p-friendly-error") as FriendlyErrorElement;
    el.papyros = papyros;
    el.error = error;
    document.body.append(el);
    mounted.push(el);
    await el.updateComplete;
    return el;
}

function $<T extends Element = HTMLElement>(el: Element, selector: string): T | null {
    return el.shadowRoot!.querySelector<T>(selector);
}

afterEach(() => {
    for (const el of mounted.splice(0)) {
        el.remove();
    }
});

describe("p-friendly-error", () => {
    it("heads the error with its name and message", async () => {
        const el = await mount({ name: "ValueError", what: "bad" });
        expect($(el, ".title")!.textContent).toBe("ValueError: bad");
    });

    it("does not repeat the name when the message already starts with it", async () => {
        const el = await mount({ name: "NameError", what: "NameError: name 'x' is not defined" });
        expect($(el, ".title")!.textContent).toBe("NameError: name 'x' is not defined");
    });

    it("heads the error with its name alone when there is no message", async () => {
        const el = await mount({ name: "KeyboardInterrupt" });
        expect($(el, ".title")!.textContent).toBe("KeyboardInterrupt");
    });

    it("offers no disclosure without a traceback", async () => {
        const el = await mount({ name: "ValueError", what: "bad" });
        expect($(el, ".traceback-toggle")).toBeNull();
    });

    it("toggles the traceback open and closed", async () => {
        const el = await mount({ name: "NameError", traceback: "Traceback line" });

        expect($(el, ".traceback-body")).toBeNull();
        const toggle = $<HTMLButtonElement>(el, ".traceback-toggle")!;
        expect(toggle.textContent).toContain("Show traceback");
        expect(toggle.querySelector(".icon[aria-hidden='true'] svg")).not.toBeNull();

        toggle.click();
        await el.updateComplete;
        expect($(el, ".traceback-body")!.textContent).toBe("Traceback line");
        expect(toggle.textContent).toContain("Hide traceback");

        toggle.click();
        await el.updateComplete;
        expect($(el, ".traceback-body")).toBeNull();
    });

    it("wires the toggle to the body it expands, outside the alert", async () => {
        const el = await mount({ name: "NameError", traceback: "Traceback line" });
        const toggle = $<HTMLButtonElement>(el, ".traceback-toggle")!;

        expect($(el, ".title")!.getAttribute("role")).toBe("alert");
        expect(toggle.getAttribute("aria-expanded")).toBe("false");
        const controls = toggle.getAttribute("aria-controls")!;
        expect(controls).not.toBe("");

        toggle.click();
        await el.updateComplete;

        expect(toggle.getAttribute("aria-expanded")).toBe("true");
        const body = $(el, ".traceback-body")!;
        expect(body.id).toBe(controls);
        expect(body.closest("[role='alert']")).toBeNull();
        expect(toggle.closest("[role='alert']")).toBeNull();
    });

    it("translates the disclosure", async () => {
        const papyros = new Papyros();
        papyros.i18n.locale = "nl";
        const el = await mount({ name: "NameError", traceback: "Traceback line" }, papyros);

        expect($(el, ".traceback-toggle")!.textContent).toContain("Toon traceback");
    });
});

describe("p-output", () => {
    it("shows friendly errors as a disclosure block, followed by why they happened", async () => {
        const papyros = new Papyros();
        const output = document.createElement("p-output") as Output;
        output.papyros = papyros;
        document.body.append(output);
        mounted.push(output);
        papyros.io.output = [
            {
                type: OutputType.stderr,
                content: { name: "ZeroDivisionError", what: "division by zero", traceback: "line 1", why: "  x / 0  " },
            },
        ];
        await output.updateComplete;

        const error = $<FriendlyErrorElement>(output, "p-friendly-error")!;
        await error.updateComplete;
        expect($(error, ".title")!.textContent).toBe("ZeroDivisionError: division by zero");
        expect($(error, ".traceback-toggle")).not.toBeNull();
        expect($(output, ".why")!.textContent).toBe("x / 0");
        expect($(output, "md-icon")).toBeNull();
    });
});
