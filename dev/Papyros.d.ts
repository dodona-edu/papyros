import { InputManagerRenderOptions, InputMode } from "./InputManager";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { RunState, CodeRunner } from "./CodeRunner";
import { AtomicsChannelOptions, ServiceWorkerChannelOptions } from "sync-message";
import { RenderOptions, ButtonOptions, Renderable } from "./util/Rendering";
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
    inputOptions?: InputManagerRenderOptions;
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
export declare class Papyros extends Renderable<PapyrosRenderOptions> {
    /**
     * Config used to initialize Papyros
     */
    private config;
    /**
     * Component to run code entered by the user
     */
    readonly codeRunner: CodeRunner;
    /**
     * Construct a new Papyros instance
     * @param {PapyrosConfig} config Properties to configure this instance
     */
    constructor(config: PapyrosConfig);
    /**
     * @return {RunState} The current state of the user's code
     */
    getState(): RunState;
    /**
     * Launch this instance of Papyros, making it ready to run code
     * @return {Promise<Papyros>} Promise of launching, chainable
     */
    launch(): Promise<Papyros>;
    /**
     * Set the used programming language to the given one to allow editing and running code
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     */
    setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void>;
    /**
     * @param {string} locale The locale to use
     */
    setLocale(locale: string): void;
    /**
     * @param {boolean} darkMode Whether to use dark mode
     */
    setDarkMode(darkMode: boolean): void;
    /**
     * @param {string} code The code to use in the editor
     */
    setCode(code: string): void;
    /**
     * @return {string} The currently written code
     */
    getCode(): string;
    /**
     * Configure how user input is handled within Papyros
     * By default, we will try to use SharedArrayBuffers
     * If this option is not available, the optional arguments in the channelOptions config are used
     * They are needed to register a service worker to handle communication between threads
     * @return {Promise<boolean>} Promise of configuring input
     */
    private configureInput;
    protected _render(renderOptions: PapyrosRenderOptions): void;
    /**
     * Add a button to the status panel within Papyros
     * @param {ButtonOptions} options Options to render the button with
     * @param {function} onClick Listener for click events on the button
     */
    addButton(options: ButtonOptions, onClick: () => void): void;
    /**
     * @param {ProgrammingLanguage} language The language to check
     * @return {boolean} Whether Papyros supports this language by default
     */
    static supportsProgrammingLanguage(language: string): boolean;
    /**
     * Convert a string to a ProgrammingLanguage
     * @param {string} language The language to convert
     * @return {ProgrammingLanguage | undefined} The ProgrammingLanguage, or undefined if not supported
     */
    static toProgrammingLanguage(language: string): ProgrammingLanguage | undefined;
}