import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import {
    RenderOptions, renderWithOptions
} from "../util/Rendering";
import { EditorView, placeholder, ViewUpdate } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";
import { UsedInputGutters } from "../editor/Gutters";
import { t } from "../util/Util";

export class BatchInputHandler extends UserInputHandler {
    private static HIGHLIGHT_CLASSES = ["cm-activeLine"];// "_tw-bg-sky-200", "_tw-text-white"];
    /**
     * The index of the next line in lines to send
     */
    private lineNr: number;
    private prompts: Array<string>;
    private promptCompartment: Compartment;
    private inputAreaView: EditorView;
    /**
     * The previous input of the user
     * Is restored upon switching back to InputMode.Batch
     */
    private previousInput: string;
    private highlightInputGutters: UsedInputGutters;

    /**
     * Construct a new BatchInputHandler
     * @param {function()} inputCallback  Callback for when the user has entered a value
     */
    constructor(inputCallback: () => void) {
        super(inputCallback);
        this.lineNr = 0;
        this.previousInput = "";
        this.prompts = [];
        this.promptCompartment = new Compartment();
        this.highlightInputGutters = new UsedInputGutters();
        this.inputAreaView = new EditorView({
            state: EditorState.create({
                extensions: [
                    this.promptCompartment.of([]),
                    EditorView.updateListener.of((v: ViewUpdate) => {
                        if (v.docChanged) {
                            this.handleInputChanged(v.state.doc.toString());
                        }
                    }),
                    this.highlightInputGutters.toExtension()
                ]
            })
        });
    }

    private handleInputChanged(newInput: string): void {
        if (!newInput) {
            this.highlight(() => false);
        } else {
            const newLines = newInput.split("\n");
            if (this.waiting && newLines.length > this.lineNr + 1) {
                // Require explicitly pressing enter
                this.inputCallback();
            }
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

    private highlight(whichLines = (i: number) => i < this.lineNr): void {
        this.inputAreaView.dom.querySelectorAll(".cm-line").forEach((line, i) => {
            const shouldShow = whichLines(i);
            BatchInputHandler.HIGHLIGHT_CLASSES.forEach(c => {
                line.classList.toggle(c, shouldShow);
            });
            let message = t("Papyros.used_input");
            if (i < this.prompts.length && this.prompts[i]) {
                message = t("Papyros.used_input_with_prompt",
                    { prompt: this.prompts[i] });
            }
            const info = { lineNr: i + 1, on: shouldShow, title: message };
            this.highlightInputGutters.setMarker(this.inputAreaView,
                info);
        });
    }

    public override next(): string {
        const nextLine = this.lines[this.lineNr];
        this.lineNr += 1;
        this.highlight();
        return nextLine;
    }

    public override onRunStart(): void {
        this.lineNr = 0;
        this.highlight(() => false);
    }

    public override onRunEnd(): void {
        // Intentionally empty
    }

    public override waitWithPrompt(waiting: boolean, prompt?: string): void {
        if (waiting) {
            this.prompts.push(prompt || "");
        }
        super.waitWithPrompt(waiting, prompt);
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
            .add("papyros-input-editor", "_tw-overflow-auto", "_tw-max-h-1/4", "_tw-min-h-1/8",
                "_tw-border-solid", "_tw-border-gray-200", "_tw-border-2", "_tw-rounded-lg",
                "dark:_tw-bg-dark-mode-bg", "dark:_tw-border-dark-mode-content",
                "focus:_tw-outline-none", "focus:_tw-ring-1", "focus:_tw-ring-blue-500");
        wrappingDiv.replaceChildren(this.inputAreaView.dom);
        renderWithOptions(options, wrappingDiv);
    }
}
