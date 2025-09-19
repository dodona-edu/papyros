import { Extension, Line } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import readOnlyRangesExtension from "codemirror-readonly-ranges";
import { t } from "../../util/Util";
import { LineEffectExtension } from "./LineEffectExtension";

// The types used in this file should match the ones in the codemirror-readonly-ranges package
// Which might be a slightly different version then our @codemirror package
// Thus we extract the types from the codemirror-readonly-ranges package
type readOnlyRangesGetter = Parameters<typeof readOnlyRangesExtension>[0];
type EditorState = Parameters<readOnlyRangesGetter>[0];
type Range = ReturnType<readOnlyRangesGetter>;

const highlightDecoration = Decoration.line({ class: "papyros-test-code" });

// Widget to manage the test code
class TestCodeWidget extends WidgetType {
    private testCodeExtension: TestCodeExtension;

    public constructor(testCodeExtension: TestCodeExtension) {
        super();
        this.testCodeExtension = testCodeExtension;
    }

    public toDOM(): HTMLElement {
        const element = document.createElement("div");
        element.classList.add("papyros-test-code-widget");

        const span = document.createElement("span");
        span.innerText = t("Papyros.editor.test_code.description");
        element.appendChild(span);

        const buttons = document.createElement("div");
        buttons.classList.add("papyros-test-code-buttons");

        const editButton = document.createElement("a");
        editButton.classList.add("papyros-icon-link");
        editButton.innerHTML = "🖉";
        editButton.addEventListener("click", () => {
            this.testCodeExtension.reset(true);
        });
        editButton.title = t("Papyros.editor.test_code.edit");
        buttons.appendChild(editButton);

        const deleteButton = document.createElement("a");
        deleteButton.classList.add("papyros-icon-link");
        deleteButton.innerHTML = "⨯";
        deleteButton.addEventListener("click", () => {
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

class BottomPaddingWidget extends WidgetType {
    public toDOM(): HTMLElement {
        const element = document.createElement("div");
        element.classList.add("papyros-bottom-padding-widget");
        element.appendChild(document.createElement("div"));
        return element;
    }
}
const bottomPaddingDecoration = Decoration.widget({ widget: new BottomPaddingWidget(), side: 1, block: true });

export class TestCodeExtension {
    private readonly view: EditorView;
    private readonly widget: Decoration;
    private readonly lineEffect: LineEffectExtension;
    private lines: string = "";
    private allowEdit: boolean = true;

    constructor(view: EditorView) {
        this.view = view;
        this.widget = Decoration.widget({ widget: new TestCodeWidget(this), block: true, side: 1 });
        this.lineEffect = new LineEffectExtension(view);
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
            this.lineEffect.add([highlightDecoration.range(this.lineFromEnd(i).from)]);
        }
    }

    private addWidget(): void {
        this.lineEffect.add([
            this.widget.range(this.lineFromEnd(this.numberOfTestLines).to),
            bottomPaddingDecoration.range(this.lineFromEnd(0).to)
        ]);
    }

    private clearAllLineEffects(): void {
        this.lineEffect.clear();
    }

    private getReadOnlyRanges(state: EditorState): Range {
        if (this.allowEdit) {
            return [];
        }
        return [{
            from: this.lineFromEnd(this.numberOfTestLines - 1, state).from,
            to: undefined // until last line
        }];
    }

    private insertTestCode(code: string): void {
        // insert up to two new lines to separate the test code from the user code
        // but only if they are not already there
        const finalNewLineCount = this.view.state.doc.toString().match(/\n*$/)?.[0].length || 0;
        const newLinesToInsert = Math.max(0, 2 - finalNewLineCount);
        this.view.dispatch(
            { changes: { from: this.lineFromEnd(0).to, insert: "\n".repeat(newLinesToInsert) } }
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
        return [this.lineEffect.toExtension(), readOnlyRangesExtension(this.getReadOnlyRanges.bind(this))];
    }
}
