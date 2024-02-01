import {StateField, StateEffect, Range, Extension, Line, EditorState} from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import readOnlyRangesExtension from "codemirror-readonly-ranges";


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

const highlightDecoration = Decoration.line({ class: "papyros-test-code" });

export class TestCodeExtension {
    private view: EditorView;
    private lines: string = "";

    constructor(view: EditorView) {
        this.view = view;
    }

    private get numberOfTestLines(): number {
        return this.lines.split("\n").length;
    }

    private lineFromEnd(line: number, state: EditorState | undefined = undefined): Line {
        const currentState = state || this.view.state;
        const lineFromEnd = currentState.doc.lines - line;
        return currentState.doc.line(lineFromEnd);
    }

    private highlightLines(): void {
        for (let i = 0; i < this.numberOfTestLines; i++) {
            this.view.dispatch({
                effects: highlightEffect.of([highlightDecoration.range(this.lineFromEnd(i).from)])
            });
        }
    }

    private getReadOnlyRanges(state: EditorState): Array<{from:number|undefined, to:number|undefined}> {
        if (this.lines === "") {
            return [];
        }
        return [{
            from: this.lineFromEnd(this.numberOfTestLines - 1, state).from,
            to: undefined // until last line
        }];
    }

    private insertTestCode(code: string): void {
        this.view.dispatch(
            { changes: { from: this.lineFromEnd(0).to, insert: "\n" } }
        );

        this.view.dispatch(
            { changes: { from: this.lineFromEnd(0).to, insert: code } }
        );
    }

    public set testCode(lines: string) {
        this.lines = "";
        const insertedLines = "\n" + lines;
        this.insertTestCode(insertedLines);
        this.lines = insertedLines;

        this.highlightLines();
    }

    public toExtension(): Extension {
        return [highlightExtension, readOnlyRangesExtension(this.getReadOnlyRanges.bind(this))];
    }
}
