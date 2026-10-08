import { describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { PapyrosRuntime, Run } from "../../../src/frontend/state/PapyrosRuntime";
import { RunState } from "../../../src/frontend/state/Runner";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { RunMode } from "../../../src/backend/Backend";
import { BackendEvent, BackendEventType } from "../../../src/communication/BackendEvent";
import { BackendManager } from "../../../src/communication/BackendManager";
import { OutputType } from "../../../src/frontend/state/InputOutput";
import { waitForOutput, waitForPapyrosReady, waitForRunning } from "../../helpers";
import { fakeClient } from "../../fakeClient";

const output = (data: string): BackendEvent => ({ type: BackendEventType.Output, data, contentType: "text/plain" });
const start: BackendEvent = { type: BackendEventType.Start, data: "RunCode", contentType: "text/plain" };
const end: BackendEvent = { type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain" };
const input: BackendEvent = { type: BackendEventType.Input, data: "name?", contentType: "text/plain" };
const loading = (status: string, modules: string[] = ["numpy"]): BackendEvent => ({
    type: BackendEventType.Loading,
    data: { modules, status },
    contentType: "application/json",
});

async function sharing(creator: () => any): Promise<{ runtime: PapyrosRuntime; a: Papyros; b: Papyros }> {
    const runtime = new PapyrosRuntime();
    runtime.registerBackend(ProgrammingLanguage.Python, creator);
    const a = new Papyros({ runtime });
    const b = new Papyros({ runtime });
    await Promise.all([a.runner.launch(), b.runner.launch()]);
    return { runtime, a, b };
}

async function sharingJavaScript(): Promise<{ runtime: PapyrosRuntime; a: Papyros; b: Papyros }> {
    const runtime = new PapyrosRuntime();
    const a = new Papyros({ runtime });
    const b = new Papyros({ runtime });
    for (const papyros of [a, b]) {
        papyros.runner.programmingLanguage = ProgrammingLanguage.JavaScript;
        await papyros.launch();
        await papyros.runner.backend;
    }
    return { runtime, a, b };
}

describe.sequential("Papyros instances sharing a runtime", () => {
    it("launch a single worker", async () => {
        const client = fakeClient();
        const creator = vi.fn(() => client);
        const { runtime, a, b } = await sharing(creator);

        expect(creator).toHaveBeenCalledOnce();
        expect(client.workerProxy.launch).toHaveBeenCalledOnce();
        expect(await a.runner.backend).toBe(await b.runner.backend);
        expect(a.runner.backendReady && b.runner.backendReady).toBe(true);
        runtime.dispose();
    });

    it("refuse a start while another instance runs, without touching it", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);
        b.io.output = [{ type: OutputType.stdout, content: "earlier" }];

        const running = a.runner.start();
        await b.runner.start(RunMode.Debug);

        expect(runtime.currentRun?.owner).toBe(a);
        expect(b.io.output).toEqual([{ type: OutputType.stdout, content: "earlier" }]);
        expect(b.runner.state).toBe(RunState.Ready);
        expect(b.debugger.active).toBe(false);

        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(end);
        client.finishRun();
        await running;
        expect(client.workerProxy.runCode).toHaveBeenCalledOnce();
        runtime.dispose();
    });

    it("run a start requested twice in the same tick once", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);

        const first = a.runner.start();
        const second = b.runner.start();
        const again = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(end);
        client.finishRun();
        await Promise.all([first, second, again]);

        expect(client.workerProxy.runCode).toHaveBeenCalledOnce();
        runtime.dispose();
    });

    it("ignore stop and input from an instance that has no run in progress", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);

        const runningA = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        client.emit(input);
        await b.runner.stop();
        await b.runner.provideInput("from b");
        expect(a.runner.state).toBe(RunState.AwaitingInput);
        expect(b.runner.state).toBe(RunState.Ready);

        await a.runner.provideInput("from a");
        client.emit(end);
        client.finishRun();
        await runningA;

        // The run of a is over, so the next run is not a's to stop or answer either
        const runningB = b.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledTimes(2));
        client.emit(start);
        client.emit(input);
        await a.runner.stop();
        await a.runner.provideInput("from a again");

        expect(client.interrupt).not.toHaveBeenCalled();
        expect(client.writeMessage.mock.calls).toEqual([["from a"]]);
        expect(b.runner.state).toBe(RunState.AwaitingInput);
        expect(a.runner.state).toBe(RunState.Ready);

        client.emit(end);
        client.finishRun();
        await runningB;
        runtime.dispose();
    });

    it("let the other instance run after a stuck run was stopped", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);

        // The interrupt changes nothing, so stop() has to replace the worker
        const running = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        await a.runner.stop();
        await running;

        expect(client.restart).toHaveBeenCalledOnce();
        expect(runtime.currentRun).toBeNull();
        expect(a.runner.state).toBe(RunState.Ready);

        const next = b.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledTimes(2));
        expect(runtime.currentRun?.owner).toBe(b);
        // The replaced worker was launched again before b ran on it
        expect(client.workerProxy.launch).toHaveBeenCalledTimes(2);
        client.emit(end);
        client.finishRun();
        await next;
        runtime.dispose();
    }, 20000);

    it("let the other instance run after a real run was stopped", async () => {
        const createBackend = vi.spyOn(BackendManager, "createBackend");
        const { runtime, a, b } = await sharingJavaScript();
        expect(createBackend).toHaveBeenCalledOnce();
        createBackend.mockRestore();
        a.runner.code = "while (true) {}";
        const running = a.runner.start();
        await waitForRunning(a);

        await a.runner.stop();
        await running;
        expect(runtime.currentRun).toBeNull();

        b.runner.code = 'console.log("after stop");';
        await b.runner.start();
        await waitForOutput(b);
        expect(b.io.output[0].content).toBe("after stop\n");
        expect(a.io.output).toEqual([]);
        runtime.dispose();
    }, 180000);

    it("keep the files and output of two instances apart on one Python worker", async () => {
        const runtime = new PapyrosRuntime();
        const a = new Papyros({ runtime });
        const b = new Papyros({ runtime });
        await a.launch();
        await b.launch();

        a.runner.code = 'open("created.txt", "w").write("by a")\nprint("from a")';
        await a.runner.start(RunMode.Run, [{ name: "a.txt", content: "a", binary: false }]);
        await waitForOutput(a, 1, 10000);
        await waitForPapyrosReady(a, 60000);

        b.runner.code = "import os\nprint(sorted(os.listdir()))";
        await b.runner.start(RunMode.Run, [{ name: "b.txt", content: "b", binary: false }]);
        await waitForOutput(b, 1, 10000);
        await waitForPapyrosReady(b, 60000);

        expect(a.io.output.map((o) => o.content).join("")).toBe("from a\n");
        expect(b.io.output.map((o) => o.content).join("")).toBe("['b.txt']\n");
        expect(a.io.files.map((f) => f.name).sort()).toEqual(["a.txt", "created.txt"]);
        expect(b.io.files.map((f) => f.name)).toEqual(["b.txt"]);
        runtime.dispose();
    }, 180000);

    it("free the worker when the running instance is disposed", async () => {
        const { runtime, a, b } = await sharingJavaScript();
        a.runner.code = "while (true) {}";
        const running = a.runner.start();
        await waitForRunning(a);

        a.dispose();
        expect(runtime.currentRun).toBeNull();
        await running;

        b.runner.code = 'console.log("survivor");';
        await b.runner.start();
        await waitForOutput(b);
        expect(b.io.output[0].content).toBe("survivor\n");

        const backend = await b.runner.backend;
        runtime.dispose();
        expect(backend.worker).toBeUndefined();
    }, 180000);

    it("put every instance in error when the launch fails, and recover on a retry", async () => {
        const working = fakeClient();
        const creator = vi
            .fn()
            .mockImplementationOnce(
                () =>
                    ({
                        workerProxy: { launch: () => Promise.reject(new Error("worker failed to start")) },
                        terminate: vi.fn(),
                    }) as any,
            )
            .mockImplementationOnce(() => working);
        const runtime = new PapyrosRuntime();
        runtime.registerBackend(ProgrammingLanguage.Python, creator);
        const a = new Papyros({ runtime });
        const b = new Papyros({ runtime });

        const launches = await Promise.allSettled([a.runner.launch(), b.runner.launch()]);

        expect(launches.map((l) => l.status)).toEqual(["rejected", "rejected"]);
        expect(a.runner.state).toBe(RunState.Error);
        expect(b.runner.state).toBe(RunState.Error);

        await a.runner.launch();
        await b.runner.launch();
        expect(creator).toHaveBeenCalledTimes(2);
        expect(working.workerProxy.launch).toHaveBeenCalledOnce();
        expect(a.runner.state).toBe(RunState.Ready);
        expect(b.runner.state).toBe(RunState.Ready);
        runtime.dispose();
    });

    it("tell every instance about loading packages without disturbing an idle one", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);
        const seenByB = vi.fn();
        b.events.subscribe(BackendEventType.Loading, seenByB);

        const running = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit({
            type: BackendEventType.Loading,
            data: { modules: ["numpy"], status: "loading" },
            contentType: "application/json",
        });

        expect(seenByB).toHaveBeenCalledOnce();
        expect(a.runner.state).toBe(RunState.Loading);
        expect(a.runner.loadingPackages).toEqual(["numpy"]);
        expect(b.runner.state).toBe(RunState.Ready);
        expect(b.runner.loadingPackages).toEqual([]);

        client.emit({
            type: BackendEventType.Loading,
            data: { modules: ["numpy"], status: "loaded" },
            contentType: "application/json",
        });
        client.emit(end);
        client.finishRun();
        await running;
        expect(seenByB).toHaveBeenCalledTimes(2);
        expect(b.runner.state).toBe(RunState.Ready);
        runtime.dispose();
    });

    it("does not interrupt a run another instance started while stop waited for the backend", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);
        const runningA = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);

        // Hold stop() in its wait for the backend until b has taken over the runtime
        let resume!: () => void;
        const held = new Promise<void>((resolve) => (resume = resolve));
        const ready = runtime.ready.bind(runtime);
        vi.spyOn(runtime, "ready").mockImplementationOnce(async (language) => {
            await held;
            return ready(language);
        });
        const stopping = a.runner.stop();

        client.emit(end);
        client.finishRun();
        await runningA;
        const runningB = b.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledTimes(2));
        client.emit(start);
        resume();
        await stopping;

        expect(client.interrupt).not.toHaveBeenCalled();
        expect(runtime.currentRun?.owner).toBe(b);
        expect(b.runner.state).toBe(RunState.Running);
        expect(a.runner.state).toBe(RunState.Ready);

        client.emit(end);
        client.finishRun();
        await runningB;
        runtime.dispose();
    });

    it("drop the events of a run on a replaced worker and of any earlier run", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);
        const runningA = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);
        const firstRun = client.runId;
        const replacedWorker = client.callback;
        runtime.restartWorker(ProgrammingLanguage.Python);
        await runningA;

        replacedWorker({ ...output("from the replaced worker"), runId: firstRun });
        expect(a.io.output).toEqual([]);

        const runningB = b.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledTimes(2));
        client.emit(start);
        client.emit({ ...output("from the earlier run"), runId: firstRun });
        client.emit({ ...end, runId: firstRun });

        expect(a.io.output).toEqual([]);
        expect(b.io.output).toEqual([]);
        expect(a.runner.state).toBe(RunState.Ready);
        expect(b.runner.state).toBe(RunState.Running);

        client.emit(end);
        client.finishRun();
        await runningB;
        runtime.dispose();
    });

    it("change no run state for package installs from outside a run", async () => {
        const client = fakeClient();
        const { runtime, a, b } = await sharing(() => client);
        const seenByB = vi.fn();
        b.events.subscribe(BackendEventType.Loading, seenByB);
        const running = a.runner.start();
        await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
        client.emit(start);

        client.emit({ ...loading("loading"), runId: undefined });

        expect(seenByB).toHaveBeenCalledOnce();
        expect(a.runner.state).toBe(RunState.Running);
        expect(a.runner.loadingPackages).toEqual([]);
        expect(b.runner.loadingPackages).toEqual([]);

        client.emit(end);
        client.finishRun();
        await running;
        runtime.dispose();
    });

    it("show package installs from outside a run on a private runtime", async () => {
        const client = fakeClient();
        const papyros = new Papyros();
        papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
        await papyros.runner.launch();

        client.emit({ ...loading("loading"), runId: undefined });
        expect(papyros.runner.loadingPackages).toEqual(["numpy"]);
        expect(papyros.runner.state).toBe(RunState.Loading);
        expect(papyros.runner.stateMessage).toContain("numpy");

        client.emit({ ...loading("loaded"), runId: undefined });
        expect(papyros.runner.loadingPackages).toEqual([]);
        expect(papyros.runner.state).toBe(RunState.Ready);
        papyros.dispose();
    });
});

type RunIdOf = "the current run" | "the latest run, ended" | "an earlier run" | "no run";

/**
 * Which instances receive an event of the worker, by the run its id belongs to. Instance a
 * started every run; on a shared runtime, b shares the worker without running anything.
 */
// prettier-ignore
const routes: [runtime: "shared" | "private", runId: RunIdOf, output: string, files: string, loading: string][] = [
    // runtime   id of                     Output  Files  Loading
    ["shared",  "the current run",         "a",    "a",   "a b"],
    ["shared",  "the latest run, ended",   "a",    "a",   "a b"],
    ["shared",  "an earlier run",          "",     "",    ""],
    ["shared",  "no run",                  "",     "",    "a b"],
    ["private", "the current run",         "a",    "a",   "a"],
    ["private", "the latest run, ended",   "a",    "a",   "a"],
    ["private", "an earlier run",          "",     "",    ""],
    ["private", "no run",                  "a",    "a",   "a"],
];

const routedEvents: BackendEvent[] = [
    output("x"),
    {
        type: BackendEventType.Files,
        data: { "x.txt": { content: "", binary: false } },
        contentType: "application/json",
    },
    loading("loading"),
];

describe("A runtime routing the events of its worker", () => {
    it.each(
        routes.flatMap(([runtime, runId, ...receivers]) =>
            routedEvents.map((event, i) => ({ runtime, runId, event, type: event.type, receivers: receivers[i] })),
        ),
    )(
        "on a $runtime runtime, hands $type with the id of $runId to [$receivers]",
        async ({ runtime, runId, event, receivers }) => {
            const client = fakeClient();
            let instances: Papyros[];
            if (runtime === "shared") {
                const shared = await sharing(() => client);
                instances = [shared.a, shared.b];
            } else {
                const papyros = new Papyros();
                papyros.runner.registerBackend(ProgrammingLanguage.Python, () => client);
                await papyros.runner.launch();
                instances = [papyros];
            }
            const a = instances[0];

            const first = a.runner.start();
            await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalled());
            const firstId = client.runId;
            if (runId === "the latest run, ended" || runId === "an earlier run") {
                client.finishRun();
                await first;
            }
            if (runId === "an earlier run") {
                void a.runner.start();
                await vi.waitFor(() => expect(client.workerProxy.runCode).toHaveBeenCalledTimes(2));
            }

            const received: string[] = [];
            instances.forEach((p, i) => p.events.subscribe(event.type, () => received.push(i === 0 ? "a" : "b")));
            client.emit({ ...event, runId: runId === "no run" ? undefined : firstId });

            expect(received.join(" ")).toBe(receivers);
            instances.forEach((p) => p.dispose());
            a.runtime.dispose();
        },
    );
});

/**
 * mulberry32: a tiny seeded PRNG, so a failing sequence can be replayed from its seed
 */
function seededRandom(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * A fakeClient that keeps track of the run in the worker: whether runCode is pending and
 * whether its code has started. An interrupt ends that run the way Python does after a
 * KeyboardInterrupt, and a restart fails it as interrupted.
 */
function modelClient(): any {
    const fake = fakeClient();
    fake.pending = false;
    fake.begun = false;
    fake.runIds = [];
    fake.workerProxy.runCode = vi.fn(
        (code: string, mode: RunMode, maxSteps: number, runId: number) =>
            new Promise<void>((resolve) => {
                fake.runId = runId;
                fake.runIds.push(runId);
                fake.pending = true;
                fake.begun = false;
                fake.resolveRun = () => {
                    fake.pending = false;
                    resolve();
                };
            }),
    );
    // The workers restart() replaced, with the last run each of them was given
    fake.replaced = [];
    fake.restart.mockImplementation(() => {
        fake.replaced.push({ callback: fake.callback, runId: fake.runIds.at(-1) });
        fake.pending = false;
        fake.worker = {};
        fake.runId = undefined;
        fake.rejectRun?.({ type: "InterruptError" });
    });
    fake.endRun = () => {
        if (fake.pending) {
            fake.emit(end);
            fake.finishRun();
        }
    };
    return fake;
}

/**
 * Wait for one macrotask, so pending promise chains run. Unlike setTimeout, a message
 * is not clamped to 4 ms when it is scheduled over and over.
 */
const settle = (): Promise<void> =>
    new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        channel.port2.postMessage(null);
    });

/**
 * Drive two instances on one shared runtime through a random sequence of actions and
 * events, and check after every step that the run state of each instance is consistent
 * with which instance holds the runtime. Events without a run id and events of an
 * earlier run must not change the state of any instance at all.
 */
async function explore(seed: number, steps: number): Promise<void> {
    const random = seededRandom(seed);
    const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
    const log: string[] = [];
    const problems: string[] = [];
    const pending: { label: string; settled: boolean }[] = [];
    // The runs whose owner called stop() or provideInput() while they were in progress
    const stopped = new Set<Run>();
    const answered = new Set<Run>();

    const client = modelClient();
    const runtime = new PapyrosRuntime();
    runtime.registerBackend(ProgrammingLanguage.Python, () => client);
    const instances: Papyros[] = [new Papyros({ runtime }), new Papyros({ runtime })];
    const names = new Map<Papyros, string>([
        [instances[0], "A"],
        [instances[1], "B"],
    ]);
    let generation = 0;
    await Promise.all(instances.map((p) => p.runner.launch()));

    client.interrupt.mockImplementation(async () => {
        const run = runtime.currentRun;
        if (!run || !stopped.has(run)) {
            problems.push(
                `interrupted ${run ? `the run of ${names.get(run.owner)}` : "no run"}, which its owner did not stop`,
            );
        }
        await Promise.resolve();
        client.endRun();
    });
    client.writeMessage.mockImplementation(async () => {
        const run = runtime.currentRun;
        if (!run || !answered.has(run)) {
            problems.push(
                `wrote input to ${run ? `the run of ${names.get(run.owner)}` : "no run"}, which its owner did not answer`,
            );
        }
    });

    const track = (label: string, promise: Promise<unknown>): void => {
        const entry = { label, settled: false };
        pending.push(entry);
        promise.then(
            () => (entry.settled = true),
            (error) => {
                entry.settled = true;
                problems.push(`${label} rejected: ${error}`);
            },
        );
    };

    const snapshot = (): string =>
        JSON.stringify(
            instances.map((p) => {
                const debug = p.debugger as any;
                return [
                    p.runner.state,
                    p.runner.stateMessage,
                    p.runner.loadingPackages,
                    p.io.output.length,
                    p.io.awaitingInput,
                    p.io.files.length,
                    debug.active,
                    debug.runActive,
                    debug.activeFrame,
                    debug.fileHistory.length,
                ];
            }),
        );
    const emitWithoutEffect = (e: BackendEvent, description: string, send = client.emit): void => {
        const before = snapshot();
        send(e);
        if (snapshot() !== before) {
            problems.push(`${description} changed ${before} into ${snapshot()}`);
        }
    };
    const staleEvents: BackendEvent[] = [
        output("stale"),
        start,
        end,
        { type: BackendEventType.Input, data: "", contentType: "text/plain" },
        loading("loading"),
        {
            type: BackendEventType.Files,
            data: { "stale.txt": { content: "", binary: false } },
            contentType: "application/json",
        },
    ];
    const strayEvents: BackendEvent[] = staleEvents
        .filter((e) => e.type !== BackendEventType.Loading)
        .concat([
            { type: BackendEventType.Error, data: "stray", contentType: "text/plain" },
            { type: BackendEventType.Interrupt, data: "KeyboardInterrupt", contentType: "text/plain" },
        ]);

    const actions: Record<string, (p: Papyros, name: string) => void> = {
        start: (p, name) => track(`${name}.start()`, p.runner.start()),
        stop: (p, name) => {
            if (runtime.currentRun?.owner === p) {
                stopped.add(runtime.currentRun);
            }
            track(`${name}.stop()`, p.runner.stop());
        },
        provideInput: (p, name) => {
            if (runtime.currentRun?.owner === p) {
                answered.add(runtime.currentRun);
            }
            track(`${name}.provideInput()`, p.runner.provideInput("x"));
        },
        lint: () => {
            const e = loading(pick(["loading", "loaded", "failed"]), [pick(["numpy", "pandas", "sympy"])]);
            emitWithoutEffect({ ...e, runId: undefined }, "a lint event");
        },
        stale: () => {
            // Every id before the latest one runCode saw is older than the latest run
            const earlier = client.runIds.slice(0, -1);
            if (earlier.length > 0) {
                emitWithoutEffect({ ...pick(staleEvents), runId: pick(earlier) }, "an event of an earlier run");
            }
        },
        late: () => {
            if (client.pending) {
                client.emit(output("late"));
            } else {
                // Only code that outlived its run, such as an asyncio task, emits now
                emitWithoutEffect({ ...pick(strayEvents), runId: undefined }, "an event from outside a run");
            }
        },
        begin: () => {
            if (client.pending && !client.begun) {
                client.begun = true;
                client.emit(start);
            }
        },
        input: () => {
            if (client.pending && client.begun) {
                client.emit({ type: BackendEventType.Input, data: "", contentType: "text/plain" });
            }
        },
        end: () => client.endRun(),
        restart: () => runtime.restartWorker(ProgrammingLanguage.Python),
        replaced: () => {
            if (client.replaced.length > 0) {
                const worker: { callback: (e: BackendEvent) => void; runId: number } = pick(client.replaced);
                emitWithoutEffect(
                    { ...pick(staleEvents), runId: worker.runId },
                    "an event of a replaced worker",
                    worker.callback,
                );
            }
        },
        recreate: (p, name) => {
            p.dispose();
            const fresh = new Papyros({ runtime });
            instances[instances.indexOf(p)] = fresh;
            names.set(fresh, `${name[0]}${++generation}`);
            track(`${names.get(fresh)}.launch()`, fresh.runner.launch());
        },
    };
    // Weights favour the actions that move a run along over the disruptive ones
    const schedule = [
        ...Array(4).fill("start"),
        ...Array(2).fill("stop"),
        "provideInput",
        ...Array(4).fill("lint"),
        ...Array(2).fill("stale"),
        "late",
        ...Array(3).fill("begin"),
        "input",
        ...Array(3).fill("end"),
        "restart",
        "replaced",
        "recreate",
    ];

    const check = (): void => {
        const running = runtime.currentRun?.owner;
        if (running && !instances.includes(running)) {
            problems.push("a disposed instance holds the runtime");
        }
        for (const p of instances) {
            if (runtime.isRunning(p)) {
                continue;
            }
            const { state, loadingPackages } = p.runner;
            if (state === RunState.Running || state === RunState.AwaitingInput) {
                problems.push(`${names.get(p)} is ${state} without holding the runtime`);
            }
            if (loadingPackages.length > 0) {
                problems.push(`${names.get(p)} tracks packages [${loadingPackages}] without holding the runtime`);
            }
        }
    };

    const fail = (): never => {
        throw new Error(`seed ${seed}:\n${problems.join("\n")}\nsteps:\n${log.join("\n")}`);
    };

    try {
        for (let step = 0; step < steps; step++) {
            const action = pick(schedule);
            const index = random() < 0.5 ? 0 : 1;
            const p = instances[index];
            const name = names.get(p)!;
            log.push(`${step}: ${action} ${name}`);
            actions[action](p, name);
            // Sometimes the next step lands before the promises of this one have moved on
            if (random() < 0.3) {
                continue;
            }
            await settle();
            check();
            if (problems.length > 0) {
                fail();
            }
        }

        // Let every run end, so only a run that can never finish keeps its promise open
        const deadline = Date.now() + 7000;
        while (pending.some((entry) => !entry.settled) && Date.now() < deadline) {
            client.endRun();
            await new Promise((resolve) => setTimeout(resolve, 20));
        }
        for (const entry of pending.filter((e) => !e.settled)) {
            problems.push(`${entry.label} never settled`);
        }
        check();
        // With every launch settled, Loading would mean a run or launch left it behind
        for (const p of instances) {
            const state = p.runner.state;
            if (!runtime.isRunning(p) && state !== RunState.Ready && state !== RunState.Error) {
                problems.push(`${names.get(p)} is left ${state} without a run`);
            }
        }
        if (problems.length > 0) {
            fail();
        }
    } finally {
        runtime.dispose();
    }
}

describe.sequential("Papyros instances sharing a runtime, driven by random sequences", () => {
    // Each of these seeds fails when any one of these checks is taken out: the dropping of
    // earlier run ids and of events without an id in dispatch(), the Loading filter of the
    // Runner, the checks after the awaits in stop() and provideInput(), detach() giving up the
    // run, and ignoring a replaced worker
    for (const seed of [35, 108]) {
        it(`keep their run state consistent for seed ${seed}`, () => explore(seed, 300), 30000);
    }
});
