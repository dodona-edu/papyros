import { BackendEventType } from "../../src/communication/BackendEvent";
import { BackendManager } from "../../src/communication/BackendManager";
import {
    INPUT_AREA_WRAPPER_ID,
    INPUT_TA_ID, SEND_INPUT_BTN_ID
} from "../../src/Constants";
import { BatchInputHandler } from "../../src/input/BatchInputHandler";
import { InputManager, InputMode } from "../../src/InputManager";
import { getElement } from "../../src/util/Util";

function requestInput(prompt = ""): void {
    BackendManager.publish({
        type: BackendEventType.Input,
        data: prompt, contentType: "text/plain"
    });
}

describe("InputManager", () => {
    let inputs: Array<string> = [];
    document.body.innerHTML = `<div id=${INPUT_AREA_WRAPPER_ID}></div>`;
    const inputManager = new InputManager(inp => inputs.push(inp), InputMode.Interactive);
    inputManager.render({ parentElementId: INPUT_AREA_WRAPPER_ID });

    beforeEach(() => {
        inputs = [];
    });

    it("can process input in interactive mode", () => {
        const input = "Jest";
        inputManager.setInputMode(InputMode.Interactive);
        expect(inputManager.getInputMode()).toEqual(InputMode.Interactive);
        requestInput("What is your name?");
        expect(inputManager.isWaiting()).toEqual(true);
        getElement<HTMLInputElement>(INPUT_TA_ID).value = input;
        getElement<HTMLButtonElement>(SEND_INPUT_BTN_ID).click();
        expect(inputs.length).toEqual(1);
        expect(inputs).toContain(input);
        expect(inputManager.isWaiting()).toEqual(false);
    });

    it("can process input in batch mode", () => {
        const batchInputs = ["1", "2"];
        inputManager.setInputMode(InputMode.Batch);
        expect(inputManager.getInputMode()).toEqual(InputMode.Batch);
        const batchHandler = inputManager.inputHandler as BatchInputHandler;
        batchHandler.batchEditor.setText(batchInputs[0] + "\n");
        requestInput("First");
        requestInput("Second");
        expect(inputs.length).toEqual(1);
        expect(inputs).toContain(batchInputs[0]);
        batchHandler.batchEditor.setText(batchHandler.batchEditor.getText() + batchInputs[1]);
        expect(inputs.length).toEqual(1);
        expect(inputManager.isWaiting()).toBe(true);
        batchHandler.batchEditor.setText(batchHandler.batchEditor.getText() + "\n");
        expect(inputManager.isWaiting()).toBe(false);
        expect(inputs).toEqual(batchInputs);
    });
});
