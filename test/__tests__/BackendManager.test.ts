import { ProgrammingLanguage } from "../../src/ProgrammingLanguage";
import { BackendManager } from "../../src/BackendManager";
// eslint-disable-next-line jest/no-mocks-import
import { MockBackend } from "../__mocks__/MockBackend";
import { BackendEvent, BackendEventType } from "../../src/BackendEvent";

function registerMock(language: ProgrammingLanguage): void {
    BackendManager.registerBackend(language,
        () => {
            return { workerProxy: new MockBackend() } as any;
        });
}

describe("BackendManager", () => {
    beforeEach(() => {
        registerMock(ProgrammingLanguage.JavaScript);
    });

    it("can register a backend", () => {
        expect(BackendManager.getBackend(ProgrammingLanguage.JavaScript)).toBeTruthy();
    });

    it("properly implements PubSub", async () => {
        const events: Array<BackendEvent> = [];
        const backend = BackendManager.getBackend(ProgrammingLanguage.JavaScript);
        const eventHandler = jest.fn((e: BackendEvent) => BackendManager.publish(e));
        const eventProcessor = jest.fn((e: BackendEvent) => events.push(e));
        BackendManager.subscribe(BackendEventType.Output, eventProcessor);
        await backend.workerProxy.launch(eventHandler);
        await backend.workerProxy.lintCode("");
        expect(eventHandler).toBeCalled();
        expect(eventProcessor).toBeCalled();
        expect(events.length).toEqual(1);
    });


    it("can remove a backend", () => {
        expect(BackendManager.removeBackend(ProgrammingLanguage.JavaScript)).toEqual(true);
    });
});

