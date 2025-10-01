import { SyncExtras } from "comsync";
import { Backend, WorkerDiagnostic } from "../../src/backend/Backend";
import { BackendEventType } from "../../src/communication/BackendEvent";
import { vi } from "vitest";

/**
 * Implementation of a JavaScript backend for Papyros
 * by using eval and overriding some builtins
 */
export class MockBackend extends Backend<SyncExtras> {
    constructor() {
        super();
        this.runCode = vi.fn(this.runCode);
        this.lintCode = vi.fn(this.lintCode);
    }

    protected syncExpose() {
        return (f: any) => f;
    }

    override runCode(extras: SyncExtras, code: string): Promise<any> {
        this.extras = extras;
        this.onEvent({
            type: BackendEventType.Output,
            data: `Running code: ${code}`, contentType: "text/plain"
        });
        return Promise.resolve();
    }

    override async lintCode(code: string): Promise<Array<WorkerDiagnostic>> {
        this.onEvent({
            type: BackendEventType.Output,
            data: `Linting code: ${code}`, contentType: "text/plain"
        });
        return Promise.resolve([]);
    }
}
