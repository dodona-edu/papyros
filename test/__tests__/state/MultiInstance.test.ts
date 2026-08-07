import { describe, expect, it } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { BackendEventType } from "../../../src/communication/BackendEvent";
import { waitForInputReady, waitForOutput, waitForPapyrosReady } from "../../helpers";

async function javascriptPapyros(): Promise<Papyros> {
    const papyros = new Papyros();
    // Selecting the language before launching keeps the default Python backend
    // from booting at all: only the JavaScript worker is ever started
    papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
    await papyros.launch();
    await papyros.runner.backend;
    return papyros;
}

describe.sequential("multiple Papyros instances", () => {
    it("run the same language concurrently with isolated output", async () => {
        const first = await javascriptPapyros();
        const second = await javascriptPapyros();

        first.runner.code = 'console.log("from first");';
        second.runner.code = 'console.log("from second");';
        await Promise.all([first.runner.start(), second.runner.start()]);
        await waitForOutput(first);
        await waitForOutput(second);

        expect(first.io.output[0].content).toBe("from first\n");
        expect(second.io.output[0].content).toBe("from second\n");
        first.dispose();
        second.dispose();
    }, 180000);

    it("read input through their own channels", async () => {
        const first = await javascriptPapyros();
        const second = await javascriptPapyros();
        expect(first.channel).not.toBeNull();
        expect(second.channel).not.toBeNull();
        expect(first.channel).not.toBe(second.channel);

        first.runner.code = 'console.log("first", prompt("name?"));';
        second.runner.code = 'console.log("second", prompt("name?"));';
        await waitForInputReady();
        const unsubFirst = first.io.subscribe(
            () => (first.io.awaitingInput ? first.io.provideInput("one") : ""),
            "awaitingInput",
        );
        const unsubSecond = second.io.subscribe(
            () => (second.io.awaitingInput ? second.io.provideInput("two") : ""),
            "awaitingInput",
        );
        await Promise.all([first.runner.start(), second.runner.start()]);
        await waitForOutput(first);
        await waitForOutput(second);
        unsubFirst();
        unsubSecond();

        expect(first.io.output[0].content).toBe("first one\n");
        expect(second.io.output[0].content).toBe("second two\n");
        first.dispose();
        second.dispose();
    }, 180000);

    it("do not deliver events across instances", async () => {
        const first = await javascriptPapyros();
        const second = await javascriptPapyros();

        first.runner.code = 'console.log("only first");';
        await first.runner.start();
        await waitForOutput(first);
        await waitForPapyrosReady(first);

        expect(second.io.output).toEqual([]);
        first.dispose();
        second.dispose();
    }, 180000);

    it("keep working after another instance is disposed", async () => {
        const disposed = await javascriptPapyros();
        const survivor = await javascriptPapyros();
        disposed.dispose();

        // A disposed bus can still receive stragglers without breaking anything
        disposed.events.publish({ type: BackendEventType.Output, data: "late", contentType: "text/plain" });

        survivor.runner.code = 'console.log("still alive");';
        await survivor.runner.start();
        await waitForOutput(survivor);

        expect(survivor.io.output[0].content).toBe("still alive\n");
        survivor.dispose();
    }, 180000);
});
