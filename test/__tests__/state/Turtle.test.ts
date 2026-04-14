import {describe, expect, it} from "vitest";
import {Papyros} from "../../../src/frontend/state/Papyros";
import {ProgrammingLanguage} from "../../../src/ProgrammingLanguage";
import {RunState} from "../../../src/frontend/state/Runner";
import {RunMode} from "../../../src/backend/Backend";
import {OutputType} from "../../../src/frontend/state/InputOutput";
import {waitForOutput, waitForPapyrosReady} from "../../helpers";

describe("Turtle", () => {
    it("can load turtle and generate an SVG image", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `import turtle
t = turtle.Turtle()
t.forward(100)
t.right(90)
t.forward(100)
turtle.done()`;
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        expect(papyros.runner.state).toBe(RunState.Ready);
        const imgOutputs = papyros.io.output.filter(o => o.type === OutputType.img);
        expect(imgOutputs.length).toBeGreaterThan(0);
        expect(imgOutputs[0].contentType).toBe("img/svg+xml;base64");
        const decoded = atob(imgOutputs[0].content as string);
        expect(decoded).toContain("<svg");
    });

    it("emits incremental snapshots on sleep", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `import turtle
import time
t = turtle.Turtle()
t.forward(50)
time.sleep(0.1)
t.right(90)
t.forward(50)
turtle.done()`;
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros, 2);
        const imgOutputs = papyros.io.output.filter(o => o.type === OutputType.img);
        expect(imgOutputs.length).toBeGreaterThanOrEqual(2);
        // Each snapshot should be a valid base64-encoded SVG
        for (const img of imgOutputs) {
            expect(img.contentType).toBe("img/svg+xml;base64");
            expect(atob(img.content as string)).toContain("<svg");
        }
    });

    it("emits turtle image in debug mode", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `import turtle
t = turtle.Turtle()
t.forward(100)
turtle.done()`;
        await papyros.runner.start(RunMode.Debug);
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        const imgOutputs = papyros.io.output.filter(o => o.type === OutputType.img);
        expect(imgOutputs.length).toBeGreaterThan(0);
        expect(imgOutputs[0].contentType).toBe("img/svg+xml;base64");
        expect(atob(imgOutputs[0].content as string)).toContain("<svg");
    });
});
