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

    it("shows where the error happened, with the explanation and the full traceback behind the toggle", async () => {
        const full = 'File "LOCAL:/papyros/papyros.py", line 1\n  File "/__main__.py", line 2, in <module>\n    1/0';
        const el = await mount({
            name: "ZeroDivisionError",
            info: "Dividing by zero is undefined.\n",
            traceback: full,
            where: '\n  File "/__main__.py", line 2, in <module>\n    1/0\n',
        });

        expect($(el, ".where")!.textContent).toBe('File "/__main__.py", line 2, in <module>\n    1/0');
        expect($(el, ".where")!.closest("[hidden]")).toBeNull();
        const body = $(el, ".traceback-body")!;
        expect(body.hidden).toBe(true);
        expect(body.querySelector(".info")!.textContent).toBe("Dividing by zero is undefined.");
        expect(body.querySelector(".traceback")!.textContent).toBe(full);
    });

    it("shows nothing extra without a location, and keeps the full traceback behind the toggle", async () => {
        const el = await mount({ name: "ZeroDivisionError", traceback: "Traceback line", where: "  " });

        expect($(el, ".where")).toBeNull();
        expect($(el, ".info")).toBeNull();
        expect($(el, ".traceback-body")!.hidden).toBe(true);
        expect($(el, ".traceback")!.textContent).toBe("Traceback line");
    });

    it("toggles the traceback with the hidden attribute, without adding or removing nodes", async () => {
        const el = await mount({ name: "NameError", traceback: "Traceback line" });
        const body = $(el, ".traceback-body")!;
        const nodes = el.shadowRoot!.querySelectorAll("*").length;

        expect(body.hidden).toBe(true);
        const toggle = $<HTMLButtonElement>(el, ".traceback-toggle")!;
        expect(toggle.textContent).toContain("Show traceback");
        expect(toggle.querySelector(".icon[aria-hidden='true'] svg")).not.toBeNull();

        toggle.click();
        await el.updateComplete;
        expect($(el, ".traceback-body")).toBe(body);
        expect(body.hidden).toBe(false);
        expect(toggle.textContent).toContain("Hide traceback");
        expect(el.shadowRoot!.querySelectorAll("*").length).toBe(nodes);

        toggle.click();
        await el.updateComplete;
        expect(body.hidden).toBe(true);
        expect(el.shadowRoot!.querySelectorAll("*").length).toBe(nodes);
    });

    it("wires the toggle to the body it expands", async () => {
        const el = await mount({ name: "NameError", traceback: "Traceback line" });
        const toggle = $<HTMLButtonElement>(el, ".traceback-toggle")!;

        expect(toggle.getAttribute("aria-expanded")).toBe("false");
        const controls = toggle.getAttribute("aria-controls")!;
        expect($(el, ".traceback-body")!.id).toBe(controls);

        toggle.click();
        await el.updateComplete;

        expect(toggle.getAttribute("aria-expanded")).toBe("true");
    });

    it("announces only the title as an alert, and only when asked to", async () => {
        const quiet = await mount({ name: "NameError", where: "line 1", traceback: "Traceback line" });
        expect(quiet.shadowRoot!.querySelector("[role='alert']")).toBeNull();

        const el = await mount({ name: "NameError", where: "line 1", traceback: "Traceback line" });
        el.alert = true;
        await el.updateComplete;
        expect(el.shadowRoot!.querySelectorAll("[role='alert']")).toHaveLength(1);
        expect($(el, ".title")!.getAttribute("role")).toBe("alert");
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
        // p-output's log announces the error already
        expect(error.shadowRoot!.querySelector("[role='alert']")).toBeNull();
        expect($(output, ".why")!.textContent).toBe("x / 0");
        expect($(output, "md-icon")).toBeNull();
    });
});
