import { BackendEventType } from "../../src/BackendEvent";
import { BackendManager } from "../../src/BackendManager";
import { INPUT_AREA_WRAPPER_ID, INPUT_TA_ID, SEND_INPUT_BTN_ID } from "../../src/Constants";
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
    const inputManager = new InputManager(inp => inputs.push(inp));
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
        const batchArea = getElement<HTMLInputElement>(INPUT_TA_ID);
        batchArea.value = batchInputs[0];
        requestInput("First");
        requestInput("Second");
        expect(inputs.length).toEqual(1);
        expect(inputs).toContain(batchInputs[0]);
        batchArea.value += `\n${batchInputs[1]}`;
        expect(inputs.length).toEqual(1);
        batchArea.dispatchEvent(new KeyboardEvent("keydown", { key: "enter" }));
        expect(inputs).toEqual(batchInputs);
    });
});
