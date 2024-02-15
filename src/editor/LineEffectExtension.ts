import {Extension, Range, StateEffect, StateField} from "@codemirror/state";
import {Decoration, EditorView} from "@codemirror/view";


export class LineEffectExtension {
    private readonly addEffect = StateEffect.define<Range<Decoration>[]>();
    private readonly clearEffect = StateEffect.define();
    private readonly setEffect = StateEffect.define<Range<Decoration>[]>();
    private editorView: EditorView;

    constructor(view: EditorView) {
        this.editorView = view;
    }

    public add(range: Range<Decoration>[]): void {
        this.editorView.dispatch({
            effects: this.addEffect.of(range)
        });
    }

    public clear(): void {
        this.editorView.dispatch({
            effects: this.clearEffect.of(null)
        });
    }

    public set(range: Range<Decoration>[]): void {
        this.editorView.dispatch({
            effects: this.setEffect.of(range)
        });
    }

    public toExtension(): Extension {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return StateField.define({
            create() {
                return Decoration.none;
            },
            update(value, transaction) {
                let v = value.map(transaction.changes);

                for (const effect of transaction.effects) {
                    if (effect.is(self.clearEffect) || effect.is(self.setEffect)) {
                        v = Decoration.none;
                    }
                    if (effect.is(self.addEffect) || effect.is(self.setEffect)) {
                        v = v.update({ add: effect.value });
                    }
                }

                return v;
            },
            provide: f => EditorView.decorations.from(f)
        });
    }
}
