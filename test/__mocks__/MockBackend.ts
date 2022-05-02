import { CompletionResult } from "@codemirror/autocomplete";
import { SyncExtras } from "comsync";
import { Backend, WorkerAutocompleteContext, WorkerDiagnostic } from "../../src/Backend";
import { BackendEventType } from "../../src/BackendEvent";

/**
 * Implementation of a JavaScript backend for Papyros
 * by using eval and overriding some builtins
 */
export class MockBackend extends Backend<SyncExtras> {
    constructor() {
        super();
        this.autocomplete = jest.fn(this.autocomplete);
        this.runCode = jest.fn(this.runCode);
        this.lintCode = jest.fn(this.lintCode);
    }

    protected syncExpose() {
        return (f: any) => f;
    }

    override async autocomplete(context: WorkerAutocompleteContext):
        Promise<CompletionResult | null> {
        this.onEvent({
            type: BackendEventType.Output,
            data: "Autocompleting code", contentType: "text/plain"
        });
        return { validFor: /^[\w$]*$/, options: [], from: context.pos };
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
