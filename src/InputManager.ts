import { t } from "i18n-js";
import {
    SWITCH_INPUT_MODE_A_ID,
    USER_INPUT_WRAPPER_ID
} from "./Constants";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { papyrosLog, LogType } from "./util/Logging";
import {
    addListener, parseData,
    RenderOptions, renderWithOptions
} from "./util/Util";
import { Channel, makeChannel, writeMessage } from "sync-message";
import { InteractiveInputHandler } from "./input/InteractiveInputHandler";
import { UserInputHandler } from "./input/UserInputHandler";
import { BatchInputHandler } from "./input/BatchInputHandler";
import { PdbInputHandler } from "./input/PdbInputHandler";
import { BackendManager } from "./BackendManager";

export enum InputMode {
    Interactive = "interactive",
    Batch = "batch",
    Debugging = "debugging"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.Interactive];

export interface InputData {
    prompt: string;
    messageId: string;
}

export class InputManager {
    private previousInputMode: InputMode;
    private _inputMode: InputMode;
    private inputHandlers: Map<InputMode, UserInputHandler>;
    private renderOptions: RenderOptions;
    _waiting: boolean;
    prompt: string;

    onSend: () => void;
    channel: Channel;
    messageId = "";

    constructor(onSend: () => void) {
        this.inputHandlers = this.buildInputHandlerMap();
        this._inputMode = InputMode.Interactive;
        this.inputHandler.addInputListener(this);
        this.previousInputMode = this._inputMode;
        this.channel = makeChannel()!; // by default we try to use Atomics
        this.onSend = onSend;
        this._waiting = false;
        this.prompt = "";
        this.renderOptions = {} as RenderOptions;
        BackendManager.subscribe(BackendEventType.Start, () => this.onRunStart());
        BackendManager.subscribe(BackendEventType.End, () => this.onRunEnd());
        BackendManager.subscribe(BackendEventType.Input, e => this.onInputRequest(e));
    }

    private buildInputHandlerMap(): Map<InputMode, UserInputHandler> {
        const interactiveInputHandler: UserInputHandler =
            new InteractiveInputHandler();
        const batchInputHandler: UserInputHandler =
            new BatchInputHandler();
        const debuggingInputHandler: UserInputHandler =
            new PdbInputHandler();
        return new Map([
            [InputMode.Interactive, interactiveInputHandler],
            [InputMode.Batch, batchInputHandler],
            [InputMode.Debugging, debuggingInputHandler]
        ]);
    }

    get inputMode(): InputMode {
        return this._inputMode;
    }

    set inputMode(inputMode: InputMode) {
        this.inputHandler.onToggle(false);
        this._inputMode = inputMode;
        this.render(this.renderOptions);
        this.inputHandler.onToggle(true);
        this.inputHandler.addInputListener(this);
    }

    get inputHandler(): UserInputHandler {
        return this.inputHandlers.get(this.inputMode)!;
    }

    render(options: RenderOptions): void {
        this.renderOptions = options;
        let switchMode = "";
        if (this.inputMode !== InputMode.Debugging) {
            const otherMode = this.inputMode === InputMode.Interactive ?
                InputMode.Batch : InputMode.Interactive;
            switchMode = `<a id="${SWITCH_INPUT_MODE_A_ID}" data-value="${otherMode}"
            class="flex flex-row-reverse hover:cursor-pointer text-blue-500">
               ${t(`Papyros.input_modes.switch_to_${otherMode}`)}
            </a>`;
        }

        renderWithOptions(options, `
<div id="${USER_INPUT_WRAPPER_ID}">
</div>
${switchMode}`);
        if (this.inputMode !== InputMode.Debugging) {
            addListener<InputMode>(SWITCH_INPUT_MODE_A_ID, im => this.inputMode = im,
                "click", "data-value");
        }
        this.inputHandler.render({ parentElementId: USER_INPUT_WRAPPER_ID });
        this.inputHandler.waitWithPrompt(this._waiting, this.prompt);
    }

    set waiting(waiting: boolean) {
        this._waiting = waiting;
        this.inputHandler.waitWithPrompt(waiting, this.prompt);
    }

    async onUserInput(): Promise<void> {
        if (this.inputHandler.hasNext()) {
            const line = this.inputHandler.next();
            papyrosLog(LogType.Debug, "Sending input to user: " + line);
            await writeMessage(this.channel, line, this.messageId);
            this.waiting = false;
            this.onSend();
        } else {
            papyrosLog(LogType.Debug, "Had no input to send, still waiting!");
            this.waiting = true;
        }
    }

    /**
     * Asynchronously handle an input request by prompting the user for input
     * @param {BackendEvent} e Event containing the input data
     * @return {Promise<void>} Promise of handling the request
     */
    async onInputRequest(e: BackendEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Handling input request in Papyros");
        const data = parseData(e.data, e.contentType) as InputData;
        this.messageId = data.messageId;
        this.prompt = data.prompt;
        return this.onUserInput();
    }

    onRunStart(): void {
        this.waiting = false;
        this.previousInputMode = this.inputMode;
        this.inputHandler.onRunStart();
    }

    onRunEnd(): void {
        this.prompt = "";
        this.inputHandler.onRunEnd();
        this.waiting = false;
        if (this.previousInputMode !== this.inputMode) {
            this.inputMode = this.previousInputMode;
        }
    }
}
