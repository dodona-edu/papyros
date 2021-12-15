/* eslint-disable max-len */
import { t } from "i18n-js";
import { RUN_BTN_ID, APPLICATION_STATE_TEXT_ID, STATE_SPINNER_ID, STOP_BTN_ID } from "./Constants";

export class StatusPanel {
    get statusSpinner(): HTMLElement {
        return document.getElementById(STATE_SPINNER_ID) as HTMLElement;
    }

    get statusText(): HTMLElement {
        return document.getElementById(APPLICATION_STATE_TEXT_ID) as HTMLElement;
    }

    showSpinner(show: boolean): void {
        this.statusSpinner.style.display = show ? "" : "none";
    }

    setStatus(status: string): void {
        this.statusText.innerText = status;
    }

    render(parent: HTMLElement): HTMLElement {
        parent.innerHTML = `
        <div class="grid grid-cols-2 items-center">
            <div class="col-span-1 flex flex-row">
                <button id="${RUN_BTN_ID}" type="button" 
                class="text-white bg-blue-500 border-2 m-1 px-4 inset-y-2 rounded-lg
                disabled:opacity-50 disabled:cursor-wait">
                ${t("Papyros.run")}
                </button>
                <button id="${STOP_BTN_ID}" type="button" 
                class="text-white bg-red-500 border-2 m-1 px-4 inset-y-2 rounded-lg
                disabled:opacity-50 disabled:cursor-wait">
                ${t("Papyros.stop")}
                </button>
            </div>
            <div class="col-span-1 flex flex-row-reverse">
                <p id="${APPLICATION_STATE_TEXT_ID}">
                </p>
                <svg id="${STATE_SPINNER_ID}" class="animate-spin mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" display="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="red" stroke-width="4"></circle>
                <path class="opacity-75" fill="red"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                 </path>
               </svg>
            </div>
        </div>
        `;
        return parent;
    }
}
