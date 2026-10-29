import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { fakeClient } from "../../fakeClient";
import type { PapyrosElement } from "../../../src/frontend/components/PapyrosElement";
import "../../../src/frontend/components/app/ProgrammingLanguagePicker";
import "../../../src/frontend/components/app/ExamplePicker";
import { BackendStatus } from "../../../src/frontend/state/Runner";

const mounted: HTMLElement[] = [];

function mount(tag: string, papyros: Papyros): PapyrosElement {
    const element = document.createElement(tag) as PapyrosElement;
    element.papyros = papyros;
    document.body.append(element);
    mounted.push(element);
    return element;
}

async function disabled(element: PapyrosElement): Promise<boolean> {
    await element.updateComplete;
    return element.shadowRoot!.querySelector<HTMLElement & { disabled: boolean }>("md-outlined-select")!.disabled;
}

afterEach(() => {
    for (const element of mounted.splice(0)) {
        element.remove();
    }
});

describe.each(["p-programming-language-picker", "p-example-picker"])("%s", (tag) => {
    it("stays enabled while the backend launches, and is disabled during a run and while debugging", async () => {
        const client = fakeClient();
        const launch = client.holdLaunch();
        const papyros = new Papyros();
        papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
        const element = mount(tag, papyros);

        const launching = papyros.runner.launch();
        expect(papyros.runner.backendStatus).toEqual({ status: BackendStatus.Launching });
        expect(await disabled(element)).toBe(false);
        launch.finish();
        await launching;

        const running = papyros.runner.start();
        expect(await disabled(element)).toBe(true);
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.finishRun();
        await running;
        expect(await disabled(element)).toBe(false);

        papyros.debugger.active = true;
        expect(await disabled(element)).toBe(true);
        papyros.dispose();
    });
});
