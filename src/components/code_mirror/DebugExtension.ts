import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    GutterMarker,
    gutterLineClass, gutter,
} from "@codemirror/view";
import { Extension, RangeSet, StateEffect, StateField } from "@codemirror/state";

// --- Decorations & Markers ---
const activeLineDecoration = Decoration.line({ class: "cm-activeLine" });
const activeLineGutterMarker = new class extends GutterMarker {
    elementClass = "cm-activeLineGutter";
};

// --- State Management ---
export const markDebugLine = StateEffect.define<number | undefined>();
const markedDebugLine = StateField.define<number | undefined>({
    create: () => undefined,
    update(value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(markDebugLine)) return effect.value;
        }
        return value;
    },
});

// --- Gutter Highlighter ---
const markedLineGutterHighlighter = gutterLineClass.compute([markedDebugLine], (state) => {
    const line = state.field(markedDebugLine);
    if (line === undefined) return RangeSet.empty;
    return RangeSet.of([activeLineGutterMarker.range(state.doc.line(line).from)]);
});

// --- Line Decoration Plugin ---
const lineDecorationPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = this.getDecorations(view.state);
    }

    update(update: ViewUpdate) {
        if (update.state.field(markedDebugLine) !== update.startState.field(markedDebugLine)) {
            this.decorations = this.getDecorations(update.state);
        }
    }

    getDecorations(state: EditorView["state"]): DecorationSet {
        const line = state.field(markedDebugLine);
        if (line === undefined) return Decoration.none;
        return Decoration.set([activeLineDecoration.range(state.doc.line(line).from)]);
    }
}, {
    decorations: (v) => v.decorations,
});

class DebugMarker extends GutterMarker {
    public override toDOM(): HTMLElement {
        const arrow = document.createElement("div");
        arrow.className = "cm-debugArrow";
        arrow.textContent = "▶";
        return arrow;
    }
}
const debugMarker = new DebugMarker();

const debugGutter = gutter({
    class: "cm-debugline-gutter",
    markers: (view) => {
        const line = view.state.field(markedDebugLine);
        if (line === undefined) return RangeSet.empty;
        return RangeSet.of(debugMarker.range(view.state.doc.line(line).from));
    },
    lineMarker: (view, line) => {
        return null;
    },
});


// --- Main Extension ---
export function debugExtension(): Extension {
    return [
        markedDebugLine,
        markedLineGutterHighlighter,
        lineDecorationPlugin,
        debugGutter,
        EditorView.baseTheme({
            ".cm-debugline-gutter .cm-debugArrow": {
                marginRight: "10px",
            }
        }),
        EditorView.editable.of(false),
    ];
}
