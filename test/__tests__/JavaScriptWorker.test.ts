import { describe, it, expect } from "vitest";
import { JavaScriptWorker } from "../../src/backend/workers/javascript/JavaScriptWorker";
import { BackendEvent, BackendEventType } from "../../src/communication/BackendEvent";
import { SyncExtras } from "../../src/sync/expose";

// Bypasses the SyncClient/expose plumbing so runCode can be driven directly in tests
class TestableJavaScriptWorker extends JavaScriptWorker {
    protected override expose() {
        return (f: any) => f;
    }
}

async function run(code: string): Promise<BackendEvent[]> {
    const events: BackendEvent[] = [];
    const worker = new TestableJavaScriptWorker();
    await worker.launch((e) => events.push(e), undefined);
    await worker.runCode({} as SyncExtras, code);
    return events;
}

function outputText(events: BackendEvent[]): string {
    return events
        .filter((e) => e.type === BackendEventType.Output)
        .map((e) => e.data)
        .join("");
}

function errorEvent(events: BackendEvent[]): BackendEvent | undefined {
    return events.find((e) => e.type === BackendEventType.Error);
}

describe("JavaScriptWorker", () => {
    it("logs null without crashing", async () => {
        const events = await run("console.log(null);");
        expect(outputText(events)).toBe("null\n");
        expect(errorEvent(events)).toBeUndefined();
    });

    it("logs undefined without crashing", async () => {
        const events = await run("console.log(undefined);");
        expect(outputText(events)).toBe("undefined\n");
        expect(errorEvent(events)).toBeUndefined();
    });

    it("logs plain objects without crashing", async () => {
        const events = await run("console.log({});");
        expect(outputText(events)).toBe("{}\n");
        expect(errorEvent(events)).toBeUndefined();
    });

    it("keeps the original stack trace of a thrown Error", async () => {
        const events = await run("function fail() { throw new Error('boom'); }\nfail();");
        const error = errorEvent(events);
        expect(error).toBeTruthy();
        expect(error!.data.what).toBe("boom");
        // the stack must still point at the throw site, not the worker's catch block
        expect(error!.data.traceback).toContain("fail");
    });

    it("reports a clean error when throwing null", async () => {
        const events = await run("throw null;");
        const error = errorEvent(events);
        expect(error).toBeTruthy();
        expect(error!.data.what).toBe("null");
    });

    it("reports a clean error when throwing a string", async () => {
        const events = await run("throw 'oops';");
        const error = errorEvent(events);
        expect(error).toBeTruthy();
        expect(error!.data.what).toBe("oops");
    });
});
