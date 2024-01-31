import { EditorState, StateField, StateEffect, Range } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";


const highlightEffect = StateEffect.define<Range<Decoration>[]>();

export const highlightExtension = StateField.define({
    create() {
        return Decoration.none;
    },
    update(value, transaction) {
        let v = value.map(transaction.changes);

        for (const effect of transaction.effects) {
            if (effect.is(highlightEffect)) {
                v = value.update({ add: effect.value });
            }
        }

        return v;
    },
    provide: f => EditorView.decorations.from(f)
});

export class TestLineHighlighter {
    private view: EditorView;
    private lines: string = "";

    constructor(view: EditorView) {
        this.view = view;
    }

    public get testLines(): string {
        return this.lines;
    }

    public set testLines(lines: string) {
        this.lines = lines;
        const testCodeLines = this.lines.split("\n");
        const highlightDecoration = Decoration.line({ class: "papyros-test-code" });

        console.log(this.view.state.doc.lines, testCodeLines.length);

        for (let i = 1; i <= testCodeLines.length; i++) {
            this.view.dispatch({
                effects: highlightEffect.of([highlightDecoration.range(
                    this.view.state.doc.line(this.view.state.doc.lines - testCodeLines.length + i).from
                )])
            });
        }
    }
}
