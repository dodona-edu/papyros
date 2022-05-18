/* eslint-disable max-len */
import "./Papyros.css";
import I18n from "i18n-js";
import {
    EDITOR_WRAPPER_ID, PROGRAMMING_LANGUAGE_SELECT_ID,
    LOCALE_SELECT_ID, INPUT_AREA_WRAPPER_ID, EXAMPLE_SELECT_ID,
    PANEL_WRAPPER_ID, DARK_MODE_TOGGLE_ID,
    MAIN_APP_ID, OUTPUT_AREA_WRAPPER_ID
} from "./Constants";
import { InputMode } from "./InputManager";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import {
    t, loadTranslations, getLocales,
    removeSelection,
    addListener, getElement, cleanCurrentUrl
} from "./util/Util";
import { RunState, CodeRunner } from "./CodeRunner";
import { getCodeForExample, getExampleNames } from "./examples/Examples";
import { AtomicsChannelOptions, makeChannel, ServiceWorkerChannelOptions } from "sync-message";
import { BackendManager } from "./BackendManager";
import {
    RenderOptions, renderWithOptions, renderSelect, renderSelectOptions,
    ButtonOptions, Renderable, renderLabel
} from "./util/Rendering";

const LANGUAGE_MAP = new Map([
    ["python", ProgrammingLanguage.Python],
    ["javascript", ProgrammingLanguage.JavaScript]
]);

/**
 * Configuration options for this instance of Papyros
 */
export interface PapyrosConfig {
    /**
     * Whether Papyros is run in standAlone mode or embedded in an application
     */
    standAlone: boolean;
    /**
     * The programming language to use
     */
    programmingLanguage: ProgrammingLanguage;
    /**
     * The language to use
     */
    locale: string;
    /**
     * The InputMode to use
     */
    inputMode: InputMode;
    /**
     * The selected code example
     */
    example?: string;
    /**
     * Configuration for the input channel
     */
    channelOptions?: {
        // The name of the service worker relative to the current root
        serviceWorkerName?: string;
    } & AtomicsChannelOptions & ServiceWorkerChannelOptions;
}

/**
 * Options for rendering Papyros
 */
export interface PapyrosRenderOptions {
    /**
     * Options to render Papyros itself, only used in standAlone mode
     */
    standAloneOptions?: RenderOptions;
    /**
     * RenderOptions for the code editor
     */
    codeEditorOptions?: RenderOptions;
    /**
     * RenderOptions for the status panel in the editor
     */
    statusPanelOptions?: RenderOptions;
    /**
     * RenderOptions for the input field
     */
    inputOptions?: RenderOptions;
    /**
     * RenderOptions for the output field
     */
    outputOptions?: RenderOptions;
    /**
     * Whether to render in dark mode
     */
    darkMode?: boolean;
}

/**
 * Class that manages multiple components to form a coding scratchpad
 */
export class Papyros extends Renderable<PapyrosRenderOptions> {
    /**
     * Config used to initialize Papyros
     */
    private config: PapyrosConfig;
    /**
     * Component to run code entered by the user
     */
    public readonly codeRunner: CodeRunner;

    /**
     * Construct a new Papyros instance
     * @param {PapyrosConfig} config Properties to configure this instance
     */
    constructor(config: PapyrosConfig) {
        super();
        this.config = config;
        // Load translations as other components depend on them
        loadTranslations();
        I18n.locale = config.locale;
        this.codeRunner = new CodeRunner(config.programmingLanguage);
    }

    /**
     * @return {RunState} The current state of the user's code
     */
    public getState(): RunState {
        return this.codeRunner.getState();
    }

    /**
     * Launch this instance of Papyros, making it ready to run code
     * @return {Promise<Papyros>} Promise of launching, chainable
     */
    public async launch(): Promise<Papyros> {
        if (!await this.configureInput()) {
            alert(t("Papyros.service_worker_error"));
        } else {
            try {
                await this.codeRunner.start();
            } catch (error: any) {
                if (confirm(t("Papyros.launch_error"))) {
                    return this.launch();
                }
            }
        }
        return this;
    }

    /**
     * Set the used programming language to the given one to allow editing and running code
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     */
    public async setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void> {
        this.config.programmingLanguage = programmingLanguage;
        await this.codeRunner.setProgrammingLanguage(programmingLanguage);
    }

    /**
     * @param {string} locale The locale to use
     */
    public setLocale(locale: string): void {
        if (locale !== this.config.locale) {
            this.config.locale = locale;
            I18n.locale = locale;
            this.render();
        }
    }

    /**
     * @param {boolean} darkMode Whether to use dark mode
     */
    public setDarkMode(darkMode: boolean): void {
        if (darkMode !== this.renderOptions.darkMode) {
            this.renderOptions.darkMode = darkMode;
            this.render();
        }
    }

    /**
     * @param {string} code The code to use in the editor
     */
    public setCode(code: string): void {
        this.codeRunner.editor.setCode(code);
    }

    /**
     * @return {string} The currently written code
     */
    public getCode(): string {
        return this.codeRunner.editor.getCode();
    }

    /**
     * Configure how user input is handled within Papyros
     * By default, we will try to use SharedArrayBuffers
     * If this option is not available, the optional arguments in the channelOptions config are used
     * They are needed to register a service worker to handle communication between threads
     * @return {Promise<boolean>} Promise of configuring input
     */
    private async configureInput(): Promise<boolean> {
        if (typeof SharedArrayBuffer === "undefined") {
            if (!this.config.channelOptions?.serviceWorkerName || !("serviceWorker" in navigator)) {
                return false;
            }
            const serviceWorkerRoot = cleanCurrentUrl(true);
            const { serviceWorkerName } = this.config.channelOptions;
            this.config.channelOptions.scope = serviceWorkerRoot;
            const serviceWorkerUrl = serviceWorkerRoot + serviceWorkerName;
            try {
                await window.navigator.serviceWorker.register(serviceWorkerUrl);
                BackendManager.channel = makeChannel({ serviceWorker: this.config.channelOptions })!;
            } catch (error: any) {
                return false;
            }
        } else {
            BackendManager.channel = makeChannel({
                atomics: { ...this.config.channelOptions }
            })!;
        }
        return true;
    }

    protected override _render(renderOptions: PapyrosRenderOptions): void {
        // Set default values for each option
        for (const [option, defaultParentId] of [
            ["inputOptions", INPUT_AREA_WRAPPER_ID], ["statusPanelOptions", PANEL_WRAPPER_ID],
            ["codeEditorOptions", EDITOR_WRAPPER_ID], ["outputOptions", OUTPUT_AREA_WRAPPER_ID],
            ["standAloneOptions", MAIN_APP_ID]
        ]) {
            const elementOptions: RenderOptions = (renderOptions as any)[option] || {};
            elementOptions.darkMode = renderOptions.darkMode;
            (renderOptions as any)[option] = Object.assign(
                { parentElementId: defaultParentId }, elementOptions);
        }

        if (this.config.standAlone) {
            const {
                locale, programmingLanguage
            } = this.config;
            const programmingLanguageSelect =
                renderSelect(PROGRAMMING_LANGUAGE_SELECT_ID, new Array(...LANGUAGE_MAP.values()),
                    l => t(`Papyros.programming_languages.${l}`), programmingLanguage, t("Papyros.programming_language"));
            const exampleSelect =
                renderSelect(EXAMPLE_SELECT_ID, getExampleNames(programmingLanguage),
                    name => name, this.config.example, t("Papyros.examples"));
            const locales = [locale, ...getLocales().filter(l => l != locale)];
            const toggleIconClasses = renderOptions.darkMode ? "mdi-toggle-switch _tw-text-[#FF8F00]" : "mdi-toggle-switch-off _tw-text-white";
            const navOptions = `
            <div class="_tw-flex _tw-flex-row-reverse dark:_tw-text-white _tw-items-center">
                <!-- row-reverse to start at the right, so put elements in order of display -->
                <i id=${DARK_MODE_TOGGLE_ID} class="mdi ${toggleIconClasses} hover:_tw-cursor-pointer _tw-text-4xl"></i>
                <p class="_tw-text-white">${t("Papyros.dark_mode")}</p>
                ${renderSelect(LOCALE_SELECT_ID, locales, l => t(`Papyros.locales.${l}`), locale)}
                <i class="mdi mdi-web _tw-text-4xl _tw-text-white"></i>
            </div>
            `;
            const navBar = `
            <div class="_tw-bg-blue-500 _tw-text-white _tw-text-lg _tw-p-4 _tw-grid _tw-grid-cols-8
            _tw-items-center _tw-max-h-1/5 dark:_tw-bg-dark-mode-blue">
                <div class="_tw-col-span-6 _tw-text-4xl _tw-font-medium">
                    ${t("Papyros.Papyros")}
                </div>
                <div class="_tw-col-span-2 _tw-text-black">
                    ${navOptions}
                </div>
            </div>
            `;
            const header = `
            <!-- Header -->
            <div class="_tw-flex _tw-flex-row _tw-items-center">
                ${programmingLanguageSelect}
                ${exampleSelect}
            </div>`;
            renderWithOptions(renderOptions.standAloneOptions!, `
    <div id="${MAIN_APP_ID}" class="_tw-min-h-screen _tw-max-h-screen _tw-h-full
    _tw-overflow-y-hidden dark:_tw-text-white dark:_tw-bg-dark-mode-bg">
        ${navBar}
        <div class="_tw-m-10">
            ${header}
            <!--Body of the application-->
            <div class="_tw-grid _tw-grid-cols-2 _tw-gap-4 _tw-box-border _tw-max-h-full">
                <!-- Code section-->
                <div>
                    ${renderLabel(t("Papyros.code"), renderOptions.codeEditorOptions!.parentElementId)}
                    <div id="${renderOptions.codeEditorOptions!.parentElementId}"></div>
                    <div id="${renderOptions.statusPanelOptions!.parentElementId}"></div>
                </div>
                <!-- User input and output section-->
                <div>
                    ${renderLabel(t("Papyros.output"), renderOptions.outputOptions!.parentElementId)}
                    <div id="${renderOptions.outputOptions!.parentElementId}"></div>
                    ${renderLabel(t("Papyros.input"), renderOptions.inputOptions!.parentElementId)}
                    <div id="${renderOptions.inputOptions!.parentElementId}"></div>
                </div>
            </div>
        </div>
    </div>
    `);
            addListener<ProgrammingLanguage>(
                PROGRAMMING_LANGUAGE_SELECT_ID, pl => {
                    this.setProgrammingLanguage(pl);
                    getElement<HTMLSelectElement>(EXAMPLE_SELECT_ID).innerHTML =
                        renderSelectOptions(getExampleNames(pl), name => name);
                    removeSelection(EXAMPLE_SELECT_ID);
                    this.config.example = undefined;
                    // Modify search query params without reloading page
                    history.pushState(null, "", `?locale=${I18n.locale}&language=${pl}`);
                }, "change", "value"
            );
            addListener(LOCALE_SELECT_ID, locale => {
                // Modify search query params without reloading page
                history.pushState(null, "", `?locale=${locale}&language=${this.codeRunner.getProgrammingLanguage()}`);
                this.setLocale(locale);
            }, "change", "value");
            addListener(EXAMPLE_SELECT_ID, name => {
                this.config.example = name;
                const code = getCodeForExample(this.codeRunner.getProgrammingLanguage(), name);
                this.setCode(code);
            }, "change", "value");
            // If example is null, it removes the selection
            getElement<HTMLSelectElement>(EXAMPLE_SELECT_ID).value = this.config.example!;

            addListener(DARK_MODE_TOGGLE_ID, () => {
                this.setDarkMode(!renderOptions.darkMode);
            }, "click");
        }
        this.codeRunner.render({
            statusPanelOptions: renderOptions.statusPanelOptions!,
            inputOptions: renderOptions.inputOptions!,
            codeEditorOptions: renderOptions.codeEditorOptions!,
            outputOptions: renderOptions.outputOptions!
        });
    }

    /**
     * Add a button to the status panel within Papyros
     * @param {ButtonOptions} options Options to render the button with
     * @param {function} onClick Listener for click events on the button
     */
    public addButton(options: ButtonOptions, onClick: () => void): void {
        this.codeRunner.addButton(options, onClick);
    }

    /**
     * @param {ProgrammingLanguage} language The language to check
     * @return {boolean} Whether Papyros supports this language by default
     */
    public static supportsProgrammingLanguage(language: string): boolean {
        return Papyros.toProgrammingLanguage(language) !== undefined;
    }

    /**
     * Convert a string to a ProgrammingLanguage
     * @param {string} language The language to convert
     * @return {ProgrammingLanguage | undefined} The ProgrammingLanguage, or undefined if not supported
     */
    public static toProgrammingLanguage(language: string): ProgrammingLanguage | undefined {
        return LANGUAGE_MAP.get(language.toLowerCase());
    }
}
