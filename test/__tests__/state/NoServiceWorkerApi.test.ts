import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Papyros } from "../../../src/frontend/state/Papyros";
import { ServiceWorkerRegistrationError, UnsupportedBrowserError } from "../../../src/frontend/state/PapyrosErrors";
import { BackendFailure, BackendStatus } from "../../../src/frontend/state/Runner";

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

    it("reports an unsupported browser and tells the user to switch browsers", async () => {
        removeServiceWorkerApi();
        expect("serviceWorker" in navigator).toBe(false);
        expect(isSecureContext).toBe(true);
        const { papyros, errorHandler } = papyrosNeedingChannel();

        await papyros.launch();

        expect(errorHandler).toHaveBeenCalledOnce();
        const error = errorHandler.mock.calls[0][0];
        expect(error).toBeInstanceOf(UnsupportedBrowserError);
        expect(error.message).toMatch(/Service Worker API/);
        const message = papyros.i18n.t("Papyros.service_worker_unsupported");
        expect(message).toMatch(/Safari/);
        expect(message).toMatch(/private window/);
        expect(papyros.runner.backendStatus).toEqual({
            status: BackendStatus.Failed,
            reason: BackendFailure.NoServiceWorkerApi,
        });
        expect(papyros.runner.statusMessage).toBe(message);
        expect(alert).toHaveBeenCalledExactlyOnceWith(message);
        expect(papyros.channel).toBeNull();
    });

    it("reports an unsupported browser once when backends ask for a channel", async () => {
        removeServiceWorkerApi();
        const { papyros, errorHandler } = papyrosNeedingChannel();

        expect(await Promise.all([papyros.ensureChannel(), papyros.ensureChannel()])).toEqual([false, false]);
        expect(await papyros.ensureChannel()).toBe(false);

        expect(errorHandler).toHaveBeenCalledOnce();
        expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(UnsupportedBrowserError);
    });

    it("does not report an unsupported browser again after launch", async () => {
        removeServiceWorkerApi();
        const { papyros, errorHandler } = papyrosNeedingChannel();

        await papyros.launch();
        expect(await papyros.ensureChannel()).toBe(false);

        expect(errorHandler).toHaveBeenCalledOnce();
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
        expect(papyros.runner.backendStatus).toEqual({
            status: BackendStatus.Failed,
            reason: BackendFailure.InsecureContext,
        });
        expect(papyros.runner.statusMessage).toBe(message);
        expect(alert).toHaveBeenCalledExactlyOnceWith(message);
    });

    it("still reports a missing service worker name", async () => {
        const { papyros, errorHandler } = papyrosNeedingChannel();
        papyros.serviceWorkerName = "";

        await papyros.launch();

        expect(errorHandler).toHaveBeenCalledOnce();
        expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(ServiceWorkerRegistrationError);
        const message = papyros.i18n.t("Papyros.service_worker_error");
        expect(papyros.runner.backendStatus).toEqual({
            status: BackendStatus.Failed,
            reason: BackendFailure.ServiceWorkerError,
        });
        expect(papyros.runner.statusMessage).toBe(message);
        expect(alert).toHaveBeenCalledExactlyOnceWith(message);
    });
});
