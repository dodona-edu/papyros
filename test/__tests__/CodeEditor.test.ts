import { CodeEditor } from "../../src/editor/CodeEditor";
import { ProgrammingLanguage } from "../../src/ProgrammingLanguage";
import { Diagnostic } from "@codemirror/lint";
import { EDITOR_WRAPPER_ID } from "../../src/Constants";

describe("CodeEditor", () => {
    document.body.innerHTML = `<div id=${EDITOR_WRAPPER_ID}></div>`;
    const editor = new CodeEditor(() => {
        /* No need to run code*/
    });
    editor.render({
        parentElementId: EDITOR_WRAPPER_ID
    });

    beforeEach(() => {
        editor.setText("");
    });

    it("can set and get code", () => {
        expect(editor.getText()).toEqual("");
        const newCode = "print(input())";
        editor.setText(newCode);
        expect(editor.getText()).toEqual(newCode);
    });

    it("uses syntax highlighting", () => {
        editor.setProgrammingLanguage(ProgrammingLanguage.Python);
        editor.setText("def test():\n    return 42");

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
        editor.setText("x=5");
        // CodeMirror waits until editor is idle to call linter
        return new Promise<void>(resolve => {
            setTimeout(() => {
                expect(lintMock).toBeCalled();
                resolve();
            }, 750);
        });
    });
});

