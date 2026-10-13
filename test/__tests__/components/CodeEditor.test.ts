import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import type { EditorView } from "@codemirror/view";
import { undo } from "@codemirror/commands";
import { DUTCH_TRANSLATION, ENGLISH_TRANSLATION } from "../../../src/frontend/state/Translations";
import type { CodeEditor } from "../../../src/frontend/components/code_mirror/CodeEditor";
import type { CodeMirrorEditor } from "../../../src/frontend/components/code_mirror/CodeMirrorEditor";
import "../../../src/frontend/components/code_mirror/CodeEditor";
import "../../../src/frontend/components/code_mirror/FileEditor";

describe("CodeEditor", () => {
    it("describes how to leave the editor on the editable content", async () => {
        const element = document.createElement("p-code-editor") as CodeEditor;
        element.translations = ENGLISH_TRANSLATION.CodeMirror;
        document.body.append(element);
        await element.updateComplete;

        const shadowRoot = element.shadowRoot!;
        const content = shadowRoot.querySelector(".cm-content")!;
        const hintId = content.getAttribute("aria-describedby")!;
        expect(hintId).toBeTruthy();

        const hint = shadowRoot.getElementById(hintId);
        expect(hint?.textContent).toBe("Press Escape followed by Tab to leave the code editor.");

        element.translations = DUTCH_TRANSLATION.CodeMirror;
        await element.updateComplete;
        expect(hint?.textContent).toBe("Druk op Escape en daarna Tab om de code-editor te verlaten.");

        element.remove();
    });

    it("leaves a valid selection when the value is replaced from outside", async () => {
        const element = document.createElement("p-code-editor") as CodeEditor;
        element.value = "x".repeat(50);
        document.body.append(element);
        await element.updateComplete;
        const view = (element as unknown as { view: EditorView }).view;
        view.dispatch({ selection: { anchor: 10, head: 20 } });

        element.value = "y".repeat(98);
        view.dispatch(view.state.replaceSelection("z"));

        expect(element.value).toBe("y".repeat(20) + "z" + "y".repeat(78));
        element.remove();
    });

    it.each(["p-code-editor", "p-file-editor"])(
        "%s keeps a value set from outside as its own undo step",
        async (tag) => {
            const element = document.createElement(tag) as CodeMirrorEditor;
            element.value = "original";
            document.body.append(element);
            await element.updateComplete;
            const view = (element as unknown as { view: EditorView }).view;

            element.focus();
            await userEvent.keyboard("0");
            element.value = "external";
            await userEvent.keyboard("abc");
            expect(element.value).toBe("eabcxternal");

            undo(view);
            expect(element.value).toBe("external");
            undo(view);
            expect(element.value).toBe("0original");
            undo(view);
            expect(element.value).toBe("original");
            element.remove();
        },
    );

    it("cancels Escape and still leaves the editor on Escape followed by Tab", async () => {
        const element = document.createElement("p-code-editor") as CodeEditor;
        const next = document.createElement("button");
        document.body.append(element, next);
        await element.updateComplete;
        const prevented: boolean[] = [];
        const onKeydown = (e: KeyboardEvent): void => {
            if (e.key === "Escape") prevented.push(e.defaultPrevented);
        };
        window.addEventListener("keydown", onKeydown);

        element.focus();
        await userEvent.keyboard("{Escape}{Tab}");

        expect(prevented).toEqual([true]);
        expect(document.activeElement).toBe(next);
        window.removeEventListener("keydown", onKeydown);
        element.remove();
        next.remove();
    });

    it("leaves Escape alone in a read-only editor, where Tab leaves without it", async () => {
        const element = document.createElement("p-code-editor") as CodeEditor;
        const next = document.createElement("button");
        document.body.append(element, next);
        await element.updateComplete;
        element.debug = true;
        const prevented: boolean[] = [];
        const onKeydown = (e: KeyboardEvent): void => {
            if (e.key === "Escape") prevented.push(e.defaultPrevented);
        };
        window.addEventListener("keydown", onKeydown);

        element.focus();
        await userEvent.keyboard("{Escape}");
        expect(prevented).toEqual([false]);

        element.focus();
        await userEvent.keyboard("{Tab}");
        expect(document.activeElement).toBe(next);
        window.removeEventListener("keydown", onKeydown);
        element.remove();
        next.remove();
    });
});
