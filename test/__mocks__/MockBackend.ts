import { SyncExtras } from "comsync";
import { Backend, WorkerDiagnostic } from "../../src/backend/Backend";
import { BackendEventType } from "../../src/communication/BackendEvent";

/**
 * Implementation of a JavaScript backend for Papyros
 * by using eval and overriding some builtins
 */
export class MockBackend extends Backend<SyncExtras> {
    constructor() {
        super();
        this.runCode = jest.fn(this.runCode);
        this.lintCode = jest.fn(this.lintCode);
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
