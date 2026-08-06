import {
    Decoration,
    DecorationSet,
    EditorView,
    gutter,
    gutterLineClass,
    GutterMarker,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import { Extension, RangeSet, StateEffect, StateEffectType, StateField } from "@codemirror/state";

export type LineEffectExtensionConfig = {
    lineClass?: string;
    gutterClass?: string;
    marker?: string;
};
export function lineEffectExtension(
    config: LineEffectExtensionConfig,
): [Extension, StateEffectType<number[] | undefined>, StateField<number[] | undefined>] {
    const setLines = StateEffect.define<number[] | undefined>();
    let currentVal: number[] | undefined = undefined;
    const stateField = StateField.define<number[] | undefined>({
        create: () => undefined,
        update(value, tr) {
            for (const effect of tr.effects) {
                if (effect.is(setLines)) {
                    currentVal = effect.value;
                    return currentVal;
                }
            }

            if (tr.docChanged && currentVal !== undefined) {
                // only return the lines that still exist
                return currentVal.filter((line) => line <= tr.newDoc.lines);
            }
            return value;
        },
    });

    const lineDecoration = Decoration.line({ class: config.lineClass ?? "cm-activeLine" });
    const lineGutterMarker = new (class extends GutterMarker {
        elementClass = config.gutterClass ?? "cm-activeLineGutter";
    })();

    const gutterHighlighter = gutterLineClass.compute([stateField], (state) => {
        const lines = state.field(stateField);
        if (lines === undefined || lines.length === 0) return RangeSet.empty;
        const markers = [];
        for (const lineNum of lines) {
            if (lineNum <= state.doc.lines) {
                markers.push(lineGutterMarker.range(state.doc.line(lineNum).from));
            }
        }
        return RangeSet.of(markers);
    });

    const lineDecorationPlugin = ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = this.getDecorations(view.state);
            }

            update(update: ViewUpdate): void {
                if (update.state.field(stateField) !== update.startState.field(stateField)) {
                    this.decorations = this.getDecorations(update.state);
                }
            }

            getDecorations(state: EditorView["state"]): DecorationSet {
                const lines = state.field(stateField);
                if (lines === undefined || lines.length === 0) return Decoration.none;
                const decorations = [];
                for (const lineNum of lines) {
                    if (lineNum <= state.doc.lines) {
                        decorations.push(lineDecoration.range(state.doc.line(lineNum).from));
                    }
                }
                return Decoration.set(decorations);
            }
        },
        {
            decorations: (v) => v.decorations,
        },
    );

    const extensions: Extension[] = [stateField, gutterHighlighter, lineDecorationPlugin];

    if (config.marker !== undefined) {
        class CustomMarker extends GutterMarker {
            toDOM(): Node {
                const element = document.createElement("div");
                element.textContent = config.marker!;
                return element;
            }
        }
        const customMarker = new CustomMarker();

        const customGutter = gutter({
            class: "cm-custom-gutter",
            markers: () => {
                return RangeSet.empty;
            },
            lineMarker: (view, line) => {
                const lines = view.state.field(stateField);
                if (lines === undefined || lines.length === 0) {
                    return null;
                }
                for (const lineNum of lines) {
                    if (lineNum <= view.state.doc.lines && line.from === view.state.doc.line(lineNum).from) {
                        return customMarker;
                    }
                }
                return null;
            },
        });

        extensions.push(customGutter);
        extensions.push(
            EditorView.baseTheme({
                ".cm-custom-gutter": {
                    width: "17px",
                    textAlign: "center",
                },
            }),
        );
    }
    return [extensions, setLines, stateField];
}

export const [usedLineExtension, setUsedLines, usedLineState] = lineEffectExtension({ marker: "✔" });
export const [debugLineExtension, setDebugLines, debugLineState] = lineEffectExtension({ marker: "▶" });
export const [testLineExtension, setTestLines, testLineState] = lineEffectExtension({
    lineClass: "papyros-test-line",
    gutterClass: "",
});

// Inline SVGs instead of unicode glyphs (🖉, ⨯), which many system fonts lack.
const EDIT_ICON_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
    '<path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>';
const REMOVE_ICON_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
    '<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>';

export function testCodeWidgetExtension(
    translations: { description: string; edit: string; remove: string },
    handleEdit: () => void,
    handleRemove: () => void,
): Extension {
    class TestCodeWidget extends WidgetType {
        public toDOM(): HTMLElement {
            const element = document.createElement("div");
            element.classList.add("papyros-test-code-widget");

            const span = document.createElement("span");
            span.innerText = translations.description;
            element.appendChild(span);

            const buttons = document.createElement("div");
            buttons.classList.add("papyros-test-code-buttons");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.classList.add("papyros-icon-link");
            editButton.innerHTML = EDIT_ICON_SVG;
            editButton.addEventListener("click", handleEdit);
            editButton.title = translations.edit;
            editButton.setAttribute("aria-label", translations.edit);
            buttons.appendChild(editButton);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.classList.add("papyros-icon-link");
            deleteButton.innerHTML = REMOVE_ICON_SVG;
            deleteButton.addEventListener("click", handleRemove);
            deleteButton.title = translations.remove;
            deleteButton.setAttribute("aria-label", translations.remove);
            buttons.appendChild(deleteButton);

            element.appendChild(buttons);
            return element;
        }

        ignoreEvent(): boolean {
            return false;
        }
    }

    const testCodeDecoration = Decoration.widget({ widget: new TestCodeWidget(), side: -1, block: true });
    function getDecorations(state: EditorView["state"]): DecorationSet {
        const lines = state.field(testLineState);
        if (!lines || lines.length === 0) return Decoration.none;
        const minLine = Math.min(...lines);
        if (minLine > state.doc.lines) return Decoration.none;
        return Decoration.set([testCodeDecoration.range(state.doc.line(minLine).from)]);
    }

    return StateField.define<DecorationSet>({
        create(state) {
            return getDecorations(state);
        },
        update(deco, tr) {
            for (const effect of tr.effects) {
                if (effect.is(setTestLines) || tr.docChanged) return getDecorations(tr.state);
            }
            return deco.map(tr.changes);
        },
        provide: (f) => EditorView.decorations.from(f),
    });
}
