import { t } from "i18n-js";
import {
    SWITCH_INPUT_MODE_A_ID,
    USER_INPUT_WRAPPER_ID
} from "./Constants";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { papyrosLog, LogType } from "./util/Logging";
import {
    addListener,
} from "./util/Util";
import { InteractiveInputHandler } from "./input/InteractiveInputHandler";
import { UserInputHandler } from "./input/UserInputHandler";
import { BatchInputHandler } from "./input/BatchInputHandler";
import { BackendManager } from "./BackendManager";
import { RenderOptions, renderWithOptions } from "./util/Rendering";

export enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.Interactive];

export class InputManager {
    private inputMode: InputMode;
    private inputHandlers: Map<InputMode, UserInputHandler>;
    private renderOptions: RenderOptions;
    private waiting: boolean;
    private prompt: string;

    private sendInput: (input: string) => void;

    constructor(sendInput: (input: string) => void) {
        this.inputHandlers = this.buildInputHandlerMap();
        this.inputMode = InputMode.Interactive;
        this.sendInput = sendInput;
        this.waiting = false;
        this.prompt = "";
        this.renderOptions = {} as RenderOptions;
        BackendManager.subscribe(BackendEventType.Start, () => this.onRunStart());
        BackendManager.subscribe(BackendEventType.End, () => this.onRunEnd());
        BackendManager.subscribe(BackendEventType.Input, e => this.onInputRequest(e));
    }

    private buildInputHandlerMap(): Map<InputMode, UserInputHandler> {
        const interactiveInputHandler: UserInputHandler =
            new InteractiveInputHandler(() => this.onUserInput());
        const batchInputHandler: UserInputHandler =
            new BatchInputHandler(() => this.onUserInput());
        return new Map([
            [InputMode.Interactive, interactiveInputHandler],
            [InputMode.Batch, batchInputHandler]
        ]);
    }

    getInputMode(): InputMode {
        return this.inputMode;
    }

    setInputMode(inputMode: InputMode): void {
        this.inputHandler.onToggle(false);
        this.inputMode = inputMode;
        this.render(this.renderOptions);
        this.inputHandler.onToggle(true);
    }

    get inputHandler(): UserInputHandler {
        return this.inputHandlers.get(this.inputMode)!;
    }

    render(options: RenderOptions): void {
        this.renderOptions = options;
        let switchMode = "";
        const otherMode = this.inputMode === InputMode.Interactive ?
            InputMode.Batch : InputMode.Interactive;
        switchMode = `<a id="${SWITCH_INPUT_MODE_A_ID}" data-value="${otherMode}"
        class="flex flex-row-reverse hover:cursor-pointer text-blue-500">
            ${t(`Papyros.input_modes.switch_to_${otherMode}`)}
        </a>`;

        renderWithOptions(options, `
<div id="${USER_INPUT_WRAPPER_ID}" class="my-1">
</div>
${switchMode}`);
        addListener<InputMode>(SWITCH_INPUT_MODE_A_ID, im => this.setInputMode(im),
            "click", "data-value");

        this.inputHandler.render({
            parentElementId: USER_INPUT_WRAPPER_ID,
            darkMode: options.darkMode
        });
        this.inputHandler.waitWithPrompt(this.waiting, this.prompt);
    }

    waitWithPrompt(waiting: boolean, prompt = ""): void {
        this.waiting = waiting;
        this.prompt = prompt;
        this.inputHandler.waitWithPrompt(this.waiting, this.prompt);
    }

    async onUserInput(): Promise<void> {
        if (this.inputHandler.hasNext()) {
            const line = this.inputHandler.next();
            papyrosLog(LogType.Debug, "Sending input to user: " + line);
            this.sendInput(line);
            this.waitWithPrompt(false);
        } else {
            papyrosLog(LogType.Debug, "Had no input to send, still waiting!");
            this.waitWithPrompt(true, this.prompt);
        }
    }

    /**
     * Asynchronously handle an input request by prompting the user for input
     * @param {BackendEvent} e Event containing the input data
     * @return {Promise<void>} Promise of handling the request
     */
    async onInputRequest(e: BackendEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Handling input request in Papyros");
        this.prompt = e.data;
        return await this.onUserInput();
    }

    onRunStart(): void {
        this.waitWithPrompt(false);
        this.inputHandler.onRunStart();
    }

    onRunEnd(): void {
        this.inputHandler.onRunEnd();
        this.waitWithPrompt(false);
    }
}
