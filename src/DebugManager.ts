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
    constructor() {
        super();
        BackendManager.subscribe(BackendEventType.EndVisualization, e => this.onVisualization(e));
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
        ${renderLabel(t("Papyros.visualization"), DEBUG_AREA_ID)}
        <div id=${VISUALIZE_AREA_ID} class="
        _tw-px-10 _tw-pt-6 _tw-h-full" style="overflow: auto;">
        </div>
        `);
        // Restore previously rendered items
    }

    private onVisualization(event: BackendEvent): void {
        const visualizer = new ExecutionVisualizer(VISUALIZE_AREA_ID, event.data, {
        });
    }
}
