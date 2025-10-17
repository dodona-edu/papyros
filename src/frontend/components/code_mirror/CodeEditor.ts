import { customElement } from "lit/decorators.js";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import {
    drawSelection,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldGutter, indentOnInput, indentUnit, LanguageSupport } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import {
    acceptCompletion,
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
} from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { linter, lintGutter, lintKeymap } from "@codemirror/lint";
import { css, CSSResult } from "lit";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { WorkerDiagnostic } from "../../../backend/Backend";
import { ProgrammingLanguage } from "../../../ProgrammingLanguage";
import {
    debugLineExtension,
    setDebugLines,
    setTestLines,
    testCodeWidgetExtension,
    testLineExtension,
} from "./Extensions";
import readOnlyRangesExtension from "codemirror-readonly-ranges";

const tabCompletionKeyMap = [{ key: "Tab", run: acceptCompletion }];
const languageExtensions: Record<ProgrammingLanguage, LanguageSupport> = {
    JavaScript: javascript(),
    Python: python(),
};

@customElement("p-code-editor")
export class CodeEditor extends CodeMirrorEditor {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                height: 100%;
            }

            .papyros-test-line {
                background-color: var(--md-sys-color-surface-variant);
            }

            .papyros-test-code-widget {
                background-color: var(--md-sys-color-surface-variant);
                color: var(--md-sys-color-on-surface-variant);
                padding: 0 2px 0 6px;
                position: relative;
            }

            .papyros-test-code-buttons {
                position: absolute;
                top: 0;
                left: -50px;
                z-index: 220;
                width: 50px;
                padding-left: 4px;
            }

            .papyros-icon-link {
                font-size: 16px;
                padding: 0 4px;
                cursor: pointer;
            }

            .papyros-icon-link:hover {
                color: var(--md-sys-color-primary);
            }
        `;
    }

    set debug(value: boolean) {
        this.configure({
            debugging: value ? debugLineExtension : [highlightActiveLineGutter(), lintGutter(), highlightActiveLine()],
        });
        this.readonly = value;
    }

    set debugLine(value: number | undefined) {
        this.view?.dispatch({
            effects: setDebugLines.of(value ? [value] : []),
        });
    }

    set testLines(value: number[] | undefined) {
        this.view?.dispatch({
            effects: setTestLines.of(value),
        });
    }

    /**
     * Override the value setter to temporarily disable read-only ranges
     */
    override dispatchChange(): void {
        const oldReadOnlyExtensions = this.extensions.get("testReadOnlyRanges") ?? [];
        this.configure({
            testReadOnlyRanges: [],
        });
        super.dispatchChange();
        this.configure({
            testReadOnlyRanges: oldReadOnlyExtensions,
        });
    }

    set testLineCount(value: number | undefined) {
        this.configure({
            testReadOnlyRanges: value
                ? readOnlyRangesExtension((state) => {
                      const line = state.doc.lines - value;
                      return [{ from: state.doc.line(line).from, to: state.doc.length }];
                  })
                : [],
        });
    }

    set testTranslations(value: { description: string; edit: string; remove: string }) {
        this.configure({
            test: [
                testLineExtension,
                testCodeWidgetExtension(
                    value,
                    () => {
                        this.dispatchEvent(new CustomEvent("edit-test-code"));
                    },
                    () => {
                        this.dispatchEvent(new CustomEvent("remove-test-code"));
                    },
                ),
            ],
        });
    }

    set programmingLanguage(value: ProgrammingLanguage) {
        if (!(value in languageExtensions)) {
            console.warn(`Language ${value} not supported, defaulting to javascript`);
            this.configure({
                language: languageExtensions.JavaScript,
            });
            return;
        }

        this.configure({
            language: languageExtensions[value],
        });
    }

    set lintingSource(lintSource: () => Promise<readonly WorkerDiagnostic[]>) {
        this.configure({
            linting: linter(async (view) => {
                const workerDiagnostics = await lintSource();
                if (
                    workerDiagnostics.some((d) => d.lineNr > view.state.doc.lines || d.endLineNr > view.state.doc.lines)
                ) {
                    // if the diagnostics are out of range, the document has changed since the linting was requested
                    // these diagnostics are no longer valid
                    return [];
                }

                return workerDiagnostics.map((d) => {
                    const fromline = view.state.doc.line(d.lineNr);
                    const toLine = view.state.doc.line(d.endLineNr);
                    const from = Math.min(fromline.from + d.columnNr, fromline.to);
                    const to = Math.min(toLine.from + d.endColumnNr, toLine.to);
                    return { ...d, from: from, to: to };
                });
            }),
        });
    }

    set indentLength(length: number) {
        this.configure({
            indentUnit: indentUnit.of(" ".repeat(length)),
        });
    }

    constructor() {
        super();
        this.configure({
            language: [],
            codingExtensions: [
                lineNumbers(),
                highlightSpecialChars(),
                history(),
                foldGutter(),
                drawSelection(),
                EditorState.allowMultipleSelections.of(true),
                indentOnInput(),
                bracketMatching(),
                closeBrackets(),
                autocompletion(),
                rectangularSelection(),
                highlightSelectionMatches(),
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...completionKeymap,
                    ...tabCompletionKeyMap,
                    ...lintKeymap,
                    indentWithTab,
                ]),
            ],
            debugging: [highlightActiveLineGutter(), lintGutter(), highlightActiveLine()],
        });
    }
}
