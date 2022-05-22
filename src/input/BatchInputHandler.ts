import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import {
    RenderOptions, renderWithOptions
} from "../util/Rendering";
import { EditorView, placeholder, ViewUpdate } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";

export class BatchInputHandler extends UserInputHandler {
    private static HIGHLIGHT_CLASSES = ["_tw-bg-sky-200", "_tw-text-white"];
    /**
     * The index of the next line in lines to send
     */
    private lineNr: number;
    private promptCompartment: Compartment;
    private inputAreaView: EditorView;
    /**
     * The previous input of the user
     * Is restored upon switching back to InputMode.Batch
     */
    private previousInput: string;

    /**
     * Construct a new BatchInputHandler
     * @param {function()} inputCallback  Callback for when the user has entered a value
     */
    constructor(inputCallback: () => void) {
        super(inputCallback);
        this.lineNr = 0;
        this.previousInput = "";
        this.promptCompartment = new Compartment();
        this.inputAreaView = new EditorView({
            state: EditorState.create({
                extensions: [
                    this.promptCompartment.of([]),
                    EditorView.updateListener.of((v: ViewUpdate) => {
                        if (v.docChanged) {
                            this.handleInputChanged(v.state.doc.toString());
                        }
                    })
                ]
            })
        });
    }

    private handleInputChanged(newInput: string): void {
        const newLines = newInput.split("\n");
        const oldLines = this.previousInput.split("\n");
        console.log("Handling input change", newLines, oldLines, this.lineNr, this.waiting);
        if (this.waiting && newLines.length > this.lineNr + 1) {
            // Require explicitly pressing enter
            this.inputCallback();
        }
        if (newLines.length < this.lineNr) {
            // Used removed lines, update and re-highlight
            this.lineNr = newLines.length - 1;
            this.highlight();
        }
        this.previousInput = newInput;
    }

    public override toggle(active: boolean): void {
        if (active) {
            this.inputAreaView.dispatch(
                {
                    changes: {
                        from: 0,
                        to: this.inputAreaView.state.doc.toString().length,
                        insert: this.previousInput
                    }
                }
            );
        } else {
            this.previousInput = this.inputAreaView.state.doc.toString();
        }
    }

    public override getInputMode(): InputMode {
        return InputMode.Batch;
    }

    /**
     * Retrieve the lines of input that the user has given so far
     * @return {Array<string>} The entered lines
     */
    protected get lines(): Array<string> {
        const l = this.inputAreaView.state.doc.toString().split("\n");
        if (!l[l.length - 1]) { // last line is empty
            l.splice(l.length - 1); // do not consider it valid input
        }
        return l;
    }

    public override hasNext(): boolean {
        return this.lineNr < this.lines.length;
    }

    private highlight(): void {
        this.inputAreaView.dom.querySelectorAll(".cm-line").forEach((line, i) => {
            BatchInputHandler.HIGHLIGHT_CLASSES.forEach(c => {
                line.classList.toggle(c, i < this.lineNr);
            });
        });
    }

    public override next(): string {
        const nextLine = this.lines[this.lineNr];
        console.log("Called next for line: ", this.lineNr, nextLine, this.lines);
        this.lineNr += 1;
        this.highlight();
        return nextLine;
    }

    public override onRunStart(): void {
        this.lineNr = 0;
        this.highlight();
    }

    public override onRunEnd(): void {
        // Intentionally empty
    }

    protected setPlaceholder(promptPlaceholder: string): void {
        this.inputAreaView.dispatch({
            effects: [this.promptCompartment.reconfigure(placeholder(promptPlaceholder))]
        });
    }

    protected focus(): void {
        this.inputAreaView.focus();
    }

    protected override _render(options: RenderOptions): void {
        const wrappingDiv = document.createElement("div");
        wrappingDiv.classList
            .add("papyros-input-editor", "_tw-w-full", "_tw-max-h-1/4", "_tw-min-h-1/8",
                "_tw-px-1", "_tw-overflow-auto", "_tw-border-2", "_tw-rounded-lg",
                "dark:_tw-border-dark-mode-content", "dark:_tw-bg-dark-mode-bg",
                "focus:_tw-outline-none", "focus:_tw-ring-1", "focus:_tw-ring-blue-500");

        wrappingDiv.replaceChildren(this.inputAreaView.dom);
        renderWithOptions(options, wrappingDiv);
    }
}
