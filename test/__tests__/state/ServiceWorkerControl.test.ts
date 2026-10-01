import { afterEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ServiceWorkerRegistrationError } from "../../../src/frontend/state/PapyrosErrors";
import { CLAIM_CLIENTS_MESSAGE } from "../../../src/communication/InputWorker";

/**
 * Replace the service worker container with one whose active worker does not control the
 * page, as after a hard reload. The worker claims the page when asked, if `claims` is set.
 */
function stubUncontrolledPage(claims: boolean): ReturnType<typeof vi.fn> {
    const container = Object.assign(new EventTarget(), { controller: null as object | null });
    const postMessage = vi.fn(() => {
        if (claims) {
            setTimeout(() => {
                container.controller = {};
                container.dispatchEvent(new Event("controllerchange"));
            });
        }
    });
    const registration = { scope: `${location.origin}/`, active: { postMessage } };
    Object.assign(container, {
        register: vi.fn().mockResolvedValue(registration),
        ready: Promise.resolve(registration),
    });
    Object.defineProperty(navigator, "serviceWorker", { value: container, configurable: true });
    return postMessage;
}

describe("service worker control", () => {
    afterEach(() => {
        delete (navigator as { serviceWorker?: unknown }).serviceWorker;
        vi.useRealTimers();
    });

    it("asks the service worker to claim a page it does not control", async () => {
        const postMessage = stubUncontrolledPage(true);
        const papyros = new Papyros();
        papyros.serviceWorkerName = "claims.js";

        expect(await papyros.ensureChannel()).toBe(true);
        expect(postMessage).toHaveBeenCalledWith(CLAIM_CLIENTS_MESSAGE);
        expect(papyros.channel?.type).toBe("serviceWorker");
    });

    it("reports a page that stays uncontrolled instead of building a channel", async () => {
        vi.useFakeTimers();
        stubUncontrolledPage(false);
        const papyros = new Papyros();
        papyros.serviceWorkerName = "never-claims.js";
        const errorHandler = vi.fn();
        papyros.setErrorHandler(errorHandler);

        const channel = papyros.ensureChannel();
        await vi.advanceTimersByTimeAsync(5000);

        expect(await channel).toBe(false);
        expect(papyros.channel).toBeNull();
        const error = errorHandler.mock.calls[0][0];
        expect(error).toBeInstanceOf(ServiceWorkerRegistrationError);
        expect((error.cause as Error).message).toMatch(/reloading the page/);
    });
});
