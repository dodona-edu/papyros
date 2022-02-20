/* eslint-disable max-len */
import { t } from "i18n-js";
import { RUN_BTN_ID, APPLICATION_STATE_TEXT_ID, STATE_SPINNER_ID, STOP_BTN_ID } from "./Constants";
import { svgCircle } from "./util/HTMLShapes";
import { RenderOptions, renderWithOptions } from "./util/Util";

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

    render(options: RenderOptions): HTMLElement {
        return renderWithOptions(options,
            `<div class="grid grid-cols-2 items-center">
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
                ${svgCircle(STATE_SPINNER_ID, "red")}
            </div>
        </div>
        `);
    }
}
