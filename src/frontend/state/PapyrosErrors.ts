export class PapyrosError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = this.constructor.name;
    }
}

export class PapyrosLaunchError extends PapyrosError {}
export class ServiceWorkerRegistrationError extends PapyrosError {}
export class ServiceWorkerInputError extends PapyrosError {}
