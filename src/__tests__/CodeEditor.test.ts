import { CodeEditor } from "../CodeEditor";
import { ProgrammingLanguage } from "../ProgrammingLanguage";
import { RenderOptions } from "../util/Util";
import { Diagnostic } from "@codemirror/lint";

describe("CodeEditor", () => {
    const editorParentId = "jest-code-editor";
    document.body.innerHTML = `<div id=${editorParentId}></div>`;
    // Polyfill for CodeMirror that uses createRange
    window.document.createRange = () => ({
        setStart: () => {},
        setEnd: () => {},
        // eslint-disable-next-line
        commonAncestorContainer: {
            nodeName: 'BODY',
            ownerDocument: document,
        },
        getClientRects: () => []
    } as any);
    const editor = new CodeEditor();
    const renderOptions: RenderOptions = {
        parentElementId: editorParentId
    }
    editor.render(renderOptions);

    beforeEach(() => {
        editor.setCode("");
    })

    it("can set and get code", () => {
        expect(editor.getCode()).toEqual("");
        const newCode = "print(input())";
        editor.setCode(newCode);
        expect(editor.getCode()).toEqual(newCode);
    })

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
    })

    it("supports linting", done => {
        const lintMock: () => Array<Diagnostic> = jest.fn(() => {
            return [
                {from: 0, to: 0, severity: "error", message: "mock"}
            ]
        });
        editor.setLintingSource(lintMock);
        editor.setCode("x=5");
        setTimeout(() => {
            expect(lintMock).toBeCalled();
            done();
        }, 4000);
    })
})

