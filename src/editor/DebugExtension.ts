import { Decoration, EditorView, gutterLineClass, GutterMarker } from "@codemirror/view";
import { LineEffectExtension } from "./LineEffectExtension";
import { DebugLineGutter } from "./Gutters";
import { Extension, RangeSet, StateEffect, StateField } from "@codemirror/state";
import { BackendManager } from "../BackendManager";
import { BackendEventType } from "../BackendEvent";

const activeLineDecoration = Decoration.line({ class: "cm-activeLine" });
const activeLineGutterMarker = new class extends GutterMarker {
    elementClass = "cm-activeLineGutter";
};
const markLine = StateEffect.define<number|undefined>();
const markedLine = StateField.define<number|undefined>({
    create: () => undefined,
    update(value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(markLine)) {
                return effect.value;
            }
        }
        return value;
    }
});
const markedLineGutterHighlighter = gutterLineClass.compute([markedLine], state => {
    if (state.field(markedLine) === undefined) {
        return RangeSet.empty;
    }

    const linePos = state.doc.line(state.field(markedLine) as number).from;
    return RangeSet.of([activeLineGutterMarker.range(linePos)]);
});

export class DebugExtension {
    private readonly view: EditorView;
    private readonly gutter: DebugLineGutter;
    private readonly lineEffect: LineEffectExtension;


    constructor(view: EditorView) {
        this.view = view;
        this.gutter = new DebugLineGutter();
        this.lineEffect = new LineEffectExtension(view);

        BackendManager.subscribe(BackendEventType.FrameChange, e => {
            const line = e.data.line;
            this.markLine(line);
        });
    }

    public toggle(show: boolean): void {
        this.gutter.toggle(show);
        this.lineEffect.clear();

        if (show) {
            this.markLine(1);
        } else {
            this.view.dispatch({ effects: markLine.of(undefined) });
        }
    }

    public markLine(lineNr: number): void {
        this.gutter.markLine(this.view, lineNr);
        this.lineEffect.set([activeLineDecoration.range(this.view.state.doc.line(lineNr).from)]);
        this.view.dispatch({ effects: [
            markLine.of(lineNr),
            EditorView.scrollIntoView(this.view.state.doc.line(lineNr).from)
        ] });
    }

    public toExtension(): Extension {
        return [this.lineEffect.toExtension(), this.gutter.toExtension(), markedLine, markedLineGutterHighlighter];
    }
}
