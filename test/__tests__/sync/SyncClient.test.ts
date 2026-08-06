import { describe, expect, it } from "vitest";
import { InterruptError, SyncClient } from "../../../src/sync/SyncClient";
import { makeServiceWorkerChannel } from "../../../src/sync/channel";

function idleClient(): SyncClient {
    const url = URL.createObjectURL(new Blob([""], { type: "text/javascript" }));
    return new SyncClient(() => new Worker(url), makeServiceWorkerChannel());
}

describe("SyncClient", () => {
    it("starts idle with a worker", () => {
        const client = idleClient();
        expect(client.state).toBe("idle");
        expect(client.worker).toBeInstanceOf(Worker);
        client.terminate();
    });

    it("refuses a second concurrent call", async () => {
        const client = idleClient();
        client.state = "running";
        await expect(client.call(async () => undefined)).rejects.toThrow("State is running, not idle");
        client.terminate();
    });

    it("refuses to write a message when no call is active", async () => {
        const client = idleClient();
        await expect(client.writeMessage("hello")).rejects.toThrow("No active call to send a message to.");
        client.terminate();
    });

    it("ignores an interrupt while idle", async () => {
        const client = idleClient();
        const worker = client.worker;
        await client.interrupt();
        expect(client.state).toBe("idle");
        expect(client.worker).toBe(worker);
        client.terminate();
    });

    it("replaces the worker when interrupting a run that is not waiting for input", async () => {
        const client = idleClient();
        const worker = client.worker;
        client.state = "running";
        await client.interrupt();
        expect(client.state).toBe("idle");
        expect(client.worker).not.toBe(worker);
        client.terminate();
    });

    it("rejects the in-flight call with an InterruptError when terminated", async () => {
        const client = idleClient();
        const call = client.call(() => new Promise(() => undefined));
        await Promise.resolve();
        client.terminate();
        await expect(call).rejects.toBeInstanceOf(InterruptError);
    });
});
