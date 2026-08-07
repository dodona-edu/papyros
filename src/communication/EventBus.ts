import { BackendEvent, BackendEventType } from "./BackendEvent";

/**
 * Callback type definition for subscribers
 * @param {BackendEvent} e The published event
 */
export type BackendEventListener = (e: BackendEvent) => void;

/**
 * Delivers events published by a backend to the state objects of one Papyros
 * instance. Each instance owns its own bus, so two instances on the same page
 * never see each other's events.
 */
export class EventBus {
    /**
     * Map an event type to interested subscribers
     * Uses an Array to maintain order of subscription
     */
    private subscribers: Map<BackendEventType, Array<BackendEventListener>> = new Map();

    /**
     * Register a callback for when an event of a certain type is published
     * @param {BackendEventType} type The type of event to subscribe to
     * @param {BackendEventListener} subscriber Callback for when an event
     * of the given type is published
     * @return {Function} Unsubscribes the callback when called
     */
    public subscribe(type: BackendEventType, subscriber: BackendEventListener): () => void {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, []);
        }
        const subscribers = this.subscribers.get(type)!;
        if (!subscribers.includes(subscriber)) {
            subscribers.push(subscriber);
        }
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Publish an event, notifying all listeners for its type
     * @param {BackendEvent} e The event to publish
     */
    public publish(e: BackendEvent): void {
        this.subscribers.get(e.type)?.forEach((cb) => cb(e));
    }
}
