export class PapyrosError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = this.constructor.name;
    }
}

export class PapyrosLaunchError extends PapyrosError {}
/**
 * This browser lacks something Papyros needs, so a retry or a bug fix in Papyros will not help
 */
export class UnsupportedBrowserError extends PapyrosError {}
export class ServiceWorkerRegistrationError extends PapyrosError {}
export class ServiceWorkerInputError extends PapyrosError {}
