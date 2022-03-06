/* eslint-disable max-len */
import "./Papyros.css";
import { proxy, Remote } from "comlink";
import I18n from "i18n-js";
import { Backend } from "./Backend";
import { startBackend, stopBackend } from "./BackendManager";
import { CodeEditor } from "./CodeEditor";
import {
    EDITOR_WRAPPER_ID, PROGRAMMING_LANGUAGE_SELECT_ID, OUTPUT_TA_ID,
    LOCALE_SELECT_ID, INPUT_AREA_WRAPPER_ID, EXAMPLE_SELECT_ID, PANEL_WRAPPER_ID
} from "./Constants";
import { InputManager, InputMode } from "./InputManager";
import { PapyrosEvent } from "./PapyrosEvent";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { LogType, papyrosLog } from "./util/Logging";
import {
    t, loadTranslations, getLocales,
    getSelectOptions, renderSelect, removeSelection,
    RenderOptions, renderWithOptions,
    addListener, ButtonOptions, getElement
} from "./util/Util";
import { RunState, RunStateManager } from "./RunStateManager";
import { getCodeForExample, getExampleNames } from "./examples/Examples";
import { OutputManager } from "./OutputManager";
import { makeChannel } from "sync-message";
import { RunListener } from "./RunListener";

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
    papyros?: RenderOptions;
    code?: RenderOptions;
    panel?: RenderOptions;
    input?: RenderOptions;
    output?: RenderOptions
}

export class Papyros {
    config: PapyrosConfig;
    stateManager: RunStateManager;
    codeState: PapyrosCodeState;
    inputManager: InputManager;
    outputManager: OutputManager;
    runListeners: Array<RunListener>;

    constructor(config: PapyrosConfig) {
        this.config = config;
        const {
            programmingLanguage, inputMode, locale
        } = this.config;
        loadTranslations();
        I18n.locale = locale;
        this.outputManager = new OutputManager();
        this.codeState = {
            programmingLanguage: programmingLanguage,
            editor: new CodeEditor(
                programmingLanguage,
                t("Papyros.code_placeholder", { programmingLanguage })),
            backend: {} as Remote<Backend>,
            runId: 0
        };
        this.stateManager = new RunStateManager(() => this.runCode(), () => this.stop());
        this.inputManager = new InputManager(() => this.stateManager.setState(RunState.Running), inputMode);
        this.runListeners = [];
        this.addRunListener(this.inputManager);
        this.addRunListener(this.outputManager);
    }

    addRunListener(listener: RunListener): void {
        this.runListeners.push(listener);
    }

    notifyListeners(start: boolean): void {
        if (start) {
            this.runListeners.forEach(l => l.onRunStart());
        } else {
            this.runListeners.forEach(l => l.onRunEnd());
        }
    }

    get state(): RunState {
        return this.stateManager.state;
    }

    async launch(): Promise<Papyros> {
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
        this.stateManager.setState(RunState.Loading);
        const backend = startBackend(this.codeState.programmingLanguage);
        await backend.launch(proxy(e => this.onMessage(e)), this.inputManager.channel);
        this.codeState.backend = backend;
        this.stateManager.setState(RunState.Ready);
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
                const rootWithSlash = serviceWorkerRoot.endsWith("/") ? serviceWorkerRoot : serviceWorkerRoot + "/";
                const serviceWorkerUrl = rootWithSlash + serviceWorkerName;
                papyrosLog(LogType.Important, `Registering service worker: ${serviceWorkerUrl}`);
                await window.navigator.serviceWorker.register(serviceWorkerUrl);
                this.inputManager.channel = makeChannel({ serviceWorker: { scope: rootWithSlash } })!;
                if (allowReload) { // Store that we are reloading, to prevent the next load from doing all this again
                    window.localStorage.setItem(RELOAD_STORAGE_KEY, RELOAD_STORAGE_KEY);
                    // service worker adds new headers that may allow SharedArrayBuffers to be used
                    window.location.reload();
                }
                return true;
            } else {
                return true;
            }
        }
    }

    onError(e: PapyrosEvent): void {
        papyrosLog(LogType.Debug, "Got error in Papyros: ", e);
        this.outputManager.showError(e);
    }

    async onInput(e: PapyrosEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Received onInput event in Papyros: ", e);
        this.stateManager.setState(RunState.AwaitingInput);
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
        if (this.state !== RunState.Ready) {
            papyrosLog(LogType.Error, `Run code called from invalid state: ${this.state}`);
            return;
        }
        this.codeState.runId += 1;
        this.stateManager.setState(RunState.Running);
        this.notifyListeners(true);
        papyrosLog(LogType.Debug, "Running code in Papyros, sending to backend");
        const start = new Date().getTime();
        try {
            await this.codeState.backend.runCode(this.getCode(), this.codeState.runId);
        } catch (error: any) {
            this.onError(error);
        } finally {
            const end = new Date().getTime();
            this.stateManager.setState(RunState.Ready, t("Papyros.finished", { time: (end - start) / 1000 }));
            this.notifyListeners(false);
        }
    }

    async stop(): Promise<void> {
        if (![RunState.Running, RunState.AwaitingInput].includes(this.state)) {
            papyrosLog(LogType.Error, `Stop called from invalid state: ${this.state}`);
            return;
        }
        papyrosLog(LogType.Debug, "Stopping backend!");
        this.codeState.runId += 1; // ignore messages coming from last run
        this.stateManager.setState(RunState.Stopping);
        this.notifyListeners(false);
        stopBackend(this.codeState.backend);
        return this.startBackend();
    }

    render(renderOptions: PapyrosRenderOptions): void {
        const {
            locale, programmingLanguage, standAlone
        } = this.config;
        if (standAlone) {
            const programmingLanguageSelect =
                renderSelect(PROGRAMMING_LANGUAGE_SELECT_ID, new Array(...LANGUAGE_MAP.values()),
                    l => t(`Papyros.programming_languages.${l}`), programmingLanguage, t("Papyros.programming_language"));
            const exampleSelect =
                renderSelect(EXAMPLE_SELECT_ID, getExampleNames(programmingLanguage),
                    name => name, undefined, t("Papyros.examples"));
            const locales = [locale, ...getLocales().filter(l => l != locale)];
            const localeSelect = `
            <div class="flex flex-row-reverse">
                <!-- row-reverse to start at the right, so put elements in order of display -->
                ${renderSelect(LOCALE_SELECT_ID, locales, l => t(`Papyros.locales.${l}`), locale)}
                <i class="mdi mdi-web text-4xl text-white"></i>
            </div>
            `;
            const navBar = `
            <div class="bg-blue-500 text-white text-lg p-4 grid grid-cols-8 items-center max-h-1/5">
                <div class="col-span-6">
                    ${t("Papyros.Papyros")}
                </div>
                <div class="col-span-2 text-black">
                    ${localeSelect}
                </div>
            </div>
            `;
            const header = `
            <!-- Header -->
            <div class="flex flex-row items-center">
                ${programmingLanguageSelect}
                ${exampleSelect}
            </div>`;
            renderWithOptions(renderOptions.papyros!, `
    <div id="papyros" class="max-h-screen h-full overflow-y-hidden">
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
            addListener<ProgrammingLanguage>(
                PROGRAMMING_LANGUAGE_SELECT_ID, pl => {
                    this.setProgrammingLanguage(pl);
                    getElement<HTMLSelectElement>(EXAMPLE_SELECT_ID).innerHTML =
                        getSelectOptions(getExampleNames(pl), name => name);
                    removeSelection(EXAMPLE_SELECT_ID);
                    // Modify search query params without reloading page
                    history.pushState(null, "", `?locale=${I18n.locale}&language=${pl}`);
                }
            );
            addListener(LOCALE_SELECT_ID, locale => {
                document.location.href = `?locale=${locale}&language=${this.codeState.programmingLanguage}`;
            });
            addListener(EXAMPLE_SELECT_ID, name => {
                const code = getCodeForExample(this.codeState.programmingLanguage, name);
                this.setCode(code);
            }, "input");
            // Ensure there is no initial selection
            removeSelection(EXAMPLE_SELECT_ID);
        }
        this.inputManager.render(
            Object.assign({ parentElementId: INPUT_AREA_WRAPPER_ID }, renderOptions.input)
        );
        const runStatePanel = this.stateManager.render(
            Object.assign({ parentElementId: PANEL_WRAPPER_ID }, renderOptions.panel)
        );
        this.codeState.editor.render(
            Object.assign({ parentElementId: EDITOR_WRAPPER_ID }, renderOptions.code),
            runStatePanel
        );
        this.outputManager.render(
            Object.assign({ parentElementId: OUTPUT_TA_ID }, renderOptions.output)
        );
    }

    addButton(options: ButtonOptions, onClick: () => void): void {
        this.stateManager.addButton(options, onClick);
    }

    static supportsProgrammingLanguage(language: string): boolean {
        return Papyros.toProgrammingLanguage(language) !== undefined;
    }

    static toProgrammingLanguage(language: string): ProgrammingLanguage | undefined {
        return LANGUAGE_MAP.get(language.toLowerCase());
    }
}
