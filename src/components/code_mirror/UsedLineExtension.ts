import {
    Decoration,
    DecorationSet,
    EditorView, gutter,
    gutterLineClass,
    GutterMarker,
    ViewPlugin,
    ViewUpdate
} from "@codemirror/view";
import {RangeSet, StateEffect, StateField} from "@codemirror/state";

// --- Decorations & Markers ---
const usedLineDecoration = Decoration.line({ class: "cm-activeLine" });
const usedLineGutterMarker = new class extends GutterMarker {
    elementClass = "cm-activeLineGutter";
};

// --- State Management ---
export const markUsedLines = StateEffect.define<number | undefined>();
const markedUsedLines = StateField.define<number | undefined>({
    create: () => undefined,
    update(value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(markUsedLines)) return effect.value;
        }
        return value;
    },
});

// --- Gutter Highlighter ---
const markedLineGutterHighlighter = gutterLineClass.compute([markedUsedLines], (state) => {
    const line = state.field(markedUsedLines);
    if (line === undefined || line === 0) return RangeSet.empty;
    return RangeSet.of([usedLineGutterMarker.range(0, state.doc.line(line).from)]);
});

// --- Line Decoration Plugin ---
const lineDecorationPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = this.getDecorations(view.state);
    }

    update(update: ViewUpdate) {
        if (update.state.field(markedUsedLines) !== update.startState.field(markedUsedLines)) {
            this.decorations = this.getDecorations(update.state);
        }
    }

    getDecorations(state: EditorView["state"]): DecorationSet {
        const line = state.field(markedUsedLines);
        if (line === undefined || line === 0) return Decoration.none;
        const decorations = [];
        for(let i = 1; i <= line; i++) {
            decorations.push(usedLineDecoration.range(state.doc.line(i).from));
        }
        return Decoration.set(decorations);
    }
}, {
    decorations: (v) => v.decorations,
});

class UsedMarker extends GutterMarker {
    toDOM() {
        const check = document.createElement("div");
        check.textContent = "✔";
        return check;
    }
}
const usedMarker = new UsedMarker();

const usedLineGutter = gutter({
    markers: (view) => {
        return RangeSet.empty;
    },
    lineMarker: (view, line) => {
        const usedLines = view.state.field(markedUsedLines);
        if (usedLines === undefined || usedLines === 0) { return null; }
        const usedLineFrom = view.state.doc.line(usedLines).from;
        if (line.from <= usedLineFrom) {
            return usedMarker;
        }
        return null;
    },
});

export function usedLineExtension(): any[] {
    return [
        markedUsedLines,
        markedLineGutterHighlighter,
        lineDecorationPlugin,
        usedLineGutter,
    ];
}


