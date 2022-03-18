import { DEBUGGING_INTERACTIVE_WRAPPER_ID } from "../Constants";
import { InputMode } from "../InputManager";
import { ProgrammingLanguage } from "../ProgrammingLanguage";
import {
    addListener,
    renderButton, RenderOptions, renderWithOptions, t
} from "../util/Util";
import { InteractiveInputHandler } from "./InteractiveInputHandler";

export enum DebuggingCommand {
    StepOver = "step_over",
    StepInto = "step_into",
    Continue = "continue"
}
const DEBUGGING_COMMANDS = [
    DebuggingCommand.StepOver, DebuggingCommand.StepInto, DebuggingCommand.Continue
];

export class DebuggingInputHandler extends InteractiveInputHandler {
    protected programmingLanguage: ProgrammingLanguage;
    private commandMap: Map<ProgrammingLanguage, Map<DebuggingCommand, string>>;
    private command: DebuggingCommand | undefined;

    getInputMode(): InputMode {
        return InputMode.Debugging;
    }
    /**
     * Construct a new InteractiveInputHandler
     * @param {function()} onInput  Callback for when the user has entered a value
     * @param {string} inputAreaId HTML identifier for the used HTML input field
     * @param {string} sendButtonId HTML identifier for the used HTML button
     * @param {ProgrammingLanguage} programmingLanguage The currently used language
     */
    constructor(onInput: () => void, inputAreaId: string,
        sendButtonId: string, programmingLanguage: ProgrammingLanguage) {
        super(onInput, inputAreaId, sendButtonId);
        this.programmingLanguage = programmingLanguage;
        this.commandMap = DebuggingInputHandler.buildCommandMap();
        this.command = undefined;
    }

    static buildCommandMap(): Map<ProgrammingLanguage, Map<DebuggingCommand, string>> {
        const commandMap = new Map();
        commandMap.set(ProgrammingLanguage.Python, new Map([
            [DebuggingCommand.StepInto, "s\n"],
            [DebuggingCommand.StepOver, "n\n"],
            [DebuggingCommand.Continue, "c\n"]
        ]));
        commandMap.set(ProgrammingLanguage.JavaScript, new Map());
        return commandMap;
    }

    hasNext(): boolean {
        return this.command !== undefined || this.inputArea.value !== "";
    }

    next(): string {
        let nextValue = "";
        if (this.command) {
            const m = this.commandMap.get(this.programmingLanguage) || new Map();
            nextValue = m.get(this.command) || "";
        } else {
            nextValue = this.inputArea.value;
        }
        this.reset();
        return nextValue;
    }

    protected reset(): void {
        if (this.command !== undefined) {
            this.command = undefined;
        } else {
            super.reset();
        }
    }

    render(options: RenderOptions): HTMLElement {
        const buttons = DEBUGGING_COMMANDS.map(command => {
            return renderButton({
                id: command,
                buttonText: t(`Papyros.debugging_command.${command}`)
            });
        }).join("\n");
        const rendered = renderWithOptions(options, `
        <div class="flex flex-row">
            ${buttons}
        </div>
        <div id="${DEBUGGING_INTERACTIVE_WRAPPER_ID}">
        </div>`);
        super.render({ parentElementId: DEBUGGING_INTERACTIVE_WRAPPER_ID });
        DEBUGGING_COMMANDS.forEach(command => {
            addListener(command, () => {
                this.command = command;
                this.onInput();
            }, "click");
        });
        return rendered;
    }
}
