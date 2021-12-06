/* eslint-disable max-len */
import { proxy, Remote } from "comlink";
import I18n from "i18n-js";
import { Backend } from "./Backend";
import { getBackend, stopBackend } from "./BackendManager";
import { CodeEditor } from "./CodeEditor";
import {
    APPLICATION_STATE_TEXT_ID, EDITOR_WRAPPER_ID, DEFAULT_LOCALE, DEFAULT_PROGRAMMING_LANGUAGE, INPUT_RELATIVE_URL,
    INPUT_TA_ID, PROGRAMMING_LANGUAGE_SELECT_ID, OUTPUT_TA_ID,
    RUN_BTN_ID, STATE_SPINNER_ID, TERMINATE_BTN_ID, LOCALE_SELECT_ID
} from "./Constants";
import { PapyrosEvent } from "./PapyrosEvent";
import { plFromString, ProgrammingLanguage, PROGRAMMING_LANGUAGES } from "./ProgrammingLanguage";
import * as TRANSLATIONS from "./Translations";
import { LogType, papyrosLog } from "./util/Logging";

function loadTranslations(): void {
    for (const [language, translations] of Object.entries(TRANSLATIONS)) {
        // Add keys to already existing translations if they exist
        I18n.translations[language] = Object.assign((I18n.translations[language] || {}), translations);
    }
}

const t = I18n.t;

function getSelectOptions<T>(options: Array<T>, selected: T, optionText: (option: T) => string): string {
    return options.map(option => {
        const selectedValue = selected === option ? "selected" : "";
        return `
            <option ${selectedValue} value="${option}">
                ${optionText(option)}
            </option>
        `;
    }).join("\n");
}

function renderPapyros(parent: HTMLElement, programmingLanguage: ProgrammingLanguage,
    standAlone: boolean, locale: string): void {
    const programmingLanguageSelect = standAlone ?
        `
        <div class="mr-2">
            <label for="programming-language-select">${t("Papyros.programming_language")}</label>
            <select id="programming-language-select" class="m-2 border-2">
                ${getSelectOptions(PROGRAMMING_LANGUAGES, programmingLanguage, l => t(`Papyros.programming_languages.${l}`))} 
            </select>
        </div>
        ` : "";
    const locales = [locale, ...Object.keys(TRANSLATIONS).filter(l => l != locale)];
    const localeSelect = standAlone ?
        `
        <div class="flex flex-row-reverse">
            <!-- row-reverse to start at the right, so put elements in order of display -->
            <select id="locale-select" class="m-2 border-2">
                ${getSelectOptions(locales, locale, l => t(`Papyros.locales.${l}`))}
            </select>
            <i class="mdi mdi-web text-4xl text-white"></i>
        </div>
        ` : "";

    const navBar = standAlone ?
        `
        <div class="bg-blue-500 text-white text-lg p-4 grid grid-cols-8 items-center">
            <div class="col-span-6">
                ${t("Papyros.Papyros")}
            </div>
            <div class="col-span-2 text-black">
                ${localeSelect}
            </div>
        </div>
        ` : "";
    parent.innerHTML =
        `
    <div id="papyros" class="max-h-screen h-full overflow-y-hidden">
    ${navBar}
    <div class="m-10">
      <!-- Header -->
      <div class="flex flex-row items-center">
        ${programmingLanguageSelect}
        <button id="run-code-btn" type="button"
          class="text-white bg-blue-500 border-2 px-4 inset-y-2 rounded-lg
                 disabled:opacity-50 disabled:cursor-wait">
            ${t("Papyros.run")}
        </button>
        <button id="terminate-btn" type="button" 
            class="text-white bg-red-500 border-2 m-3 px-4 inset-y-2 rounded-lg
            disabled:opacity-50 disabled:cursor-wait">
            ${t("Papyros.terminate")}
        </button>
        <div class="flex flex-row items-center">
          <svg id="state-spinner" class="animate-spin mr-3 h-5 w-5 text-white"
           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" display="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="red" stroke-width="4"></circle>
          <path class="opacity-75" fill="red"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <div id="application-state-text">${t("Papyros.states.loading")}</div>
        </div>
      </div>

      <!--Body of the application-->
      <div class="grid grid-cols-2 gap-4 box-border max-h-full">
        <!--Left code section-->
        <div class="col-span-1">
          <h1>${t("Papyros.enter_code")}:</h1>
          <div id="code-area" class="overflow-auto max-h-full min-h-1/4 border-solid border-gray-200 border-2"></div>
        </div>
        <!--Right user input and output section-->
        <div class="col-span-1">
          <h1>${t("Papyros.enter_input")}:</h1>
          <textarea id="code-input-area" class="border-2 h-auto w-full max-h-1/4 overflow-auto" rows="5"></textarea>
          <h1>${t("Papyros.code_output")}:</h1>
          <textarea id="code-output-area" readonly class="border-2 w-full min-h-1/5 max-h-3/5 overflow-auto"></textarea>
        </div>
      </div>
    </div>
  </div>
    `;
}


enum PapyrosState {
    Loading = "loading",
    Running = "running",
    AwaitingInput = "awaiting_input",
    Terminating = "terminating",
    Ready = "ready"
}

class PapyrosStateManager {
    state: PapyrosState;
    stateSpinner: HTMLElement;
    stateText: HTMLElement;
    runButton: HTMLButtonElement;
    terminateButton: HTMLButtonElement;

    constructor() {
        this.stateSpinner = document.getElementById(STATE_SPINNER_ID) as HTMLElement;
        this.stateText = document.getElementById(APPLICATION_STATE_TEXT_ID) as HTMLElement;
        this.runButton = document.getElementById(RUN_BTN_ID) as HTMLButtonElement;
        this.terminateButton = document.getElementById(TERMINATE_BTN_ID) as HTMLButtonElement;
        this.state = PapyrosState.Ready;
    }

    setState(state: PapyrosState, message?: string): void {
        if (state !== this.state) {
            this.state = state;
            this.terminateButton.disabled = [PapyrosState.Ready, PapyrosState.Loading].includes(state);
            if (state === PapyrosState.Ready) {
                this.stateSpinner.style.display = "none";
                this.runButton.disabled = false;
            } else {
                this.stateSpinner.style.display = "";
                this.runButton.disabled = true;
            }
            this.stateText.innerText = message || t(`Papyros.states.${state}`);
        }
    }
}

interface PapyrosCodeState {
    programmingLanguage: ProgrammingLanguage;
    editor: CodeEditor;
    backend: Remote<Backend>;
    runId: number;
    outputArea: HTMLInputElement;
}

interface PapyrosInputState {
    lineNr: number;
    textEncoder: TextEncoder;
    inputArea: HTMLInputElement;
    inputTextArray?: Uint8Array;
    inputMetaData?: Int32Array;
}

interface PapyrosConfig {
    standAlone: boolean;
    locale?: string;
    programmingLanguage?: ProgrammingLanguage;
    inputTextArray?: Uint8Array;
    inputMetaData?: Int32Array;
}

export class Papyros {
    stateManager: PapyrosStateManager;
    codeState: PapyrosCodeState;
    inputState: PapyrosInputState;

    constructor(programmingLanguage: ProgrammingLanguage,
        inputTextArray?: Uint8Array, inputMetaData?: Int32Array) {
        this.stateManager = new PapyrosStateManager();
        this.codeState = {
            programmingLanguage: programmingLanguage,
            editor: new CodeEditor(
                document.getElementById(EDITOR_WRAPPER_ID) as HTMLInputElement, programmingLanguage),
            backend: {} as Remote<Backend>,
            outputArea: document.getElementById(OUTPUT_TA_ID) as HTMLInputElement,
            runId: 0
        };

        this.inputState = {
            lineNr: 0,
            textEncoder: new TextEncoder(),
            inputArea: document.getElementById(INPUT_TA_ID) as HTMLInputElement,
            inputTextArray: inputTextArray,
            inputMetaData: inputMetaData
        };
    }

    get state(): PapyrosState {
        return this.stateManager.state;
    }

    async launch(): Promise<Papyros> {
        this.stateManager.runButton.addEventListener("click", () => this.runCode());
        this.stateManager.terminateButton.addEventListener("click", () => this.terminate());

        this.inputState.inputArea.onkeydown = e => {
            papyrosLog(LogType.Debug, "Key down in inputArea", e);
            if (this.state === PapyrosState.AwaitingInput &&
                e.key.toLowerCase() === "enter") {
                papyrosLog(LogType.Debug, "Pressed enter! Sending input to user");
                this.sendInput();
            }
        };
        await this.startBackend();
        return this;
    }

    async setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void> {
        if (this.codeState.programmingLanguage !== programmingLanguage) {
            stopBackend(this.codeState.backend);
            this.codeState.programmingLanguage = programmingLanguage;
            this.codeState.editor.setLanguage(programmingLanguage);
            this.codeState.outputArea.value = "";
            await this.startBackend();
        }
    }

    async startBackend(): Promise<void> {
        const {
            programmingLanguage
        } = this.codeState;
        const {
            inputTextArray, inputMetaData
        } = this.inputState;
        this.stateManager.setState(PapyrosState.Loading);
        const backend = getBackend(programmingLanguage);
        await backend.launch(proxy(e => this.onMessage(e)), inputTextArray, inputMetaData);
        this.codeState.backend = backend;
        this.stateManager.setState(PapyrosState.Ready);
    }

    static fromElement(parent: HTMLElement, config: PapyrosConfig): Promise<Papyros> {
        const papyrosConfig: PapyrosConfig = Object.assign(
            {
                standAlone: true,
                programmingLanguage: DEFAULT_PROGRAMMING_LANGUAGE,
                locale: DEFAULT_LOCALE
            }, config
        );
        loadTranslations();
        I18n.locale = papyrosConfig.locale!;
        renderPapyros(parent, papyrosConfig.programmingLanguage!, papyrosConfig.standAlone, papyrosConfig.locale!);
        const papyros = new Papyros(papyrosConfig.programmingLanguage!, papyrosConfig.inputTextArray, papyrosConfig.inputMetaData);
        if (papyrosConfig.standAlone) {
            const programmingLanguageSelect = document.getElementById(PROGRAMMING_LANGUAGE_SELECT_ID) as HTMLSelectElement;
            programmingLanguageSelect.addEventListener("change",
                async () => {
                    return papyros.setProgrammingLanguage(plFromString(programmingLanguageSelect.value));
                }
            );

            const localeSelect = document.getElementById(LOCALE_SELECT_ID) as HTMLSelectElement;
            localeSelect.addEventListener("change", async () => {
                document.location.href = `?locale=${localeSelect.value}&language=${programmingLanguageSelect.value}`;
            });
        }
        return papyros.launch();
    }


    onError(e: PapyrosEvent): void {
        papyrosLog(LogType.Debug, "Got error in Papyros: ", e);
        // todo prettify errors
        this.codeState.outputArea.value += e.data;
    }

    async sendInput(): Promise<boolean> {
        papyrosLog(LogType.Debug, "Handling send Input in Papyros");
        const {
            inputArea, lineNr, inputMetaData, inputTextArray, textEncoder
        } = this.inputState;
        const lines = inputArea.value.split("\n");
        if (lines.length > lineNr && lines[lineNr]) {
            papyrosLog(LogType.Debug, "Sending input to user: " + lines[lineNr]);
            const line = lines[lineNr];
            if (!inputMetaData || !inputTextArray) {
                await fetch(INPUT_RELATIVE_URL,
                    {
                        method: "POST",
                        body: JSON.stringify({ "input": line })
                    });
            } else {
                const encoded = textEncoder.encode(lines[lineNr]);
                inputTextArray.set(encoded);
                Atomics.store(inputMetaData, 1, encoded.length);
                Atomics.store(inputMetaData, 0, 1);
            }
            this.inputState.lineNr += 1;
            this.stateManager.setState(PapyrosState.Running);
            return true;
        } else {
            papyrosLog(LogType.Debug, "Had no input to send, still waiting!");
            return false;
        }
    }

    async onInput(e: PapyrosEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Received onInput event in Papyros: ", e);
        if (!await this.sendInput()) {
            this.stateManager.setState(PapyrosState.AwaitingInput);
            papyrosLog(LogType.Debug, "User needs to enter input before code can continue");
        } else {
            this.stateManager.setState(PapyrosState.Running);
        }
    }

    onMessage(e: PapyrosEvent): void {
        papyrosLog(LogType.Debug, "received event in onMessage", e);
        if (e.runId === this.codeState.runId) {
            if (e.type === "output") {
                this.codeState.outputArea.value += e.data;
            } else if (e.type === "input") {
                this.onInput(e);
            } else if (e.type === "error") {
                this.onError(e);
            }
        } else {
            papyrosLog(LogType.Debug, "Received event with outdated runId: ", e);
        }
    }

    async runCode(): Promise<void> {
        if (this.state !== PapyrosState.Ready) {
            papyrosLog(LogType.Error, `Run code called from invalid state: ${this.state}`);
            return;
        }
        this.codeState.runId += 1;
        this.stateManager.setState(PapyrosState.Running);
        this.codeState.outputArea.value = "";
        papyrosLog(LogType.Debug, "Running code in Papyros, sending to backend");
        const start = new Date().getTime();
        try {
            await this.codeState.backend.runCode(
                this.codeState.editor.getCode(), this.codeState.runId);
        } catch (error: any) {
            this.onError(error);
        } finally {
            const end = new Date().getTime();
            this.stateManager.setState(PapyrosState.Ready, t("Papyros.finished", { time: end - start }));
            this.inputState.lineNr = 0;
        }
    }

    async terminate(): Promise<void> {
        if (![PapyrosState.Running, PapyrosState.AwaitingInput].includes(this.state)) {
            papyrosLog(LogType.Error, `Terminate called from invalid state: ${this.state}`);
            papyrosLog(LogType.Debug, t("Papyros.invalid_terminate"));
            return;
        }
        papyrosLog(LogType.Debug, "Called terminate, stopping backend!");
        this.codeState.runId += 1; // ignore messages coming from last run
        this.stateManager.setState(PapyrosState.Terminating);
        stopBackend(this.codeState.backend);
        return this.startBackend();
    }
}
