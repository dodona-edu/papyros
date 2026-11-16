import { html, nothing, ReactiveController, ReactiveControllerHost, TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { OutputEntry, OutputType } from "../../state/InputOutput";
import { BackendFailure, BackendStatus, RunOutcome, RunStatus } from "../../state/Runner";
import type { Papyros } from "../../state/Papyros";
import type { TurtlePatch } from "../../state/TurtleSvg";
import {
    renderError,
    renderImage,
    renderNoOutput,
    renderNoOutputStatus,
    renderOverflow,
    runFinishedWithoutOutput,
    shownOutput,
} from "../output/renderOutput";
import { HeightTransition } from "../motion";
import { FollowEnd } from "../output/followEnd";
import { renderTurtleImage, TurtleDrawing, TurtleImage } from "../output/turtle";

export interface OutputHost extends ReactiveControllerHost {
    readonly papyros: Papyros;
    readonly renderRoot: HTMLElement | DocumentFragment;
}

/** The output of the run, sorted into panels */
interface Panels {
    source: OutputEntry[];
    logBlocks: (TemplateResult | typeof nothing)[];
    errors: OutputEntry[];
    drawing: TurtleImage | undefined;
}

/** What the panels show besides the input row and the launch error */
interface View extends Panels {
    log: boolean;
    noOutput: boolean;
    /** The run's drawing or, until a run in progress draws, the blank canvas of the previous run */
    canvas: TurtleImage | undefined;
}

/** What the previous run showed when this one started */
interface PreviousRun {
    log: boolean;
    /** The height of the log's body, which the log keeps at least while the run is in progress */
    reservedHeight: number;
    /** Kept in place, blank, while the run is in progress */
    canvas: TurtleImage | undefined;
}

/**
 * The output side of a playground: the input row, the output log, the turtle drawing and the
 * error panels. Renders into the host's shadow root.
 */
export class PlaygroundOutput implements ReactiveController {
    private readonly followEnd: FollowEnd;
    private wasAwaitingInput = false;
    /** The input row holds focus and is about to go */
    private inputLeaving = false;

    private resizeHost?: HTMLElement;
    private resize?: HeightTransition;
    private resizing = false;
    /** What the panels showed at the previous render */
    private shown: unknown[] = [];

    // Keyed on `outputs` array identity: papyros hands out a fresh array on every change
    // and never mutates it in place.
    private panelsCache?: Panels;

    private readonly turtle = new TurtleDrawing();
    private previousRun: PreviousRun = { log: false, reservedHeight: 0, canvas: undefined };

    /**
     * @param {OutputHost} host The playground
     * @param {function(): void} focusRunStop Focuses the run/stop button, which takes over
     *     focus from the input row when the row goes
     */
    constructor(
        private readonly host: OutputHost,
        private readonly focusRunStop: () => void,
    ) {
        this.followEnd = new FollowEnd(host, () => this.log);
        host.addController(this);
    }

    private t(phrase: string, options?: Record<string, any>): string {
        return this.host.papyros.i18n.t(phrase, options);
    }

    private get log(): HTMLElement | null {
        return this.host.renderRoot.querySelector<HTMLElement>(".output");
    }

    private get input(): HTMLInputElement | null {
        return this.host.renderRoot.querySelector<HTMLInputElement>(".input-row input");
    }

    /** The playground's run is in progress, including the wait for the runtime to load */
    private get busy(): boolean {
        return this.host.papyros.runner.inProgress;
    }

    private get awaitingInput(): boolean {
        return this.host.papyros.runner.lifecycle.status === RunStatus.AwaitingInput;
    }

    /** The alert of a Run that could not launch the runtime */
    private get launchError(): string | undefined {
        const { lifecycle, backendStatus } = this.host.papyros.runner;
        if (lifecycle.status !== RunStatus.Ended || lifecycle.outcome !== RunOutcome.LaunchFailed) {
            return undefined;
        }
        return backendStatus.status === BackendStatus.Failed &&
            backendStatus.reason === BackendFailure.UnsupportedBrowser
            ? this.t("Papyros.unsupported_browser")
            : this.t("Papyros.playground.error");
    }

    /** Called when Run is clicked, before the run empties the output */
    onRunStart(): void {
        this.followEnd.restart();
        // Measured before the run empties the output, so the panels can hold their height across
        // the run instead of collapsing and regrowing. The reserved height is capped at what fits
        // in the log: a reservation that makes the log scrollable would have the log follow its
        // empty end, below the new output.
        const log = this.log;
        const body = this.host.renderRoot.querySelector<HTMLElement>(".output-body");
        this.previousRun = {
            log: log !== null,
            reservedHeight:
                log && body
                    ? Math.min(body.offsetHeight, log.clientHeight - (log.scrollHeight - body.offsetHeight))
                    : 0,
            canvas: this.computePanels().drawing && this.turtle.blank(),
        };
        this.host.requestUpdate();
    }

    hostUpdate(): void {
        const awaitingInput = this.awaitingInput;
        // Focus lands on <body> when the element holding it disappears, which loses the
        // user's place in the page; hostUpdated() hands it to the run/stop button instead.
        const input = this.input;
        this.inputLeaving =
            !awaitingInput && input !== null && (this.host.renderRoot as ShadowRoot).activeElement === input;

        // Only what opens or closes a panel animates: streamed output grows the log at once,
        // instead of being clipped to the height of an animation that restarts on every chunk.
        const view = this.view();
        const shown = [
            view.log,
            view.canvas && `${view.canvas.width}x${view.canvas.height}`,
            view.errors.length,
            this.busy,
            view.noOutput,
            this.launchError !== undefined,
            awaitingInput,
        ];
        if (shown.some((value, i) => value !== this.shown[i])) {
            this.shown = shown;
            // Animated on the wrapper rather than on the log: holding the log's height would
            // throw off its scroll position, which decides whether the log follows new output.
            this.resize?.capture();
            this.resizing = true;
        }
    }

    hostUpdated(): void {
        const panels = this.host.renderRoot.querySelector<HTMLElement>(".panels");
        if (panels !== this.resizeHost) {
            this.resize?.cancel();
            this.resizeHost = panels ?? undefined;
            this.resize = panels ? new HeightTransition(panels) : undefined;
        } else if (this.resizing) {
            void this.resize?.play();
        }
        this.resizing = false;

        const awaitingInput = this.awaitingInput;
        if (awaitingInput && !this.wasAwaitingInput) {
            // Not autofocus, which a cross-origin iframe blocks. This follows the Run gesture,
            // so focusing programmatically is allowed.
            this.input?.focus();
        } else if (this.inputLeaving) {
            this.focusRunStop();
        }
        this.wasAwaitingInput = awaitingInput;
        this.inputLeaving = false;
    }

    private onInputKeydown(e: KeyboardEvent): void {
        // An IME confirms composed text with Enter, which must not submit the line.
        // Safari sends that Enter with isComposing false and keyCode 229.
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Safari's IME Enter is only recognisable by keyCode
        if (e.key !== "Enter" || e.isComposing || e.keyCode === 229) {
            return;
        }
        e.preventDefault();
        const input = e.target as HTMLInputElement;
        const value = input.value;
        this.host.papyros.io.provideInput(value);
        input.value = "";
    }

    private renderInput(): TemplateResult {
        const prompt = this.host.papyros.io.prompt;
        return html`
            <div class="input-row">
                ${prompt ? html`<span class="prompt" id="prompt">${prompt}</span>` : nothing}
                <input
                    type="text"
                    aria-label=${this.t("Papyros.playground.input_label")}
                    aria-describedby=${prompt ? "prompt" : nothing}
                    placeholder=${this.t("Papyros.playground.input_placeholder")}
                    @keydown=${(e: KeyboardEvent) => this.onInputKeydown(e)}
                />
            </div>
        `;
    }

    private bodyReservationStyle(busy: boolean): Record<string, string> {
        // A floor for the whole run, so the body never collapses before it regrows. The panels
        // animate down to the natural height once it is lifted.
        return busy ? { "--reserved-height": `${this.previousRun.reservedHeight}px` } : {};
    }

    private computePanels(): Panels {
        const papyros = this.host.papyros;
        const outputs = papyros.io.output;
        if (this.panelsCache?.source === outputs) {
            return this.panelsCache;
        }

        const logBlocks: (TemplateResult | typeof nothing)[] = [];
        const errors: OutputEntry[] = [];
        const patches: TurtlePatch[] = [];
        // One text node per chunk, so a new chunk adds a node instead of replacing all the text
        let text: string[] = [];
        const flushText = (): void => {
            if (text.length > 0) {
                logBlocks.push(html`<pre class="transcript">${text}</pre>`);
                text = [];
            }
        };

        const maxLength = papyros.constants.maxOutputLength;
        const { shown, truncated } = shownOutput(outputs, maxLength);
        for (const entry of shown) {
            if (entry.type === OutputType.turtle) {
                patches.push(entry.content as TurtlePatch);
            } else if (entry.type === OutputType.stderr) {
                errors.push(entry);
            } else if (entry.type === OutputType.stdout && typeof entry.content === "string") {
                text.push(entry.content);
            } else if (entry.type === OutputType.img) {
                flushText();
                logBlocks.push(renderImage(entry, papyros));
            }
        }
        flushText();

        if (truncated) {
            logBlocks.push(renderOverflow(papyros, maxLength));
        }

        const result = { source: outputs, logBlocks, errors, drawing: this.turtle.update(patches) };
        this.panelsCache = result;
        return result;
    }

    private view(): View {
        const panels = this.computePanels();
        const busy = this.busy;
        const noOutput = runFinishedWithoutOutput(this.host.papyros);
        const canvas = panels.drawing ?? (busy ? this.previousRun.canvas : undefined);
        const log = panels.logBlocks.length > 0 || noOutput || (busy && (canvas === undefined || this.previousRun.log));
        return { ...panels, log, noOutput, canvas };
    }

    renderPanels(): TemplateResult {
        const view = this.view();
        const launchError = this.launchError;
        return html`<div class="panels">
            ${this.awaitingInput ? this.renderInput() : nothing} ${view.log ? this.renderLog(view) : nothing}
            ${view.canvas ? this.renderDrawing(view.canvas) : nothing}
            ${view.errors.map((entry) => this.renderError(entry.content))}
            ${launchError === undefined ? nothing : this.renderError(launchError)}
            ${renderNoOutputStatus(this.host.papyros, view.noOutput)}
        </div>`;
    }

    private renderLog(view: View): TemplateResult {
        return html`
            <div
                class="output"
                role="log"
                tabindex="0"
                aria-live="polite"
                aria-label=${this.t("Papyros.playground.output_label")}
                @scroll=${this.followEnd.onScroll}
            >
                <div class="panel-label">${this.t("Papyros.playground.output_panel_label")}</div>
                ${
                    view.noOutput
                        ? renderNoOutput(this.host.papyros)
                        : html`<div class="output-body" style=${styleMap(this.bodyReservationStyle(this.busy))}>
                              ${view.logBlocks}
                          </div>`
                }
            </div>
        `;
    }

    private renderDrawing(drawing: TurtleImage): TemplateResult {
        return html`
            <div class="drawing">
                <div class="panel-label">${this.t("Papyros.playground.drawing_panel_label")}</div>
                <div class="easel">${renderTurtleImage(drawing, this.t("Papyros.turtle_alt"))}</div>
            </div>
        `;
    }

    private renderError(error: unknown): TemplateResult {
        return html`<div class="error">${renderError(error, this.host.papyros, true)}</div>`;
    }
}
