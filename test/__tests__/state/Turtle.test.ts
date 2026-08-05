import {describe, expect, it} from "vitest";
import {Papyros} from "../../../src/frontend/state/Papyros";
import {ProgrammingLanguage} from "../../../src/ProgrammingLanguage";
import {RunState} from "../../../src/frontend/state/Runner";
import {RunMode} from "../../../src/backend/Backend";
import {OutputType} from "../../../src/frontend/state/InputOutput";
import {buildTurtleSvg, TurtlePatch} from "../../../src/frontend/state/TurtleSvg";
import {waitForOutput, waitForPapyrosReady} from "../../helpers";

/**
 * The drawing is streamed as incremental patches, so the document a user sees
 * is the replay of every patch produced so far.
 */
function turtlePatches(papyros: Papyros): TurtlePatch[] {
    return papyros.io.output.filter(o => o.type === OutputType.turtle).map(o => o.content as TurtlePatch);
}

function turtleSvg(papyros: Papyros): string {
    const svg = buildTurtleSvg(turtlePatches(papyros));
    expect(svg).toBeDefined();
    return svg!;
}

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
        expect(turtlePatches(papyros).length).toBeGreaterThan(0);
        const svg = turtleSvg(papyros);
        expect(svg).toContain("<svg");
        expect(svg).toContain("<polyline");
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
        const patches = turtlePatches(papyros);
        expect(patches.length).toBeGreaterThanOrEqual(2);
        // Replaying a prefix of the patches yields the drawing at that point, which is
        // how the debugger shows the drawing build up step by step.
        for (let i = 1; i <= patches.length; i++) {
            expect(buildTurtleSvg(patches.slice(0, i))).toContain("<svg");
        }
        // Only the first patch carries the document itself; the rest are increments.
        expect(patches[0].open).toBeDefined();
        expect(patches.slice(1).every(p => p.open === undefined)).toBe(true);
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
        const svg = turtleSvg(papyros);
        expect(svg).toMatch(/width="800"/);
        expect(svg).toMatch(/height="400"/);
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
        const svg = turtleSvg(papyros);
        expect(svg).toMatch(/width="500"/);
        expect(svg).toMatch(/height="250"/);
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
        const svg = turtleSvg(papyros);
        expect(svg).toMatch(/width="1000"/);
        expect(svg).toMatch(/height="1000"/);
        expect(svg).toContain("500.5,500.5");
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
        expect(turtlePatches(papyros).length).toBeGreaterThan(0);
        expect(turtleSvg(papyros)).toContain("<svg");
    });

    it("re-sends the document when setup() runs mid-debug", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        // Frames are snapshotted from the moment turtle is imported, so by the
        // time setup() runs the 400x400 document has already been streamed and
        // the resize must invalidate it (and every fragment's coordinates).
        papyros.runner.code = `import turtle
t = turtle.Turtle()
t.forward(50)
turtle.setup(800, 600)
t.forward(50)
turtle.done()`;
        await papyros.runner.start(RunMode.Debug);
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);
        const svg = turtleSvg(papyros);
        expect(svg).toMatch(/width="800"/);
        expect(svg).toMatch(/height="600"/);
    });

    it("streams a debug session incrementally instead of a document per frame", async () => {
        const papyros = new Papyros();
        await papyros.launch();
        papyros.runner.programmingLanguage = ProgrammingLanguage.Python;
        // Enough drawing that re-sending the whole document per frame would show up:
        // this used to cost one full SVG (plus base64) for every debug frame.
        // The pen is lifted between strokes so each one is its own canvas item;
        // a single continuous stroke is one item that grows every frame and is
        // re-sent in full, which caps the saving at ~5-7x instead of ~80x.
        papyros.runner.code = `import turtle
t = turtle.Turtle()
for i in range(40):
    t.penup()
    t.goto(-100 + i * 5, -50)
    t.pendown()
    t.forward(60)
turtle.done()`;
        await papyros.runner.start(RunMode.Debug);
        await waitForPapyrosReady(papyros);
        await waitForOutput(papyros);

        const patches = turtlePatches(papyros);
        const svg = turtleSvg(papyros);
        expect(patches.length).toBeGreaterThan(10);
        expect(svg.length).toBeGreaterThan(1000);

        // Regression guard for dodona-edu/papyros#1020: the bytes crossing the worker
        // boundary must stay proportional to the drawing, not to frames x drawing.
        const streamed = patches.reduce((total, p) => total + JSON.stringify(p).length, 0);
        expect(streamed).toBeLessThan(svg.length * 4);
        expect(streamed).toBeLessThan((patches.length * svg.length) / 4);
    });
});
