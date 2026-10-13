import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { RunState } from "../../../src/frontend/state/Runner";
import { ServiceWorkerRegistrationError } from "../../../src/frontend/state/PapyrosErrors";

const serviceWorkerProperty = Object.getOwnPropertyDescriptor(Navigator.prototype, "serviceWorker")!;

// A Papyros that needs a channel at launch, so it cannot defer to JSPI
function papyrosNeedingChannel(): { papyros: Papyros; errorHandler: ReturnType<typeof vi.fn> } {
    const papyros = new Papyros();
    papyros.runner.allowJspi = false;
    const errorHandler = vi.fn();
    papyros.setErrorHandler(errorHandler);
    return { papyros, errorHandler };
}

// Browsers such as in-app browsers on iOS have neither SharedArrayBuffer nor service workers
function removeServiceWorkerApi(): void {
    delete (Navigator.prototype as { serviceWorker?: unknown }).serviceWorker;
}

describe("browser without the Service Worker API", () => {
    let alert: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.stubGlobal("SharedArrayBuffer", undefined);
        alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    });

    afterEach(() => {
        Object.defineProperty(Navigator.prototype, "serviceWorker", serviceWorkerProperty);
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("tells the user to switch browsers without reporting an error", async () => {
        removeServiceWorkerApi();
        expect("serviceWorker" in navigator).toBe(false);
        expect(isSecureContext).toBe(true);
        const { papyros, errorHandler } = papyrosNeedingChannel();

        await papyros.launch();

        const message = papyros.i18n.t("Papyros.service_worker_unsupported");
        expect(message).toMatch(/Safari/);
        expect(errorHandler).not.toHaveBeenCalled();
        expect(papyros.runner.state).toBe(RunState.Error);
        expect(papyros.runner.stateMessage).toBe(message);
        expect(alert).toHaveBeenCalledExactlyOnceWith(message);
        expect(papyros.channel).toBeNull();
    });

    it("does not report a missing channel when a backend asks for one", async () => {
        removeServiceWorkerApi();
        const { papyros, errorHandler } = papyrosNeedingChannel();

        expect(await papyros.ensureChannel()).toBe(false);
        expect(errorHandler).not.toHaveBeenCalled();
    });

    it("reports an insecure context and asks for HTTPS", async () => {
        // Browsers hide the Service Worker API outside a secure context
        removeServiceWorkerApi();
        vi.stubGlobal("isSecureContext", false);
        const { papyros, errorHandler } = papyrosNeedingChannel();

        await papyros.launch();

        expect(errorHandler).toHaveBeenCalledOnce();
        const error = errorHandler.mock.calls[0][0];
        expect(error).toBeInstanceOf(ServiceWorkerRegistrationError);
        expect(error.message).toMatch(/secure context/);
        const message = papyros.i18n.t("Papyros.insecure_context_error");
        expect(message).toMatch(/HTTPS/);
        expect(papyros.runner.state).toBe(RunState.Error);
        expect(papyros.runner.stateMessage).toBe(message);
        expect(alert).toHaveBeenCalledExactlyOnceWith(message);
    });

    it("still reports a missing service worker name", async () => {
        const { papyros, errorHandler } = papyrosNeedingChannel();
        papyros.serviceWorkerName = "";

        await papyros.launch();

        expect(errorHandler).toHaveBeenCalledOnce();
        expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(ServiceWorkerRegistrationError);
        const message = papyros.i18n.t("Papyros.service_worker_error");
        expect(papyros.runner.state).toBe(RunState.Error);
        expect(papyros.runner.stateMessage).toBe(message);
        expect(alert).toHaveBeenCalledExactlyOnceWith(message);
    });
});
