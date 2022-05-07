import { ProgrammingLanguage } from "./ProgrammingLanguage";
/**
 * Add a prefix to a string, ensuring uniqueness in the page
 * @param {string} s The value to add a prefix to
 * @return {string} The value with an almost certainly unused prefix
 */
export declare function addPapyrosPrefix(s: string): string;
export declare const MAIN_APP_ID: string;
export declare const OUTPUT_AREA_WRAPPER_ID: string;
export declare const OUTPUT_AREA_ID: string;
export declare const OUTPUT_OVERFLOW_ID: string;
export declare const INPUT_AREA_WRAPPER_ID: string;
export declare const INPUT_TA_ID: string;
export declare const USER_INPUT_WRAPPER_ID: string;
export declare const EDITOR_WRAPPER_ID: string;
export declare const PANEL_WRAPPER_ID: string;
export declare const RUNNER_BUTTON_AREA_WRAPPER_ID: string;
export declare const STATE_SPINNER_ID: string;
export declare const APPLICATION_STATE_TEXT_ID: string;
export declare const STOP_BTN_ID: string;
export declare const SEND_INPUT_BTN_ID: string;
export declare const SWITCH_INPUT_MODE_A_ID: string;
export declare const EXAMPLE_SELECT_ID: string;
export declare const LOCALE_SELECT_ID: string;
export declare const PROGRAMMING_LANGUAGE_SELECT_ID: string;
export declare const DARK_MODE_TOGGLE_ID: string;
export declare const DEFAULT_PROGRAMMING_LANGUAGE = ProgrammingLanguage.Python;
export declare const DEFAULT_LOCALE = "nl";
export declare const DEFAULT_SERVICE_WORKER = "InputServiceWorker.js";
