import { DEBUGGING_INTERACTIVE_WRAPPER_ID } from "../Constants";
import { InputMode } from "../InputManager";
import {
    addListener,
    renderButton, RenderOptions, renderWithOptions, t
} from "../util/Util";
import { InteractiveInputHandler } from "./InteractiveInputHandler";

/**
 * Enum representing commands the user can give during an interactive debugging session
 */
export enum DebuggingCommand {
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
const DEBUGGING_COMMANDS = [
    DebuggingCommand.StepOver, DebuggingCommand.StepInto, DebuggingCommand.Continue
];

/**
 * Base class for interactive debugging input handlers
 * This allows communication between an interactive debugger that uses
 * textual commands and the user.
 */
export abstract class DebuggingInputHandler extends InteractiveInputHandler {
    /**
     * Whether we are handling a debugging command or an actual input call
     */
    protected debugging: boolean;
    /**
     * Maps a command to its textual representation for the debugger
     * The command does not need to end with \n, this will be added if missing
     */
    private commandMap: Map<DebuggingCommand, string>;
    /**
     * The command the user picked
     */
    private command: DebuggingCommand | undefined;

    /**
     * Construct a new DebuggingInputHandler
     */
    constructor() {
        super();
        this.commandMap = this.buildCommandMap();
        this.command = undefined;
        this.debugging = false;
    }

    override getInputMode(): InputMode {
        return InputMode.Debugging;
    }

    /**
     * Build the map to convert DebuggingCommands to strings
     */
    protected abstract buildCommandMap(): Map<DebuggingCommand, string>;

    override hasNext(): boolean {
        return (this.debugging && this.command !== undefined) ||
            super.hasNext();
    }

    override next(): string {
        let nextValue = "";
        if (this.command) { // Process debugging command
            nextValue = this.commandMap.get(this.command) || "";
            if (!nextValue.endsWith("\n")) {
                nextValue += "\n";
            }
            this.reset();
        } else { // Process regular input prompt
            nextValue = super.next();
        }
        return nextValue;
    }

    protected override reset(): void {
        this.command = undefined;
        this.debugging = false;
        super.reset();
    }

    /**
     * Callback for when a specific command button is clicked
     * @param {DebuggingCommand} command The command attached to the button
     */
    protected onCommandButtonClicked(command: DebuggingCommand): void {
        if (this.debugging) {
            this.command = command;
            this.onUserInput();
        }
    }

    render(options: RenderOptions): HTMLElement {
        const buttons = DEBUGGING_COMMANDS.map(command => {
            return renderButton({
                id: command,
                buttonText: t(`Papyros.debugging_command.${command}`),
                extraClasses: `btn-debugging-${command.replaceAll("_", "-")}`
            });
        }).join("\n");
        const rendered = renderWithOptions(options, `
        <div class="flex flex-row">
            ${buttons}
        </div>
        <div id="${DEBUGGING_INTERACTIVE_WRAPPER_ID}">
        </div>`);
        super.render({ parentElementId: DEBUGGING_INTERACTIVE_WRAPPER_ID });
        // Add listeners after buttons are rendered
        DEBUGGING_COMMANDS.forEach(command => {
            addListener(command, () => this.onCommandButtonClicked(command), "click");
        });
        return rendered;
    }
}
