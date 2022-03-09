import { t } from "i18n-js";
import {
    SWITCH_INPUT_MODE_A_ID,
    INPUT_TA_ID, SEND_INPUT_BTN_ID, USER_INPUT_WRAPPER_ID
} from "./Constants";
import { PapyrosEvent } from "./PapyrosEvent";
import { papyrosLog, LogType } from "./util/Logging";
import {
    addListener, parseData,
    RenderOptions, renderWithOptions
} from "./util/Util";
import { Channel, makeChannel, writeMessage } from "sync-message";
import { InteractiveInputHandler } from "./input/InteractiveInputHandler";
import { UserInputHandler } from "./input/UserInputHandler";
import { BatchInputHandler } from "./input/BatchInputHandler";
import { RunListener } from "./RunListener";

export enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.Interactive];

export interface InputData {
    prompt: string;
    messageId: string;
}

export class InputManager implements RunListener {
    private _inputMode: InputMode;
    private inputHandlers: Map<InputMode, UserInputHandler>;
    private renderOptions: RenderOptions;
    _waiting: boolean;
    prompt: string;

    onSend: () => void;
    channel: Channel;
    messageId = "";

    constructor(onSend: () => void, inputMode: InputMode) {
        this._inputMode = inputMode;
        this.channel = makeChannel()!; // by default we try to use Atomics
        this.onSend = onSend;
        this._waiting = false;
        this.prompt = "";
        this.inputHandlers = this.buildInputHandlerMap();
        this.renderOptions = {} as RenderOptions;
    }

    private buildInputHandlerMap(): Map<InputMode, UserInputHandler> {
        const interactiveInputHandler: UserInputHandler =
            new InteractiveInputHandler(() => this.sendLine(), INPUT_TA_ID, SEND_INPUT_BTN_ID);
        const batchInputHandler: UserInputHandler =
            new BatchInputHandler(() => this.sendLine(), INPUT_TA_ID);
        return new Map([
            [InputMode.Interactive, interactiveInputHandler],
            [InputMode.Batch, batchInputHandler]
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
    }

    get inputHandler(): UserInputHandler {
        return this.inputHandlers.get(this.inputMode)!;
    }

    render(options: RenderOptions): void {
        this.renderOptions = options;
        const otherMode = this.inputMode === InputMode.Interactive ?
            InputMode.Batch : InputMode.Interactive;
        renderWithOptions(options, `
<div id="${USER_INPUT_WRAPPER_ID}">
</div>
<a id="${SWITCH_INPUT_MODE_A_ID}" data-value="${otherMode}"
class="flex flex-row-reverse hover:cursor-pointer text-blue-500">
   ${t(`Papyros.input_modes.switch_to_${otherMode}`)}
</a>`);
        addListener<InputMode>(SWITCH_INPUT_MODE_A_ID, im => this.inputMode = im,
            "click", "data-value");
        this.inputHandler.render({ parentElementId: USER_INPUT_WRAPPER_ID });
        this.inputHandler.waitWithPrompt(this._waiting, this.prompt);
    }

    set waiting(waiting: boolean) {
        this._waiting = waiting;
        this.inputHandler.waitWithPrompt(waiting, this.prompt);
    }

    async sendLine(): Promise<void> {
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
     * @param {PapyrosEvent} e Event containing the input data
     * @return {Promise<void>} Promise of handling the request
     */
    async onInput(e: PapyrosEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Handling input request in Papyros");
        const data = parseData(e.data, e.contentType) as InputData;
        this.messageId = data.messageId;
        this.prompt = data.prompt;
        return this.sendLine();
    }

    onRunStart(): void {
        this.waiting = false;
        this.inputHandler.onRunStart();
    }

    onRunEnd(): void {
        this.prompt = "";
        this.inputHandler.onRunEnd();
        this.waiting = false;
    }
}
