import { StateField, StateEffect, Range, Extension, Line, EditorState } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import readOnlyRangesExtension from "codemirror-readonly-ranges";
import { t } from "../util/Util";

const addLineEffect = StateEffect.define<Range<Decoration>[]>();
const clearAllLineEffects = StateEffect.define();
const lineEffectExtension = StateField.define({
    create() {
        return Decoration.none;
    },
    update(value, transaction) {
        let v = value.map(transaction.changes);

        for (const effect of transaction.effects) {
            if (effect.is(addLineEffect)) {
                v = value.update({ add: effect.value });
            }
            if (effect.is(clearAllLineEffects)) {
                v = Decoration.none;
            }
        }

        return v;
    },
    provide: f => EditorView.decorations.from(f)
});

const highlightDecoration = Decoration.line({ class: "papyros-test-code" });

// Widget to manage the test code
class TestCodeWidget extends WidgetType {
    private testCodeExtension: TestCodeExtension;

    public constructor(testCodeExtension: TestCodeExtension) {
        super();
        this.testCodeExtension = testCodeExtension;
    }

    public toDOM(): HTMLElement {
        console.log("create test code widget");

        const element = document.createElement("div");
        element.classList.add("papyros-test-code-widget");

        const span = document.createElement("span");
        span.innerText = t("Papyros.editor.test_code.description");
        element.appendChild(span);

        const buttons = document.createElement("div");
        buttons.classList.add("papyros-test-code-buttons");

        const editButton = document.createElement("button");
        editButton.classList.add("papyros-button", "btn-icon");
        editButton.innerHTML = "<i class=\"mdi mdi-pencil\"></i>";
        editButton.addEventListener("click", () => {
            console.log("edit test code");
            this.testCodeExtension.reset(true);
        });
        editButton.title = t("Papyros.editor.test_code.edit");
        buttons.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("papyros-button", "btn-icon");
        deleteButton.innerHTML = "<i class=\"mdi mdi-close\"></i>";
        deleteButton.addEventListener("click", () => {
            console.log("remove test code");
            this.testCodeExtension.reset();
        });
        deleteButton.title = t("Papyros.editor.test_code.remove");
        buttons.appendChild(deleteButton);

        element.appendChild(buttons);
        return element;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

export class TestCodeExtension {
    private view: EditorView;
    private lines: string = "";
    private widget: Decoration;
    private allowEdit: boolean = true;

    constructor(view: EditorView) {
        this.view = view;
        this.widget = Decoration.widget({ widget: new TestCodeWidget(this), block: true, side: 1 });
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
                effects: addLineEffect.of([highlightDecoration.range(this.lineFromEnd(i).from)])
            });
        }
    }

    private addWidget(): void {
        this.view.dispatch({
            effects: addLineEffect.of([this.widget.range(this.lineFromEnd(this.numberOfTestLines).to)])
        });
    }

    private clearAllLineEffects(): void {
        this.view.dispatch({
            effects: clearAllLineEffects.of(null)
        });
    }

    private getReadOnlyRanges(state: EditorState): Array<{from:number|undefined, to:number|undefined}> {
        if (this.allowEdit) {
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
        this.lines = code;
    }

    public reset(keepCode= false): void {
        this.allowEdit = true;
        this.clearAllLineEffects();
        if (this.lines === "") {
            return;
        }

        if (!keepCode) {
            this.view.dispatch(
                { changes: { from: this.lineFromEnd(this.numberOfTestLines).to, to: this.lineFromEnd(0).to, insert: "" } }
            );
        }
        this.lines = "";
    }

    public set testCode(code: string) {
        this.reset();
        if (code === "") {
            return;
        }

        this.insertTestCode(code);
        this.allowEdit = false;
        this.highlightLines();
        this.addWidget();
    }

    public getNonTestCode(): string {
        if (this.allowEdit) {
            return this.view.state.doc.toString();
        }

        return this.view.state.doc.sliceString(0, this.lineFromEnd(this.numberOfTestLines).to);
    }

    public toExtension(): Extension {
        return [lineEffectExtension, readOnlyRangesExtension(this.getReadOnlyRanges.bind(this))];
    }
}
