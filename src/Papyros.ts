/* eslint-disable max-len */
import "./Papyros.css";
import { proxy, Remote } from "comlink";
import I18n from "i18n-js";
import { Backend } from "./Backend";
import { getBackend, stopBackend } from "./BackendManager";
import { CodeEditor } from "./CodeEditor";
import {
    EDITOR_WRAPPER_ID, PROGRAMMING_LANGUAGE_SELECT_ID, OUTPUT_TA_ID,
    RUN_BTN_ID, STOP_BTN_ID, LOCALE_SELECT_ID, INPUT_AREA_WRAPPER_ID, EXAMPLE_SELECT_ID
} from "./Constants";
import { InputManager, InputMode } from "./InputManager";
import { PapyrosEvent } from "./PapyrosEvent";
import { ProgrammingLanguage, PROGRAMMING_LANGUAGES } from "./ProgrammingLanguage";
import { LogType, papyrosLog } from "./util/Logging";
import { addListener, getLocales, getSelectOptions, t, loadTranslations, renderSelect, removeSelection } from "./util/Util";
import { StatusPanel } from "./StatusPanel";
import { getCodeForExample, getExampleNames } from "./examples/Examples";
import { OutputManager } from "./OutputManager";

function renderPapyros(parent: HTMLElement, standAlone: boolean,
    programmingLanguage: ProgrammingLanguage, locale: string): void {
    const programmingLanguageSelect = standAlone ?
        renderSelect(PROGRAMMING_LANGUAGE_SELECT_ID, PROGRAMMING_LANGUAGES,
            l => t(`Papyros.programming_languages.${l}`), programmingLanguage, t("Papyros.programming_language")) :
        "";
    const exampleSelect = standAlone ?
        renderSelect(EXAMPLE_SELECT_ID, getExampleNames(programmingLanguage),
            name => name, undefined, t("Papyros.examples")) : "";
    const locales = [locale, ...getLocales().filter(l => l != locale)];
    const localeSelect = standAlone ?
        `
        <div class="flex flex-row-reverse">
            <!-- row-reverse to start at the right, so put elements in order of display -->
            ${renderSelect(LOCALE_SELECT_ID, locales, l => t(`Papyros.locales.${l}`), locale)}
            <i class="mdi mdi-web text-4xl text-white"></i>
        </div>
        ` : "";

    const navBar = standAlone ?
        `
        <div class="bg-blue-500 text-white text-lg p-4 grid grid-cols-8 items-center max-h-1/5">
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
        ${exampleSelect}
      </div>

      <!--Body of the application-->
      <div class="grid grid-cols-2 gap-4 box-border max-h-full">
        <!--Left code section-->
        <div class="col-span-1">
          <h1>${t("Papyros.code")}:</h1>
          <div id="${EDITOR_WRAPPER_ID}" class="overflow-auto max-h-9/10 min-h-1/4 border-solid border-gray-200 border-2"></div>
        </div>
        <!--Right user input and output section-->
        <div class="col-span-1">
          <h1>${t("Papyros.output")}:</h1>
          <div id="${OUTPUT_TA_ID}" title="${t("Papyros.output_placeholder")}"
           class="border-2 w-full min-h-1/4 max-h-3/5 overflow-auto px-1 whitespace-pre"></div>
          <h1>${t("Papyros.input")}:</h1>
          <div id="${INPUT_AREA_WRAPPER_ID}">
          </div>
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
    Stopping = "stopping",
    Ready = "ready"
}

class PapyrosStateManager {
    state: PapyrosState;
    statusPanel: StatusPanel;
    runButton: HTMLButtonElement;
    stopButton: HTMLButtonElement;

    constructor(statusPanel: StatusPanel) {
        this.statusPanel = statusPanel;
        this.runButton = document.getElementById(RUN_BTN_ID) as HTMLButtonElement;
        this.stopButton = document.getElementById(STOP_BTN_ID) as HTMLButtonElement;
        this.state = PapyrosState.Ready;
    }

    setState(state: PapyrosState, message?: string): void {
        if (state !== this.state) {
            this.state = state;
            this.stopButton.disabled = [PapyrosState.Ready, PapyrosState.Loading].includes(state);
            if (state === PapyrosState.Ready) {
                this.statusPanel.showSpinner(false);
                this.runButton.disabled = false;
            } else {
                this.statusPanel.showSpinner(true);
                this.runButton.disabled = true;
            }
            this.statusPanel.setStatus(message || t(`Papyros.states.${state}`));
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

interface PapyrosConfig {
    standAlone: boolean;
    programmingLanguage: ProgrammingLanguage;
    locale: string;
    inputMode: InputMode
}

export class Papyros {
    stateManager: PapyrosStateManager;
    codeState: PapyrosCodeState;
    inputManager: InputManager;
    outputManager: OutputManager;

    constructor(programmingLanguage: ProgrammingLanguage, inputMode: InputMode) {
        this.outputManager = new OutputManager(OUTPUT_TA_ID);
        const statusPanel = new StatusPanel();
        this.codeState = {
            programmingLanguage: programmingLanguage,
            editor: new CodeEditor(
                document.getElementById(EDITOR_WRAPPER_ID) as HTMLInputElement,
                programmingLanguage, statusPanel.render(document.createElement("div")),
                t("Papyros.code_placeholder", { programmingLanguage })),
            backend: {} as Remote<Backend>,
            outputArea: document.getElementById(OUTPUT_TA_ID) as HTMLInputElement,
            runId: 0
        };
        this.stateManager = new PapyrosStateManager(statusPanel);
        this.inputManager = new InputManager(() => this.stateManager.setState(PapyrosState.Running), inputMode);
    }

    get state(): PapyrosState {
        return this.stateManager.state;
    }

    async launch(): Promise<Papyros> {
        this.stateManager.runButton.addEventListener("click", () => this.runCode());
        this.stateManager.stopButton.addEventListener("click", () => this.stop());
        const start = new Date().getTime();
        await this.startBackend();
        papyrosLog(LogType.Important, `Finished loading backend after ${new Date().getTime() - start} ms`);
        this.codeState.editor.focus();
        return this;
    }

    async setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void> {
        if (this.codeState.programmingLanguage !== programmingLanguage) {
            stopBackend(this.codeState.backend);
            this.codeState.programmingLanguage = programmingLanguage;
            this.codeState.editor.setLanguage(programmingLanguage, t("Papyros.code_placeholder", { programmingLanguage }));
            this.codeState.outputArea.value = "";
            await this.startBackend();
        }
    }

    setCode(code: string): void {
        this.codeState.editor.setCode(code);
    }

    async startBackend(): Promise<void> {
        this.stateManager.setState(PapyrosState.Loading);
        const backend = getBackend(this.codeState.programmingLanguage);
        await backend.launch(proxy(e => this.onMessage(e)), this.inputManager.inputTextArray, this.inputManager.inputMetaData);
        this.codeState.backend = backend;
        this.stateManager.setState(PapyrosState.Ready);
    }

    static fromElement(parent: HTMLElement, config: PapyrosConfig): Promise<Papyros> {
        loadTranslations();
        I18n.locale = config.locale;
        renderPapyros(parent, config.standAlone, config.programmingLanguage, config.locale);
        const papyros = new Papyros(config.programmingLanguage, config.inputMode);
        if (config.standAlone) {
            addListener<ProgrammingLanguage>(
                PROGRAMMING_LANGUAGE_SELECT_ID, pl => {
                    papyros.setProgrammingLanguage(pl);
                    document.getElementById(EXAMPLE_SELECT_ID)!.innerHTML = getSelectOptions(getExampleNames(pl), name => name);
                    removeSelection(EXAMPLE_SELECT_ID);
                    // Modify search query params without reloading page
                    history.pushState(null, "", `?locale=${I18n.locale}&language=${pl}`);
                }
            );
            addListener(LOCALE_SELECT_ID, locale => {
                document.location.href = `?locale=${locale}&language=${papyros.codeState.programmingLanguage}`;
            });
            addListener(EXAMPLE_SELECT_ID, name => {
                const code = getCodeForExample(papyros.codeState.programmingLanguage, name);
                papyros.setCode(code);
            }, "input");
            removeSelection(EXAMPLE_SELECT_ID);
        }
        return papyros.launch();
    }

    onError(e: PapyrosEvent): void {
        papyrosLog(LogType.Debug, "Got error in Papyros: ", e);
        this.outputManager.showError(e.data);
    }

    async onInput(e: PapyrosEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Received onInput event in Papyros: ", e);
        this.stateManager.setState(PapyrosState.AwaitingInput);
        await this.inputManager.onInput(e);
    }

    onMessage(e: PapyrosEvent): void {
        papyrosLog(LogType.Debug, "received event in onMessage", e);
        if (e.runId === this.codeState.runId) {
            if (e.type === "output") {
                this.outputManager.showOutput(e);
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
        this.inputManager.onRunStart();
        this.outputManager.onRunStart();
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
            this.stateManager.setState(PapyrosState.Ready, t("Papyros.finished", { time: (end - start) / 1000 }));
            this.inputManager.onRunEnd();
            this.outputManager.onRunEnd();
        }
    }

    async stop(): Promise<void> {
        if (![PapyrosState.Running, PapyrosState.AwaitingInput].includes(this.state)) {
            papyrosLog(LogType.Error, `Stop called from invalid state: ${this.state}`);
            return;
        }
        papyrosLog(LogType.Debug, "Stopping backend!");
        this.codeState.runId += 1; // ignore messages coming from last run
        this.stateManager.setState(PapyrosState.Stopping);
        stopBackend(this.codeState.backend);
        return this.startBackend();
    }
}
