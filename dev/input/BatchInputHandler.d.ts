import { InputManagerRenderOptions, InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import { BatchInputEditor } from "../editor/BatchInputEditor";
export declare class BatchInputHandler extends UserInputHandler {
    /**
     * The index of the next line in lines to send
     */
    private lineNr;
    /**
     * Messages used when asking for user input
     */
    private prompts;
    /**
     * Whether a run is occurring
     */
    private running;
    /**
     * Editor containing the input of the user
     */
    readonly batchEditor: BatchInputEditor;
    /**
     * The previous input of the user
     * Is restored upon switching back to InputMode.Batch
     */
    private previousInput;
    /**
     * Construct a new BatchInputHandler
     * @param {function()} inputCallback  Callback for when the user has entered a value
     */
    constructor(inputCallback: (line: string) => void);
    /**
     * Handle new input, potentially sending it to the awaiting receiver
     * @param {string} newInput The new user input
     */
    private handleInputChanged;
    toggle(active: boolean): void;
    getInputMode(): InputMode;
    /**
     * Retrieve the lines of input that the user has given so far
     * @return {Array<string>} The entered lines
     */
    protected get lines(): Array<string>;
    hasNext(): boolean;
    private highlight;
    next(): string;
    onRunStart(): void;
    onRunEnd(): void;
    waitWithPrompt(waiting: boolean, prompt?: string): void;
    protected setPlaceholder(placeholderValue: string): void;
    focus(): void;
    protected _render(options: InputManagerRenderOptions): void;
}
