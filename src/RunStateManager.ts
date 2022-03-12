import {
    APPLICATION_STATE_TEXT_ID, RUN_BTN_ID,
    STATE_SPINNER_ID, STOP_BTN_ID, DEBUG_BTN_ID
} from "./Constants";
import { svgCircle } from "./util/HTMLShapes";
import {
    addListener, ButtonOptions, renderButton,
    RenderOptions, renderWithOptions, getElement,
    t
} from "./util/Util";

interface DynamicButton {
    id: string;
    buttonHTML: string;
    onClick: () => void;
}

/**
 * Enum representing the possible states while processing code
 */
export enum RunState {
    Loading = "loading",
    Running = "running",
    AwaitingInput = "awaiting_input",
    Stopping = "stopping",
    Ready = "ready"
}

/**
 * Helper component to manage and visualize the current RunState
 */
export class RunStateManager {
    /**
     * Current state of the program
     */
    state: RunState;
    /**
     * Buttons managed by this component
     */
    buttons: Array<DynamicButton>;

    /**
     * Construct a new RunStateManager with the given listeners
     * @param {function} onRunClicked Callback for when the run button is clicked
     * @param {function} onStopClicked Callback for when the stop button is clicked
     * @param {function} onDebugClicked Callback for when the debug button is clicked
     */
    constructor(onRunClicked: () => void, onStopClicked: () => void,
        onDebugClicked: () => void) {
        this.buttons = [];
        this.addButton({
            id: RUN_BTN_ID,
            buttonText: t("Papyros.run"),
            extraClasses: "text-white bg-blue-500"
        }, onRunClicked);
        this.addButton({
            id: STOP_BTN_ID,
            buttonText: t("Papyros.stop"),
            extraClasses: "text-white bg-red-500"
        }, onStopClicked);
        this.addButton({
            id: DEBUG_BTN_ID,
            buttonText: t("Papyros.debug"),
            extraClasses: "text-white bg-green-500"
        }, onDebugClicked);
        this.state = RunState.Ready;
    }

    /**
     * Get the button to run the code
     */
    get runButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(RUN_BTN_ID);
    }

    /**
     * Get the button to debug the code
     */
    get debugButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(DEBUG_BTN_ID);
    }

    /**
     * Get the button to interrupt the code
     */
    get stopButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(STOP_BTN_ID);
    }

    /**
     * Show or hide the spinning circle, representing a running animation
     * @param {boolean} show Whether to show the spinner
     */
    showSpinner(show: boolean): void {
        getElement(STATE_SPINNER_ID).style.display = show ? "" : "none";
    }


    /**
     * Show the current state of the program to the user
     * @param {RunState} state The current state of the run
     * @param {string} message Optional message to indicate the state
     */
    setState(state: RunState, message?: string): void {
        this.state = state;
        this.stopButton.disabled = [RunState.Ready, RunState.Loading].includes(state);
        if (state === RunState.Ready) {
            this.showSpinner(false);
            this.runButton.disabled = false;
            this.debugButton.disabled = false;
        } else {
            this.showSpinner(true);
            this.runButton.disabled = true;
            this.debugButton.disabled = true;
        }
        getElement(APPLICATION_STATE_TEXT_ID).innerText =
            message || t(`Papyros.states.${state}`);
    }

    /**
     * Add a button to display to the user
     * @param {ButtonOptions} options Options for rendering the button
     * @param {function} onClick Listener for click events on the button
     */
    addButton(options: ButtonOptions, onClick: () => void): void {
        this.buttons.push({
            id: options.id,
            buttonHTML: renderButton(options),
            onClick: onClick
        });
    }

    /**
 * Render the RunStateManager with the given options
 * @param {RenderOptions} options Options for rendering
 * @return {HTMLElement} The rendered RunStateManager
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
</div>`);
        // Buttons are freshly added to the DOM, so attach listeners now
        this.buttons.forEach(b => addListener(b.id, b.onClick, "click"));
        return rendered;
    }
}
