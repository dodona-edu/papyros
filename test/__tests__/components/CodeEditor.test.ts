import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import type { EditorView } from "@codemirror/view";
import { undo } from "@codemirror/commands";
import { diagnosticCount, forceLinting } from "@codemirror/lint";
import { DUTCH_TRANSLATION, ENGLISH_TRANSLATION } from "../../../src/frontend/state/Translations";
import type { CodeEditor } from "../../../src/frontend/components/code_mirror/CodeEditor";
import type { CodeMirrorEditor } from "../../../src/frontend/components/code_mirror/CodeMirrorEditor";
import "../../../src/frontend/components/code_mirror/CodeEditor";
import "../../../src/frontend/components/code_mirror/FileEditor";
import type { Code } from "../../../src/frontend/components/code_runner/Code";
import "../../../src/frontend/components/code_runner/Code";
import { Papyros } from "../../../src/frontend/state/Papyros";
import type { WorkerDiagnostic } from "../../../src/backend/Backend";
import { BackendEventType } from "../../../src/communication/BackendEvent";

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
        "%s does not undo a value set from outside or the edits before it",
        async (tag) => {
            const element = document.createElement(tag) as CodeMirrorEditor;
            element.value = "original";
            document.body.append(element);
            await element.updateComplete;
            const view = (element as unknown as { view: EditorView }).view;

            element.focus();
            await userEvent.keyboard("{Delete}0");
            expect(element.value).toBe("0riginal");
            element.value = "external";
            await userEvent.keyboard("abc");
            expect(element.value).toBe("eabcxternal");

            undo(view);
            expect(element.value).toBe("external");
            undo(view);
            expect(element.value).toBe("external");
            element.remove();
        },
    );

    it("keeps the code intact when undo follows adding test code", async () => {
        const element = document.createElement("p-code") as Code;
        element.papyros = new Papyros();
        element.papyros.runner.code = "x = 12\nfoo";
        document.body.append(element);
        await element.updateComplete;
        const editor = element.shadowRoot!.querySelector("p-code-editor") as CodeEditor;
        const view = (editor as unknown as { view: EditorView }).view;

        view.dispatch({ selection: { anchor: view.state.doc.length } });
        editor.focus();
        await userEvent.keyboard("{Backspace}{Backspace}{Backspace}");
        expect(element.papyros.runner.code).toBe("x = 12\n");

        element.papyros.test.testCode = "assert x";
        await element.updateComplete;
        expect(editor.value).toBe("x = 12\n\n\nassert x");

        undo(view);
        expect(editor.value).toBe("x = 12\n\n\nassert x");
        expect(element.papyros.runner.code).toBe("x = 12\n");
        element.remove();
    });

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
    it("lints again after a package install only when it shows an import error", async () => {
        const papyros = new Papyros();
        const importError: WorkerDiagnostic = {
            lineNr: 1,
            columnNr: 0,
            endLineNr: 1,
            endColumnNr: 10,
            severity: "error",
            message: "Unable to import 'numpy'",
            code: "E0401",
        };
        const mount = async (diagnostics: WorkerDiagnostic[]): Promise<[CodeEditor, () => number]> => {
            const element = document.createElement("p-code-editor") as CodeEditor;
            const lint = vi.fn(() => Promise.resolve(diagnostics));
            element.papyros = papyros;
            element.value = "import numpy";
            element.lintingSource = lint;
            document.body.append(element);
            await element.updateComplete;
            const view = (element as unknown as { view: EditorView }).view;
            forceLinting(view);
            await vi.waitFor(() => expect(diagnosticCount(view.state)).toBe(1));
            return [element, () => lint.mock.calls.length];
        };
        const [flagged, flaggedLints] = await mount([importError]);
        const [clean, cleanLints] = await mount([{ ...importError, message: "Unused import numpy", code: "W0611" }]);
        const before = [flaggedLints(), cleanLints()];

        papyros.events.publish({
            type: BackendEventType.Loading,
            data: { modules: ["numpy"], status: "loaded" },
            contentType: "application/json",
        });

        expect(flaggedLints()).toBe(before[0] + 1);
        expect(cleanLints()).toBe(before[1]);
        flagged.remove();
        clean.remove();
    });
});
