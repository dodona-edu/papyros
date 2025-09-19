import {html, LitElement, TemplateResult} from "lit";
import "@dodona/trace-component"
import {property} from "lit/decorators.js";
import {State, state} from "../state/State";
import {StateController} from "@dodona/lit-state";
import {t} from "../util/Util";

export class Debugger extends LitElement {
    @property()
    public state: State = state;

    constructor() {
        super();
        new StateController(this)
    }

    protected override render(): TemplateResult {
        if(!this.state.debugger.active) {
            return html``;
        }

        return html`<tc-trace 
                .trace=${this.state.debugger.trace}
                .translations=${(t("Papyros.debugger") as any)}
                @frame-change=${(e: CustomEvent) => {
                    this.state.debugger.activeFrame = e.detail.frame;
                }
        }
        ></tc-trace>`;
    }
}