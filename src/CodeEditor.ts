import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { python } from "@codemirror/lang-python";
import { LanguageSupport } from "@codemirror/language";
import {
    EditorView,
    keymap, highlightSpecialChars,
    drawSelection, highlightActiveLine
}
    from "@codemirror/view";
import { EditorState, Extension } from "@codemirror/state";
import { history, historyKeymap } from "@codemirror/history";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { indentOnInput } from "@codemirror/language";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { defaultKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { commentKeymap } from "@codemirror/comment";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { lintKeymap } from "@codemirror/lint";

function getLanguageSupport(language: ProgrammingLanguage): LanguageSupport {
    switch (language) {
        case ProgrammingLanguage.Python: {
            return python();
        }
        case ProgrammingLanguage.JavaScript: {
            return javascript();
        }
        default: {
            throw new Error(`${language} is not yet supported.`);
        }
    }
}
/*
*  - [syntax highlighting depending on the language](#getLanguageSupport)
*  - [line numbers](#gutter.lineNumbers)
*  - [special character highlighting](#view.highlightSpecialChars)
*  - [the undo history](#history.history)
*  - [a fold gutter](#fold.foldGutter)
*  - [custom selection drawing](#view.drawSelection)
*  - [multiple selections](#state.EditorState^allowMultipleSelections)
*  - [reindentation on input](#language.indentOnInput)
*  - [the default highlight style](#highlight.defaultHighlightStyle) (as fallback)
*  - [bracket matching](#matchbrackets.bracketMatching)
*  - [bracket closing](#closebrackets.closeBrackets)
*  - [autocompletion](#autocomplete.autocompletion)
*  - [rectangular selection](#rectangular-selection.rectangularSelection)
*  - [active line highlighting](#view.highlightActiveLine)
*  - [active line gutter highlighting](#gutter.highlightActiveLineGutter)
*  - [selection match highlighting](#search.highlightSelectionMatches)
* Keymaps:
*  - [the default command bindings](#commands.defaultKeymap)
*  - [search](#search.searchKeymap)
*  - [commenting](#comment.commentKeymap)
*  - [linting](#lint.lintKeymap)
*  - [indenting with tab](#commands.indentWithTab)
*/
function getExtensions(language: ProgrammingLanguage): Array<Extension> {
    return [
        getLanguageSupport(language),
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        defaultHighlightStyle.fallback,
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...commentKeymap,
            ...completionKeymap,
            ...lintKeymap
        ]),
        keymap.of([indentWithTab])
    ];
}

function getEditorView(parentElement: HTMLElement,
    language: ProgrammingLanguage, initialCode?: string): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc: initialCode || "",
            extensions: getExtensions(language)
        }),
        parent: parentElement
    });
}

export class CodeEditor {
    element: HTMLElement;
    editorView: EditorView | undefined;
    minLines: number;

    constructor(element: HTMLElement, language: ProgrammingLanguage,
        initialCode?: string, minLines = 10) {
        this.element = element;
        this.minLines = minLines;
        this.setLanguage(language, initialCode);
    }

    setLanguage(language: ProgrammingLanguage, code?: string): void {
        const initialCode = code || new Array(this.minLines).fill("").join("\n");
        this.editorView = getEditorView(this.element, language, initialCode);
        this.element.replaceChildren(this.editorView.dom);
    }

    getCode(): string {
        if (this.editorView) {
            return this.editorView.state.doc.toString();
        } else {
            return "";
        }
    }
}
