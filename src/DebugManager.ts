import {
    Renderable,
    renderLabel,
    RenderOptions, renderWithOptions
} from "./util/Rendering";
import { DEBUG_AREA_ID, VISUALIZE_AREA_ID } from "./Constants";
import { BackendManager } from "./BackendManager";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { ExecutionVisualizer } from "./pytutor";
import {
    t
} from "./util/Util";

/**
 * Component for displaying code output or errors to the user
 */
export class DebugManager extends Renderable {
    /**
     * The last generated codetrace
    */
    private trace: string;

    constructor() {
        super();
        BackendManager.subscribe(BackendEventType.EndVisualization, e => this.onVisualization(e));
    }

    protected override _render(options: RenderOptions): void {
        if (this.trace !== undefined) {
            renderWithOptions(options, `
            ${renderLabel(t("Papyros.visualization"), DEBUG_AREA_ID)}
            <div id=${VISUALIZE_AREA_ID} class="
            _tw-px-10 _tw-pt-6 _tw-h-full" style="overflow: auto;">
            </div>
            `);
            new ExecutionVisualizer(VISUALIZE_AREA_ID, this.trace, {
                updateOutputCallback: this.onOutputCallback,
                executeCodeWithRawInputFunc: undefined
            });
        }
        // Restore previously rendered items
    }

    /**
     * @param {event} event A endVisualization event with the codetrace in the data.
     */
    private onVisualization(event: BackendEvent): void {
        this.trace = event.data;
        this.render();
    }

    /**
     * method that gets called every time a step is taken in the ExecutionVisualizer
     * @param {visualization} visualization the ExecutionVisualizer curruntly in use
     */
    private onOutputCallback(visualization: ExecutionVisualizer): void {
        const curInstr = visualization.curInstr;
        // Delete the current output
        BackendManager.publish({
            type: BackendEventType.ClearOutput,
            contentType: "text/plain",
            data: "Clearing the output"
        });
        // Add the output from the current tracestep
        BackendManager.publish({
            type: BackendEventType.Output,
            data: visualization.curTrace[curInstr].stdout, contentType: "text/plain"
        });
    }

    /**
     * Method to clear the trace
     */
    public clearTrace(): void {
        this.trace = undefined;
    }
}
