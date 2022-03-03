import { APPLICATION_STATE_TEXT_ID, STATE_SPINNER_ID } from "./Constants";
import { svgCircle } from "./util/HTMLShapes";
import {
    addListener, ButtonOptions, renderButton,
    RenderOptions, renderWithOptions, getElement,
} from "./util/Util";

interface DynamicButton {
    id: string;
    buttonHTML: string;
    onClick: () => void;
}

/**
 * Component to display the status and useful buttons for Papyros
 */
export class StatusPanel {
    buttons: Array<DynamicButton>;

    constructor() {
        this.buttons = [];
    }

    addButton(options: ButtonOptions, onClick: () => void): void {
        this.buttons.push({
            id: options.id,
            buttonHTML: renderButton(options),
            onClick: onClick
        });
    }
    get statusSpinner(): HTMLElement {
        return document.getElementById(STATE_SPINNER_ID) as HTMLElement;
    }

    get statusText(): HTMLElement {
        return document.getElementById(APPLICATION_STATE_TEXT_ID) as HTMLElement;
    }

    /**
     * Show or hide the spinning circle, representing a running animation
     * @param {boolean} show Whether to show the spinner
     */
    showSpinner(show: boolean): void {
        getElement(STATE_SPINNER_ID).style.display = show ? "" : "none";
    }

    /**
     * Display some text in the panel for the user
     * @param {string} status The text to display
     */
    setStatus(status: string): void {
        getElement(APPLICATION_STATE_TEXT_ID).innerText = status;
    }

    /**
     * Render the panel with the given options
     * @param {RenderOptions} options Options for rendering 
     * @return {HTMLElement} The rendered panel
     */
    render(options: RenderOptions): HTMLElement {
        const rendered = renderWithOptions(options, `
<div class="grid grid-cols-2 items-center">
    <div class="col-span-1 flex flex-row">
        ${this.buttons.map(b => b.buttonHTML).join("\n")}
    </div>
    <div class="col-span-1 flex flex-row-reverse">
        <div id="${APPLICATION_STATE_TEXT_ID}"></div>
        ${svgCircle(STATE_SPINNER_ID, "red")}
    </div>
</div>
        `);
        this.buttons.forEach(b => addListener(b.id, b.onClick, "click"));
        return rendered;
    }
}
