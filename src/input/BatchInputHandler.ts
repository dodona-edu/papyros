import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import {
    RenderOptions,
} from "../util/Rendering";
import { placeholder } from "@codemirror/view";
import { UsedInputGutterInfo, UsedInputGutters } from "../editor/Gutters";
import { t } from "../util/Util";
import { CodeMirrorEditor } from "../editor/CodeMirrorEditor";

class BatchInputEditor extends CodeMirrorEditor {
    private static HIGHLIGHT_CLASSES = ["cm-activeLine"];// "_tw-bg-sky-200", "_tw-text-white"];
    private usedInputGutters: UsedInputGutters;

    constructor() {
        super(["placeholder"], {
            classes: ["papyros-input-editor", "_tw-overflow-auto",
                "_tw-border-solid", "_tw-border-gray-200", "_tw-border-2", "_tw-rounded-lg",
                "dark:_tw-bg-dark-mode-bg", "dark:_tw-border-dark-mode-content",
                "focus:_tw-outline-none", "focus:_tw-ring-1", "focus:_tw-ring-blue-500"],
            minHeight: "10vh",
            maxHeight: "20vh"
        }
        );
        this.usedInputGutters = new UsedInputGutters();
        this.addExtension(this.usedInputGutters.toExtension());
    }

    public highlight(getInfo: (lineNr: number) => UsedInputGutterInfo): void {
        this.editorView.dom.querySelectorAll(".cm-line").forEach((line, i) => {
            const info = getInfo(i + 1);
            BatchInputEditor.HIGHLIGHT_CLASSES.forEach(c => {
                line.classList.toggle(c, info.on);
            });
            this.usedInputGutters.setMarker(this.editorView, info);
        });
    }

    public getLines(): Array<string> {
        const lines = [];
        // Always need to call next atleast once
        let lineIterator = this.editorView.state.doc.iterLines().next();
        while (!lineIterator.done) {
            lines.push(lineIterator.value);
            lineIterator = lineIterator.next();
        }
        if (lines.length > 0 && lines[lines.length - 1] === "") {
            // Don't count last line as actual input
            lines.splice(lines.length - 1, 1);
        }
        return lines;
    }
}

export class BatchInputHandler extends UserInputHandler {
    /**
     * The index of the next line in lines to send
     */
    private lineNr: number;
    private prompts: Array<string>;

    private batchEditor: BatchInputEditor;
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
        this.prompts = [];
        this.batchEditor = new BatchInputEditor();
        this.batchEditor.onChange({
            onChange: this.handleInputChanged.bind(this),
            delay: 0
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
            this.batchEditor.setText(this.previousInput);
        } else {
            this.previousInput = this.batchEditor.getText();
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
        return this.batchEditor.getLines();
    }

    public override hasNext(): boolean {
        return this.lineNr < this.lines.length;
    }

    private highlight(whichLines = (i: number) => i < this.lineNr): void {
        this.batchEditor.highlight((lineNr: number) => {
            let message = t("Papyros.used_input");
            const index = lineNr - 1;
            const shouldShow = whichLines(index);
            if (index < this.prompts.length && this.prompts[index]) {
                message = t("Papyros.used_input_with_prompt",
                    { prompt: this.prompts[index] });
            }
            return { lineNr, on: shouldShow, title: message };
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
        this.batchEditor.reconfigure(["placeholder", placeholder(promptPlaceholder)]);
    }

    public focus(): void {
        this.batchEditor.focus();
    }

    protected override _render(options: RenderOptions): void {
        this.batchEditor.render(options);
    }
}
