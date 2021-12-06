import { INPUT_AREA_WRAPPER_ID, INPUT_MODE_SELECT_ID, INPUT_RELATIVE_URL, INPUT_TA_ID } from "./Constants";
import { papyrosLog, LogType } from "./util/Logging";

export enum InputMode {
    SingleLine = "SingleLine",
    Batch = "Batch"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.SingleLine];

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
        const inputModeSelect = document.getElementById(INPUT_MODE_SELECT_ID) as HTMLSelectElement;
        inputModeSelect.addEventListener("change",
            () => this.setInputMode(InputMode[inputModeSelect.value as keyof typeof InputMode]));
        this.buildInputArea();
    }

    get inputArea(): HTMLInputElement {
        return document.getElementById(INPUT_TA_ID) as HTMLInputElement;
    }

    buildInputArea(): void {
        this.inputWrapper.innerHTML = this.inputMode === InputMode.Batch ? `
        <textarea id="code-input-area" 
        class="border-2 h-auto w-full max-h-1/4 overflow-auto" rows="5">
        </textarea>` : `
        <input id="code-input-area" type="text"
        class="border-2 h-auto w-full overflow-auto">
        </input>`;
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
}
