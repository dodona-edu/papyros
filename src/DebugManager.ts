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
    private curInstr: number;

    constructor() {
        super();
        BackendManager.subscribe(BackendEventType.CompletedTraceGeneration,
            e => this.onVisualization(e));
        this.curInstr = 0;
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
                startingInstruction: this.curInstr,
                updateOutputCallback: this.onOutputCallback.bind(this),
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

    public getTrace(): string {
        return this.trace;
    }

    /**
     * method that gets called every time a step is taken in the ExecutionVisualizer
     * @param {visualization} visualization the ExecutionVisualizer curruntly in use
     */
    private onOutputCallback(visualization: ExecutionVisualizer): void {
        this.curInstr = visualization.curInstr;
        // Delete the current output
        BackendManager.publish({
            type: BackendEventType.ClearOutput,
            contentType: "text/plain",
            data: "Clearing the output"
        });
        BackendManager.publish({
            type: BackendEventType.VisualizeStep,
            contentType: "text/plain",
            data: {
                cur: visualization.curTrace[this.curInstr],
                executed: visualization.curTrace[this.curInstr - 1]
            }
        });
        // Add the output from the current tracestep
        BackendManager.publish({
            type: BackendEventType.Output,
            data: visualization.curTrace[this.curInstr].stdout, contentType: "text/plain"
        });

        const totalInstrs = visualization.curTrace.length;
        const isLastInstr = this.curInstr === (totalInstrs-1);

        if (visualization.promptForUserInput && isLastInstr) {
            console.log("Awaiting input");
        }
    }

    /**
     * Method to clear the trace
     */
    public clearTrace(): void {
        this.trace = undefined;
    }
}
