import { Backend } from "../backend/Backend";
import { ProgrammingLanguage } from "../ProgrammingLanguage";
import { SyncClient } from "../sync/SyncClient";

/**
 * Static registry mapping programming languages to backend worker factories.
 *
 * Only configuration lives here: the clients themselves are created per Papyros
 * instance and owned by its Runner, so instances never share a worker.
 */
export abstract class BackendManager {
    /**
     * Map programming languages to Backend constructors
     */
    private static createBackendMap: Map<ProgrammingLanguage, () => SyncClient<Backend>> = new Map();

    /**
     * @param {ProgrammingLanguage} language The language to support
     * @param {Function} backendCreator The constructor for a SyncClient
     */
    public static registerBackend(language: ProgrammingLanguage, backendCreator: () => SyncClient<Backend>): void {
        BackendManager.createBackendMap.set(language, backendCreator);
    }

    /**
     * Create a fresh backend client for the given language
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {SyncClient<Backend>} A SyncClient for the Backend
     */
    public static createBackend(language: ProgrammingLanguage): SyncClient<Backend> {
        const creator = this.createBackendMap.get(language);
        if (!creator) {
            throw new Error(`${language} is not yet supported.`);
        }
        return creator();
    }

    /**
     * Remove a backend for the given language
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {boolean} Whether the remove operation had any effect
     */
    public static removeBackend(language: ProgrammingLanguage): boolean {
        return this.createBackendMap.delete(language);
    }

    static {
        BackendManager.registerBackend(
            ProgrammingLanguage.Python,
            () =>
                new SyncClient<Backend>(
                    () =>
                        new Worker(new URL("../backend/workers/python/worker", import.meta.url), {
                            type: "module",
                        }),
                ),
        );
        BackendManager.registerBackend(
            ProgrammingLanguage.JavaScript,
            () =>
                new SyncClient<Backend>(
                    () =>
                        new Worker(new URL("../backend/workers/javascript/worker", import.meta.url), {
                            type: "module",
                        }),
                ),
        );
    }
}
