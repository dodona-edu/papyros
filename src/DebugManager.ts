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
    addListener,
    t
} from "./util/Util";

/**
 * Component for displaying code output or errors to the user
 */
export class DebugManager extends Renderable {
    /**
     * The last generated codetrace
    */
    private trace: object;
    private curInstr: number;
    private visualizer: ExecutionVisualizer;

    constructor() {
        super();
        BackendManager.subscribe(BackendEventType.CompletedTraceGeneration,
            e => this.onVisualization(e));
        BackendManager.subscribe(BackendEventType.End, () => this.onStop());
        BackendManager.subscribe(BackendEventType.TakeVisualizeStep, e => this.takeStep(e.data));
        this.visualizer = undefined;
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
            this.visualizer = new ExecutionVisualizer(VISUALIZE_AREA_ID, this.trace, {
                startingInstruction: this.curInstr,
                updateOutputCallback: this.onOutputCallback.bind(this),
                hideCode: true
            });
            addListener(VISUALIZE_AREA_ID, () => this.visualizer.redrawConnectors(), "scroll");
            window.addEventListener("resize", () => this.visualizer.redrawConnectors());
        } else {
            renderWithOptions(options, `
            `);
        }
    }

    /**
     * @param {event} event A endVisualization event with the codetrace in the data.
     */
    private onVisualization(event: BackendEvent): void {
        this.trace = event.data;
        this.render();
    }

    private onStop(): void {
        if (this.visualizer !== undefined) {
            BackendManager.publish({
                type: BackendEventType.ClearOutput,
                contentType: "text/plain",
                data: "Clearing the output"
            });
            BackendManager.publish({
                type: BackendEventType.Output,
                data: this.trace!["trace"]!.at(-1).stdout, contentType: "text/plain"
            });
            this.trace = undefined;
            this.visualizer = undefined;
            this.curInstr = 0;
            this.render();
        }
    }

    /**
     * method that gets called every time a step is taken in the ExecutionVisualizer
     * @param {visualization} visualization the ExecutionVisualizer curruntly in use
     */
    private onOutputCallback(visualization: ExecutionVisualizer): void {
        console.log("Hit");
        this.curInstr = visualization.curInstr;
        this.visualizer = visualization;
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
        this.visualizer = undefined;
        this.curInstr = 0;
    }

    /**
     * Method to jump to the given step
     * @param {step} step the step to go to, 0-index based
     */
    public takeStep(step: number): void {
        let curStep = step;
        console.log(curStep);
        if (this.visualizer !== undefined) {
            if (step < 0) {
                curStep = 0;
            } else if (step >= this.visualizer.curTrace.length) {
                curStep = this.visualizer.curTrace.length - 1;
            }
            this.visualizer.renderStep(curStep);
            this.render();
        }
    }

    public getStep(): number {
        return this.curInstr;
    }

    public getTrace(): object {
        return this.trace;
    }
}
