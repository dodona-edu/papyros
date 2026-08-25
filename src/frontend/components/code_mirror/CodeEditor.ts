import { customElement } from "lit/decorators.js";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import {
    drawSelection,
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldGutter, indentOnInput, indentUnit, LanguageSupport } from "@codemirror/language";
import { EditorState, StateEffect } from "@codemirror/state";
import {
    acceptCompletion,
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
} from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { linter, lintGutter, lintKeymap, forceLinting } from "@codemirror/lint";
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
import { BackendEvent, BackendEventType } from "../../../communication/BackendEvent";
import { Papyros } from "../../state/Papyros";
import { parseData } from "../../../util/Util";

const tabCompletionKeyMap = [{ key: "Tab", run: acceptCompletion }];
// This editor binds Tab to indentation, so Tab no longer moves focus out of it and the way
// out is CodeMirror's Escape-then-Tab. WCAG 2.1.2 asks that people are advised of such an
// exit, and aria-describedby only resolves ids in the described element's own tree, so the
// hint has to sit in this shadow root next to .cm-content.
const ESCAPE_HINT_ID = "escape-hint";
// Dispatched to ask the linter to re-run without a document change (see needsRefresh).
const forceLintEffect = StateEffect.define<null>();
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
                display: inline-flex;
                vertical-align: middle;
                padding: 0 4px;
                cursor: pointer;
                border: none;
                background: none;
                color: inherit;
            }

            .papyros-icon-link:hover {
                color: var(--md-sys-color-primary);
            }

            #escape-hint {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
                border: 0;
            }
        `;
    }

    set debug(value: boolean) {
        this.configure({
            debugging: value ? debugLineExtension : [highlightActiveLineGutter(), lintGutter(), highlightActiveLine()],
        });
        this.readonly = value;
    }

    private reLintOnLoaded = (e: BackendEvent): void => {
        // The linter resolves imports against the packages installed in the worker,
        // so code linted while a package is still downloading is wrongly flagged as
        // "unable to import X". The editor does not re-lint on its own, so when a
        // package finishes installing, force a re-lint to clear those stale errors.
        const loadingData = parseData(e.data, e.contentType);
        if (loadingData.status === "loaded" && this.view) {
            // forceLinting only runs an already-scheduled lint, so first dispatch
            // forceLintEffect to schedule one (via the linter's needsRefresh).
            this.view.dispatch({ effects: forceLintEffect.of(null) });
            forceLinting(this.view);
        }
    };

    private _papyros: Papyros | undefined;
    private unsubscribeRelint: (() => void) | undefined;
    private escapeHintElement: HTMLElement | undefined;

    override set translations(translations: Record<string, string>) {
        super.translations = translations;
        this.updateEscapeHint();
    }

    private updateEscapeHint(): void {
        if (this.escapeHintElement && this.view) {
            this.escapeHintElement.textContent = this.view.state.phrase(
                "Press Escape followed by Tab to leave the code editor.",
            );
        }
    }

    /**
     * The instance whose backend this editor lints against, used to re-lint
     * when that backend finishes installing a package
     */
    set papyros(value: Papyros | undefined) {
        this.unsubscribeRelint?.();
        this.unsubscribeRelint = undefined;
        this._papyros = value;
        if (this.isConnected) {
            this.subscribeRelint();
        }
    }

    private subscribeRelint(): void {
        this.unsubscribeRelint ??= this._papyros?.events.subscribe(BackendEventType.Loading, this.reLintOnLoaded);
    }

    public override connectedCallback(): void {
        super.connectedCallback();
        this.subscribeRelint();

        this.escapeHintElement = document.createElement("span");
        this.escapeHintElement.id = ESCAPE_HINT_ID;
        this.shadowRoot!.appendChild(this.escapeHintElement);
        this.updateEscapeHint();
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.unsubscribeRelint?.();
        this.unsubscribeRelint = undefined;
        this.escapeHintElement?.remove();
        this.escapeHintElement = undefined;
    }

    set debugLine(value: number | undefined) {
        if (!this.view) return;
        const effects: StateEffect<any>[] = [setDebugLines.of(value ? [value] : [])];
        if (value && value >= 1 && value <= this.view.state.doc.lines) {
            const line = this.view.state.doc.line(value);
            effects.push(EditorView.scrollIntoView(line.from, { y: "center" }));
        }
        this.view.dispatch({ effects });
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
            linting: linter(
                async (view) => {
                    const workerDiagnostics = await lintSource();
                    if (
                        workerDiagnostics.some(
                            (d) => d.lineNr > view.state.doc.lines || d.endLineNr > view.state.doc.lines,
                        )
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
                },
                {
                    // Re-lint when we dispatch forceLintEffect, even though the document
                    // hasn't changed (e.g. after a package finishes installing).
                    needsRefresh: (update) =>
                        update.transactions.some((tr) => tr.effects.some((e) => e.is(forceLintEffect))),
                },
            ),
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
                EditorView.contentAttributes.of({ "aria-describedby": ESCAPE_HINT_ID }),
            ],
            debugging: [highlightActiveLineGutter(), lintGutter(), highlightActiveLine()],
        });
    }
}
