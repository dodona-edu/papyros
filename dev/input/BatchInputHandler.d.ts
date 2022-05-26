import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import { RenderOptions } from "../util/Rendering";
export declare class BatchInputHandler extends UserInputHandler {
    private static HIGHLIGHT_CLASSES;
    /**
     * The index of the next line in lines to send
     */
    private lineNr;
    private promptCompartment;
    private inputAreaView;
    /**
     * The previous input of the user
     * Is restored upon switching back to InputMode.Batch
     */
    private previousInput;
    /**
     * Construct a new BatchInputHandler
     * @param {function()} inputCallback  Callback for when the user has entered a value
     */
    constructor(inputCallback: () => void);
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
    protected setPlaceholder(promptPlaceholder: string): void;
    protected focus(): void;
    protected _render(options: RenderOptions): void;
}
