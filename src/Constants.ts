import { ProgrammingLanguage } from "./ProgrammingLanguage";

/**
 * Add a prefix to a string, ensuring uniqueness in the page
 * @param {string} s The value to add a prefix to
 * @return {string} The value with an almost certainly unused prefix
 */
export function addPapyrosPrefix(s: string): string {
    return `__papyros-${s}`;
}
/* Default HTML ids for various elements */
export const MAIN_APP_ID = addPapyrosPrefix("root");
export const OUTPUT_AREA_WRAPPER_ID = addPapyrosPrefix("code-output-area-wrapper");
export const OUTPUT_AREA_ID = addPapyrosPrefix("code-output-area");
export const OUTPUT_OVERFLOW_ID = addPapyrosPrefix("output-overflow");
export const INPUT_AREA_WRAPPER_ID = addPapyrosPrefix("code-input-area-wrapper");
export const INPUT_TA_ID = addPapyrosPrefix("code-input-area");
export const USER_INPUT_WRAPPER_ID = addPapyrosPrefix("user-input-wrapper");
export const EDITOR_WRAPPER_ID = addPapyrosPrefix("code-area");
export const PANEL_WRAPPER_ID = addPapyrosPrefix("code-status-panel");
export const RUNNER_BUTTON_AREA_WRAPPER_ID = addPapyrosPrefix("runner-button-area-wrapper");
export const STATE_SPINNER_ID = addPapyrosPrefix("state-spinner");
export const APPLICATION_STATE_TEXT_ID = addPapyrosPrefix("application-state-text");
export const STOP_BTN_ID = addPapyrosPrefix("stop-btn");
export const SEND_INPUT_BTN_ID = addPapyrosPrefix("send-input-btn");
export const SWITCH_INPUT_MODE_A_ID = addPapyrosPrefix("switch-input-mode");
export const EXAMPLE_SELECT_ID = addPapyrosPrefix("example-select");
export const LOCALE_SELECT_ID = addPapyrosPrefix("locale-select");
export const PROGRAMMING_LANGUAGE_SELECT_ID = addPapyrosPrefix("programming-language-select");
export const DARK_MODE_TOGGLE_ID = addPapyrosPrefix("toggle-dark-mode");
/* Default values for various properties */
export const DEFAULT_PROGRAMMING_LANGUAGE = ProgrammingLanguage.Python;
export const DEFAULT_LOCALE = "nl";
export const DEFAULT_SERVICE_WORKER = "InputServiceWorker.js";
