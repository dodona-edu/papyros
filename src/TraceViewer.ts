import {Renderable, RenderOptions, renderWithOptions} from "./util/Rendering";
import {getElement} from "./util/Util";
import {TraceComponent} from "@dodona/trace-component";
import {BackendManager} from "./BackendManager";
import {BackendEventType} from "./BackendEvent";
import "@dodona/trace-component";
import {Trace} from "@dodona/trace-component/dist/trace_types";

const TRACE_COMPONENT_ID = "trace-component";

export class TraceViewer extends Renderable<RenderOptions> {
    private trace: Trace = [];

    constructor() {
        super();
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
                    <tc-trace id="${TRACE_COMPONENT_ID}"></tc-trace>
        `);

        const traceComponent = getElement(TRACE_COMPONENT_ID) as TraceComponent;
        BackendManager.subscribe(BackendEventType.Trace, e => {
            this.trace = JSON.parse(e.data).trace;
            traceComponent.trace = this.trace;
        });

        traceComponent.addEventListener("frame-change", e => {
            const frame = (e as CustomEvent).detail.frame;
            const line = this.trace[frame].line;
            BackendManager.publish({
                type: BackendEventType.Line,
                data: line
            });
        });
    }
}
