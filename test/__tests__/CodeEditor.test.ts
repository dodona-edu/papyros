import { CodeEditor } from "../../src/CodeEditor";
import { ProgrammingLanguage } from "../../src/ProgrammingLanguage";
import { Diagnostic } from "@codemirror/lint";
import { startCompletion } from "@codemirror/autocomplete";
import { EDITOR_WRAPPER_ID } from "../../src/Constants";

describe("CodeEditor", () => {
    document.body.innerHTML = `<div id=${EDITOR_WRAPPER_ID}></div>`;
    const editor = new CodeEditor();
    editor.render({
        parentElementId: EDITOR_WRAPPER_ID
    });

    beforeEach(() => {
        editor.setCode("");
    });

    it("can set and get code", () => {
        expect(editor.getCode()).toEqual("");
        const newCode = "print(input())";
        editor.setCode(newCode);
        expect(editor.getCode()).toEqual(newCode);
    });

    it("uses syntax highlighting", () => {
        editor.setProgrammingLanguage(ProgrammingLanguage.Python);
        editor.setCode("def test():\n    return 42");

        // Def should have markup in Python
        let defSpans = Array.from(document.querySelectorAll("span"))
            .filter(el => el.textContent?.includes("def"));
        expect(defSpans.length).toEqual(1);
        expect(defSpans[0].textContent).toEqual("def");
        expect(defSpans[0].classList.length).toBeGreaterThan(0);

        // Def is not a keyword in JavaScript, should not have special markup
        editor.setProgrammingLanguage(ProgrammingLanguage.JavaScript);
        defSpans = Array.from(document.querySelectorAll("span"))
            .filter(el => el.textContent?.includes("def"));
        expect(defSpans.length).toEqual(0);
    });

    it("supports linting", () => {
        const lintMock: () => Array<Diagnostic> = jest.fn(() => {
            return [
                { from: 0, to: 0, severity: "error", message: "mock" }
            ];
        });
        editor.setLintingSource(lintMock);
        editor.setCode("x=5");
        // CodeMirror waits until editor is idle to call linter
        return new Promise<void>(resolve => {
            setTimeout(() => {
                expect(lintMock).toBeCalled();
                resolve();
            }, 750);
        });
    });

    it("supports autocompletion", () => {
        const autocompleteMock: () => null = jest.fn(() => null);
        editor.setCompletionSource(autocompleteMock);
        startCompletion(editor.editorView);

        return new Promise<void>(resolve => {
            // CodeMirror waits until editor is idle to call autocompletion
            setTimeout(() => {
                expect(autocompleteMock).toBeCalled();
                resolve();
            }, 750);
        });
    });
});

