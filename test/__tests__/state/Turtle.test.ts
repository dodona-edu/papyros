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
        const turtleOutputs = papyros.io.output.filter(o => o.type === OutputType.turtle);
        expect(turtleOutputs.length).toBeGreaterThan(0);
        expect(turtleOutputs[0].contentType).toBe("image/svg+xml;base64");
        const decoded = atob(turtleOutputs[0].content as string);
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
        const turtleOutputs = papyros.io.output.filter(o => o.type === OutputType.turtle);
        expect(turtleOutputs.length).toBeGreaterThanOrEqual(2);
        // Each snapshot should be a valid base64-encoded SVG
        for (const img of turtleOutputs) {
            expect(img.contentType).toBe("image/svg+xml;base64");
            expect(atob(img.content as string)).toContain("<svg");
        }
    });

    it("honors turtle.setup() canvas dimensions", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        papyros.runner.code = `import turtle
turtle.setup(800, 400)
turtle.forward(100)
turtle.done()`;
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        const turtleOutputs = papyros.io.output.filter(o => o.type === OutputType.turtle);
        expect(turtleOutputs.length).toBeGreaterThan(0);
        const decoded = atob(turtleOutputs[turtleOutputs.length - 1].content as string);
        expect(decoded).toMatch(/width="800"/);
        expect(decoded).toMatch(/height="400"/);
    });

    it("treats fractional setup() values as fractions of a 1000px reference", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        // setup(0.5, 0.25) should resolve to 500x250, mirroring stdlib turtle's
        // "fraction of the screen" semantics rather than collapsing to int(0.x) == 0.
        papyros.runner.code = `import turtle
turtle.setup(0.5, 0.25)
turtle.forward(50)
turtle.done()`;
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        const turtleOutputs = papyros.io.output.filter(o => o.type === OutputType.turtle);
        expect(turtleOutputs.length).toBeGreaterThan(0);
        const decoded = atob(turtleOutputs[turtleOutputs.length - 1].content as string);
        expect(decoded).toMatch(/width="500"/);
        expect(decoded).toMatch(/height="250"/);
    });

    it("honors Screen().setup() and recenters the origin", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        // Drawing a zero-length stroke at the turtle's home (0, 0) emits a polyline
        // whose coords reveal the canvas-pixel origin. With setup(1000, 1000) the
        // origin should sit at the canvas center (500.5, 500.5), not the default 200.5.
        papyros.runner.code = `import turtle
window = turtle.Screen()
window.setup(1000, 1000)
t = turtle.Turtle()
t.dot(10, "red")
turtle.done()`;
        await papyros.runner.start();
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        const turtleOutputs = papyros.io.output.filter(o => o.type === OutputType.turtle);
        expect(turtleOutputs.length).toBeGreaterThan(0);
        const decoded = atob(turtleOutputs[turtleOutputs.length - 1].content as string);
        expect(decoded).toMatch(/width="1000"/);
        expect(decoded).toMatch(/height="1000"/);
        expect(decoded).toContain("500.5,500.5");
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
        const turtleOutputs = papyros.io.output.filter(o => o.type === OutputType.turtle);
        expect(turtleOutputs.length).toBeGreaterThan(0);
        expect(turtleOutputs[0].contentType).toBe("image/svg+xml;base64");
        expect(atob(turtleOutputs[0].content as string)).toContain("<svg");
    });
});
