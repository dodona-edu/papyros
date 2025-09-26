import {
    Decoration,
    DecorationSet,
    EditorView, gutter,
    gutterLineClass,
    GutterMarker,
    ViewPlugin,
    ViewUpdate
} from "@codemirror/view";
import {Extension, RangeSet, StateEffect, StateEffectType, StateField} from "@codemirror/state";

export type LineEffectExtensionConfig = {
    lineClass?: string;
    gutterClass?: string;
    marker?: string;
}
export function lineEffectExtension(config: LineEffectExtensionConfig): [Extension, StateEffectType<number[] | undefined>, StateField<number[] | undefined>] {
    const setLines = StateEffect.define<number[] | undefined>();
    const stateField = StateField.define<number[] | undefined>({
        create: () => undefined,
        update(value, tr) {
            for (const effect of tr.effects) {
                if (effect.is(setLines)) return effect.value;
            }
            return value;
        },
    });

    const lineDecoration = Decoration.line({ class: config.lineClass ?? "cm-activeLine" });
    const lineGutterMarker = new class extends GutterMarker {
        elementClass = config.gutterClass ?? "cm-activeLineGutter";
    };

    const gutterHighlighter = gutterLineClass.compute([stateField], (state) => {
        const lines = state.field(stateField);
        if (lines === undefined || lines.length === 0) return RangeSet.empty;
        const markers = [];
        for(const lineNum of lines) {
            if (lineNum <= state.doc.lines) {
                markers.push(lineGutterMarker.range(state.doc.line(lineNum).from));
            }
        }
        return RangeSet.of(markers);
    });

    const lineDecorationPlugin = ViewPlugin.fromClass(class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.getDecorations(view.state);
        }

        update(update: ViewUpdate) {
            if (update.state.field(stateField) !== update.startState.field(stateField)) {
                this.decorations = this.getDecorations(update.state);
            }
        }

        getDecorations(state: EditorView["state"]): DecorationSet {
            const lines = state.field(stateField);
            if (lines === undefined || lines.length === 0) return Decoration.none;
            const decorations = [];
            for(const lineNum of lines) {
                if (lineNum <= state.doc.lines) {
                    decorations.push(lineDecoration.range(state.doc.line(lineNum).from));
                }
            }
            return Decoration.set(decorations);
        }
    }, {
        decorations: (v) => v.decorations,
    });

    const extensions: Extension[] = [
        stateField,
        gutterHighlighter,
        lineDecorationPlugin,
    ];


    if( config.marker !== undefined ) {
        class CustomMarker extends GutterMarker {
            toDOM() {
                const element = document.createElement("div");
                element.textContent = config.marker!;
                return element;
            }
        }
        const customMarker = new CustomMarker();

        const customGutter = gutter({
            class: "cm-custom-gutter",
            markers: (view) => {
                return RangeSet.empty;
            },
            lineMarker: (view, line) => {
                const lines = view.state.field(stateField);
                if (lines === undefined || lines.length === 0) { return null; }
                for(const lineNum of lines) {
                    if (lineNum <= view.state.doc.lines && line.from === view.state.doc.line(lineNum).from) {
                        return customMarker;
                    }
                }
                return null;
            },
        });

        extensions.push(customGutter);
        extensions.push(EditorView.baseTheme({
            ".cm-custom-gutter": {
                width: "17px",
                textAlign: "center",
            },
        }));
    }
    return [
            extensions,
            setLines,
            stateField,
    ];
}

export const [usedLineExtension, setUsedLines, usedLineState] = lineEffectExtension({marker: "✔"});
export const [debugLineExtension, setDebugLines, debugLineState] = lineEffectExtension({marker: "▶"});
