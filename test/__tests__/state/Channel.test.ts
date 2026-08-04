import { describe, expect, it, beforeEach } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { BackendManager } from "../../../src/communication/BackendManager";
import { waitForInputReady, waitForOutput, waitForPapyrosReady } from "../../helpers";

/**
 * BackendManager.channel is static and shared, so clear it to observe what a launch
 * actually needed rather than what an earlier test left behind.
 */
describe.sequential("lazy channel setup", () => {
    beforeEach(() => {
        BackendManager.channel = null;
    });

    it("does not build a channel for python when the stack can be suspended", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        const backend = await papyros.runner.backend;

        expect(backend.usesPromiseTransport).toBe(true);
        expect(BackendManager.channel).toBeNull();
        expect(backend.channel).toBeNull();
    }, 180000);

    it("builds a channel for python when JSPI is disabled", async () => {
        const papyros = new Papyros();
        papyros.runner.allowJspi = false;
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        const backend = await papyros.runner.backend;

        expect(backend.usesPromiseTransport).toBe(false);
        expect(BackendManager.channel).not.toBeNull();
        expect(backend.channel).toBe(BackendManager.channel);
    }, 180000);

    it("builds a channel when javascript is selected, and input still works", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        const backend = await papyros.runner.backend;

        expect(backend.usesPromiseTransport).toBe(false);
        expect(BackendManager.channel).not.toBeNull();

        papyros.runner.code = 'console.log("hello", prompt("name?"));';
        await waitForInputReady();
        const unsubscribe = papyros.io.subscribe(
            () => (papyros.io.awaitingInput ? papyros.io.provideInput("channel") : ""),
            "awaitingInput",
        );
        await papyros.runner.start();
        await waitForOutput(papyros);
        await waitForPapyrosReady(papyros);
        expect(papyros.io.output[0].content).toBe("hello channel\n");
        unsubscribe();
    }, 180000);
});
