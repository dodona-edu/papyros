import { BackendEventType } from "../../src/BackendEvent";
import { BackendManager } from "../../src/BackendManager";
import { FriendlyError, OutputManager } from "../../src/OutputManager";

describe("OutputManager", () => {
    const outputParentId = "jest-code-editor";
    document.body.innerHTML = `<div id=${outputParentId}></div>`;
    const outputManager = new OutputManager();
    outputManager.render({ parentElementId: outputParentId });

    beforeEach(() => {
        outputManager.reset();
    })
    it("processes output", () => {
        const output = "Hello, World!"
        BackendManager.publish({
            type: BackendEventType.Output,
            data: output, contentType: "text/plain"
        });
        expect(outputManager.outputArea.lastChild!.textContent).toContain(output)
    })

    it("processes errors", () => {
        const errorTxt = "Something went wrong";
        BackendManager.publish({
            type: BackendEventType.Error,
            data: errorTxt, contentType: "text/plain"
        });
        expect(outputManager.outputArea.lastChild!.textContent).toContain(errorTxt)

        const friendlyError: FriendlyError = {
            name: "MockError",
            info: "A MockError occurs to check if the OutputManager handles all data properly",
            what: "An error for testing",
            where: "This test"
        }
        BackendManager.publish({
            type: BackendEventType.Error,
            data: friendlyError, contentType: "application/json"
        })
        for(const key of Object.keys(friendlyError)){
            expect(outputManager.outputArea.innerHTML).toContain(friendlyError[key as keyof FriendlyError])
        }
    })

    it("clears when a run starts", () => {
        BackendManager.publish({
            type: BackendEventType.Output,
            data: "Something", contentType: "text/plain"
        });
        expect(outputManager.outputArea.hasChildNodes()).toBeTruthy();
        BackendManager.publish({
            type: BackendEventType.Start,
            data: "Run started", contentType: "text/plain"
        })
        expect(outputManager.outputArea.hasChildNodes()).toBeFalsy();
    })
})