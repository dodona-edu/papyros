/* eslint-disable max-len */
import "./Papyros.css";
import { proxy, Remote } from "comlink";
import I18n from "i18n-js";
import { Backend } from "./Backend";
import { getBackend, stopBackend } from "./BackendManager";
import { CodeEditor } from "./CodeEditor";
import {
    EDITOR_WRAPPER_ID, PROGRAMMING_LANGUAGE_SELECT_ID, OUTPUT_TA_ID,
    RUN_BTN_ID, STOP_BTN_ID, LOCALE_SELECT_ID, INPUT_AREA_WRAPPER_ID, EXAMPLE_SELECT_ID, PANEL_WRAPPER_ID
} from "./Constants";
import { InputManager, InputMode } from "./InputManager";
import { PapyrosEvent } from "./PapyrosEvent";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { LogType, papyrosLog } from "./util/Logging";
import { addListener, getLocales, getSelectOptions, t, loadTranslations, renderSelect, removeSelection, RenderOptions, renderWithOptions } from "./util/Util";
import { StatusPanel } from "./StatusPanel";
import { getCodeForExample, getExampleNames } from "./examples/Examples";
import { OutputManager } from "./OutputManager";
import { makeChannel } from "sync-message";

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

    get runButton(): HTMLButtonElement {
        return document.getElementById(RUN_BTN_ID) as HTMLButtonElement;
    }

    get stopButton(): HTMLButtonElement {
        return document.getElementById(STOP_BTN_ID) as HTMLButtonElement;
    }

    constructor(statusPanel: StatusPanel) {
        this.statusPanel = statusPanel;
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

    render(options: RenderOptions): HTMLElement {
        return this.statusPanel.render(options);
    }
}

const LANGUAGE_MAP = new Map([
    ["python", ProgrammingLanguage.Python],
    ["javascript", ProgrammingLanguage.JavaScript]
]);

interface PapyrosCodeState {
    programmingLanguage: ProgrammingLanguage;
    editor: CodeEditor;
    backend: Remote<Backend>;
    runId: number;
}

interface PapyrosConfig {
    standAlone: boolean;
    programmingLanguage: ProgrammingLanguage;
    locale: string;
    inputMode: InputMode;
}

interface PapyrosRenderOptions {
    papyros: RenderOptions;
    code?: RenderOptions;
    panel?: RenderOptions;
    input?: RenderOptions;
    output?: RenderOptions
}

export class Papyros {
    stateManager: PapyrosStateManager;
    codeState: PapyrosCodeState;
    inputManager: InputManager;
    outputManager: OutputManager;
    inputURL: string;

    constructor(programmingLanguage: ProgrammingLanguage, inputMode: InputMode) {
        this.outputManager = new OutputManager();
        this.codeState = {
            programmingLanguage: programmingLanguage,
            editor: new CodeEditor(
                programmingLanguage,
                t("Papyros.code_placeholder", { programmingLanguage })),
            backend: {} as Remote<Backend>,
            runId: 0
        };
        const statusPanel = new StatusPanel();
        this.stateManager = new PapyrosStateManager(statusPanel);
        this.inputManager = new InputManager(() => this.stateManager.setState(PapyrosState.Running), inputMode);
        this.inputURL = location.host;
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
            this.outputManager.reset();
            await this.startBackend();
        }
    }

    setCode(code: string): void {
        this.codeState.editor.setCode(code);
    }

    getCode(): string {
        return this.codeState.editor.getCode();
    }

    async startBackend(): Promise<void> {
        this.stateManager.setState(PapyrosState.Loading);
        const backend = getBackend(this.codeState.programmingLanguage);
        await backend.launch(proxy(e => this.onMessage(e)), this.inputManager.channel);
        this.codeState.backend = backend;
        this.stateManager.setState(PapyrosState.Ready);
    }

    static fromElement(config: PapyrosConfig, renderOptions: PapyrosRenderOptions): Papyros {
        loadTranslations();
        I18n.locale = config.locale;
        const papyros = new Papyros(config.programmingLanguage, config.inputMode);
        papyros.render(config.standAlone, config.programmingLanguage, config.locale, renderOptions);

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
            // Ensure there is no initial selection
            removeSelection(EXAMPLE_SELECT_ID);
        }
        return papyros;
    }

    async configureInput(allowReload: boolean,
        serviceWorkerRoot?: string, serviceWorkerName?: string): Promise<boolean> {
        const RELOAD_STORAGE_KEY = "__papyros_reloading";
        if (allowReload && window.localStorage.getItem(RELOAD_STORAGE_KEY)) {
            // We are the result of the page reload, so we can start
            window.localStorage.removeItem(RELOAD_STORAGE_KEY);
            return true;
        } else {
            if (typeof SharedArrayBuffer === "undefined") {
                papyrosLog(LogType.Important, "SharedArrayBuffers are not available. ");
                if (!serviceWorkerRoot || !serviceWorkerName || !("serviceWorker" in navigator)) {
                    papyrosLog(LogType.Important, "Unable to register service worker. Please specify all required parameters and ensure service workers are supported.");
                    return false;
                }
                if ("serviceWorker" in window.navigator) {
                    papyrosLog(LogType.Important, "Registering service worker.");
                    // Store that we are reloading, to prevent the next load from doing all this again
                    await window.navigator.serviceWorker.register(new URL(serviceWorkerName, serviceWorkerRoot));
                    this.inputURL = serviceWorkerRoot;
                    this.inputManager.channel = makeChannel({ serviceWorker: { scope: serviceWorkerRoot + "/" } })!;
                    if (allowReload) {
                        window.localStorage.setItem(RELOAD_STORAGE_KEY, RELOAD_STORAGE_KEY);
                        // service worker adds new headers that may allow SharedArrayBuffers to be used
                        window.location.reload();
                    }
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        }
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

    render(standAlone: boolean, programmingLanguage: ProgrammingLanguage, locale: string,
        renderOptions: PapyrosRenderOptions): void {
        if (standAlone) {
            const programmingLanguageSelect =
                renderSelect(PROGRAMMING_LANGUAGE_SELECT_ID, new Array(...LANGUAGE_MAP.values()),
                    l => t(`Papyros.programming_languages.${l}`), programmingLanguage, t("Papyros.programming_language"));
            const exampleSelect =
                renderSelect(EXAMPLE_SELECT_ID, getExampleNames(programmingLanguage),
                    name => name, undefined, t("Papyros.examples"));
            const locales = [locale, ...getLocales().filter(l => l != locale)];
            const localeSelect =
                `<div class="flex flex-row-reverse">
                <!-- row-reverse to start at the right, so put elements in order of display -->
                ${renderSelect(LOCALE_SELECT_ID, locales, l => t(`Papyros.locales.${l}`), locale)}
                <i class="mdi mdi-web text-4xl text-white"></i>
            </div>
            `;
            const navBar = `<div class="bg-blue-500 text-white text-lg p-4 grid grid-cols-8 items-center max-h-1/5">
                <div class="col-span-6">
                    ${t("Papyros.Papyros")}
                </div>
                <div class="col-span-2 text-black">
                    ${localeSelect}
                </div>
            </div>
            `;
            const header = `<!-- Header -->
            <div class="flex flex-row items-center">
                ${programmingLanguageSelect}
                ${exampleSelect}
            </div>`;
            renderWithOptions(renderOptions.papyros,
                `<div id="papyros" class="max-h-screen h-full overflow-y-hidden">
        ${navBar}
        <div class="m-10">
            ${header}
            <!--Body of the application-->
            <div class="grid grid-cols-2 gap-4 box-border max-h-full">
                <!-- Code section-->
                <div>
                    <h1>${t("Papyros.code")}:</h1>
                    <div id="${EDITOR_WRAPPER_ID}"></div>
                    <div id="${PANEL_WRAPPER_ID}"></div>
                </div>
                <!-- User input and output section-->
                <div>
                    <h1>${t("Papyros.output")}:</h1>
                    <div id="${OUTPUT_TA_ID}"></div>
                    <h1>${t("Papyros.input")}:</h1>
                    <div id="${INPUT_AREA_WRAPPER_ID}"></div>
                </div>
            </div>
        </div>
    </div>
    `);
        }
        this.inputManager.render(
            Object.assign({ parentElementId: INPUT_AREA_WRAPPER_ID }, renderOptions.input)
        );
        const panel = this.stateManager.render(
            Object.assign({ parentElementId: PANEL_WRAPPER_ID }, renderOptions.panel)
        );
        this.codeState.editor.render(Object.assign({ parentElementId: EDITOR_WRAPPER_ID }, renderOptions.code), panel);
        this.outputManager.render(Object.assign({ parentElementId: OUTPUT_TA_ID }, renderOptions.output));
    }

    static supportsProgrammingLanguage(language: string): boolean {
        return Papyros.toProgrammingLanguage(language) !== undefined;
    }

    static toProgrammingLanguage(language: string): ProgrammingLanguage | undefined {
        const langLC = language.toLowerCase();
        if (LANGUAGE_MAP.has(langLC)) {
            return LANGUAGE_MAP.get(langLC)!;
        } else {
            return undefined;
        }
    }
}
