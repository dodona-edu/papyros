import { INPUT_TA_ID } from "../Constants";
import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import {
    RenderOptions, renderWithOptions
} from "../util/Rendering";
import { placeCaretAtEnd } from "../util/Util";

export class BatchInputHandler extends UserInputHandler {
    /**
     * The index of the next line in lines to send
     */
    private lineNr: number;
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
    }

    public override toggle(active: boolean): void {
        if (active) {
            this.inputArea.value = this.previousInput;
        } else {
            this.previousInput = this.inputArea.value;
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
        const l = this.inputArea.innerText.split("\n");
        if (!l[l.length - 1]) { // last line is empty
            l.splice(l.length - 1); // do not consider it valid input
        }
        return l;
    }

    public override hasNext(): boolean {
        return this.lineNr < this.lines.length;
    }

    public override next(): string {
        const nextLine = this.lines[this.lineNr];
        this.lineNr += 1;
        return nextLine;
    }

    public override onRunStart(): void {
        this.lineNr = 0;
    }

    public override onRunEnd(): void {
        // Intentionally empty
    }

    protected setPlaceholder(placeholder: string): void {
        this.inputArea.setAttribute("data-placeholder", placeholder);
    }

    protected focus(): void {
        // Properly handle contentenditable div
        placeCaretAtEnd(this.inputArea);
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
<div id="${INPUT_TA_ID}"
class="_tw-border-2 _tw-w-full _tw-max-h-1/4 _tw-min-h-1/8 _tw-px-1 _tw-overflow-auto _tw-rounded-lg
dark:_tw-border-dark-mode-content dark:_tw-bg-dark-mode-bg with-placeholder
_tw-resize-y focus:_tw-outline-none focus:_tw-ring-1 focus:_tw-ring-blue-500"
contenteditable="true"></div>`);
        this.inputArea.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.waiting && ev.key.toLowerCase() === "enter") {
                // If user replaced lines, use them
                if (this.lines.length < this.lineNr) {
                    this.lineNr = this.lines.length - 1;
                }
                this.inputCallback();
            }
        });
        this.inputArea.addEventListener("change", () => {
            this.previousInput = this.inputArea.value;
        });
        this.inputArea.value = this.previousInput;
    }
}
