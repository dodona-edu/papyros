import I18n from "i18n-js";
import {
    INPUT_AREA_WRAPPER_ID,
    INPUT_RELATIVE_URL, INPUT_TA_ID
} from "./Constants";
import { papyrosLog, LogType } from "./util/Logging";
import { addListener } from "./util/Util";

const t = I18n.t;

export enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.Interactive];

export class InputManager {
    inputWrapper: HTMLElement;
    inputMode: InputMode;
    lineNr: number;
    waiting: boolean;
    onSend: () => void;

    inputTextArray?: Uint8Array;
    inputMetaData?: Int32Array;
    textEncoder: TextEncoder;

    constructor(onSend: () => void, inputMode: InputMode) {
        this.inputWrapper = document.getElementById(INPUT_AREA_WRAPPER_ID) as HTMLElement;
        this.inputMode = inputMode;
        this.lineNr = 0;
        this.textEncoder = new TextEncoder();
        if (typeof SharedArrayBuffer !== "undefined") {
            papyrosLog(LogType.Important, "Using SharedArrayBuffers");
            // shared memory
            this.inputTextArray = new Uint8Array(
                new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * 1024));
            // 2 Int32s:
            // index 0 indicates whether data is written
            // index 1 denotes length of the string
            this.inputMetaData = new Int32Array(
                new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));
        } else {
            papyrosLog(LogType.Important, "Using serviceWorker for input");
        }
        this.waiting = false;
        this.onSend = onSend;
        this.buildInputArea();
    }

    get inputArea(): HTMLInputElement {
        return document.getElementById(INPUT_TA_ID) as HTMLInputElement;
    }

    buildInputArea(): void {
        const inputArea = this.inputMode === InputMode.Batch ? `
        <textarea id="code-input-area" 
        class="border-2 h-auto w-full max-h-1/4 overflow-auto" rows="5">
        </textarea>` : `
        <div class="flex flex-row">
            <input id="code-input-area" type="text"
            class="border-2 h-auto w-full overflow-auto">
            </input>
            <button id="send-input-button" type="button"
            class="text-black bg-white border-2 px-4
                   disabled:opacity-50 disabled:cursor-wait">
                   ${t("Papyros.enter")}
            </button>
        </div>`;
        const otherMode = this.inputMode === InputMode.Batch ?
            InputMode.Interactive : InputMode.Batch;
        const switchMode = `
            <a id="switch-input-mode" data-value="${otherMode}"
             class="flex flex-row-reverse hover:cursor-pointer text-blue-500">
                ${t(`Papyros.input_modes.switch_to_${otherMode}`)}
            </a>
        `;
        this.inputWrapper.innerHTML = `
        ${inputArea}
        ${switchMode}
        `;
        addListener<InputMode>("switch-input-mode", im => this.setInputMode(im),
            "click", "data-value");

        this.inputArea.onkeydown = async e => {
            if (this.waiting &&
                e.key.toLowerCase() === "enter") {
                papyrosLog(LogType.Debug, "Pressed enter! Sending input to user");
                await this.sendInput();
                if (!this.waiting) {
                    this.inputArea.value = "";
                }
            }
        };
    }

    setInputMode(inputMode: InputMode): void {
        if (inputMode !== this.inputMode) {
            this.inputMode = inputMode;
            this.buildInputArea();
        }
    }

    async sendInput(): Promise<void> {
        papyrosLog(LogType.Debug, "Handling send Input in Papyros");
        const lines = this.inputArea.value.split("\n");
        if (lines.length > this.lineNr && lines[this.lineNr]) {
            papyrosLog(LogType.Debug, "Sending input to user: " + lines[this.lineNr]);
            const line = lines[this.lineNr];
            if (!this.inputMetaData || !this.inputTextArray) {
                await fetch(INPUT_RELATIVE_URL,
                    {
                        method: "POST",
                        body: JSON.stringify({ "input": line })
                    });
            } else {
                const encoded = this.textEncoder.encode(lines[this.lineNr]);
                this.inputTextArray.set(encoded);
                Atomics.store(this.inputMetaData, 1, encoded.length);
                Atomics.store(this.inputMetaData, 0, 1);
            }
            this.lineNr += 1;
            this.waiting = false;
            this.onSend();
        } else {
            papyrosLog(LogType.Debug, "Had no input to send, still waiting!");
            this.waiting = true;
        }
    }

    onRunStart(): void {
        if (this.inputMode === InputMode.Interactive) {
            this.inputArea.value = "";
        }
    }

    onRunEnd(): void {
        this.lineNr = 0;
    }
}
