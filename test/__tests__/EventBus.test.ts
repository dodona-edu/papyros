import { EventBus } from "../../src/communication/EventBus";
import { BackendEvent, BackendEventType } from "../../src/communication/BackendEvent";
import { describe, expect, it, vi } from "vitest";

const output = (data: string): BackendEvent => ({ type: BackendEventType.Output, data, contentType: "text/plain" });

describe("EventBus", () => {
    it("delivers events to subscribers of their type", () => {
        const bus = new EventBus();
        const onOutput = vi.fn();
        const onError = vi.fn();
        bus.subscribe(BackendEventType.Output, onOutput);
        bus.subscribe(BackendEventType.Error, onError);

        bus.publish(output("hello"));

        expect(onOutput).toHaveBeenCalledWith(output("hello"));
        expect(onError).not.toHaveBeenCalled();
    });

    it("subscribes a listener only once", () => {
        const bus = new EventBus();
        const listener = vi.fn();
        bus.subscribe(BackendEventType.Output, listener);
        bus.subscribe(BackendEventType.Output, listener);

        bus.publish(output("once"));

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("stops delivering after unsubscribing", () => {
        const bus = new EventBus();
        const listener = vi.fn();
        const unsubscribe = bus.subscribe(BackendEventType.Output, listener);

        bus.publish(output("first"));
        unsubscribe();
        bus.publish(output("second"));

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("keeps instances isolated from each other", () => {
        const first = new EventBus();
        const second = new EventBus();
        const listener = vi.fn();
        first.subscribe(BackendEventType.Output, listener);

        second.publish(output("elsewhere"));

        expect(listener).not.toHaveBeenCalled();
    });
});
