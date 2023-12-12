import {Renderable, RenderOptions, renderWithOptions} from "./util/Rendering";
import {getElement} from "./util/Util";
import {TraceComponent} from "@dodona/trace-component";
import {BackendManager} from "./BackendManager";
import {BackendEventType} from "./BackendEvent";
import "@dodona/trace-component";

const TRACE_COMPONENT_ID = "trace-component";

export class TraceViewer extends Renderable<RenderOptions> {
    constructor() {
        super();
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
                    <tc-trace id="${TRACE_COMPONENT_ID}"></tc-trace>
        `);

        const traceComponent = getElement(TRACE_COMPONENT_ID) as TraceComponent;
        BackendManager.subscribe(BackendEventType.Trace, e => {
            traceComponent.trace = JSON.parse(e.data).trace;
        });
    }
}
