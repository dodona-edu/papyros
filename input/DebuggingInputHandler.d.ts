import { InputMode } from "../InputManager";
import { RenderOptions } from "../util/Util";
import { InteractiveInputHandler } from "./InteractiveInputHandler";
/**
 * Enum representing commands the user can give during an interactive debugging session
 */
export declare enum DebuggingCommand {
    /**
     * The step over command runs code until the next code line in the source file is reached.
     * With next line, we mean the actual source code line following the current line
     * This will not follow function calls or return to callers.
     */
    StepOver = "step_over",
    /**
     * The step into command runs until another line in the source file is executed.
     * This command will e.g. go into function calls or return back to the caller
     */
    StepInto = "step_into",
    /**
     * This command runs until the next breakpoint in the source file is reached.
     */
    Continue = "continue"
}
/**
 * Base class for interactive debugging input handlers
 * This allows communication between an interactive debugger that uses
 * textual commands and the user.
 */
export declare abstract class DebuggingInputHandler extends InteractiveInputHandler {
    /**
     * Whether we are handling a debugging command or an actual input call
     */
    protected debugging: boolean;
    /**
     * Maps a command to its textual representation for the debugger
     * The command does not need to end with \n, this will be added if missing
     */
    private commandMap;
    /**
     * The command the user picked
     */
    private command;
    /**
     * Construct a new DebuggingInputHandler
     */
    constructor();
    getInputMode(): InputMode;
    /**
     * Build the map to convert DebuggingCommands to strings
     */
    protected abstract buildCommandMap(): Map<DebuggingCommand, string>;
    hasNext(): boolean;
    next(): string;
    protected reset(): void;
    /**
     * Callback for when a specific command button is clicked
     * @param {DebuggingCommand} command The command attached to the button
     */
    protected onCommandButtonClicked(command: DebuggingCommand): void;
    render(options: RenderOptions): HTMLElement;
}
