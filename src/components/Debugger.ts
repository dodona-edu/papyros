import {html, LitElement, TemplateResult} from "lit";
import "@dodona/trace-component"
import {property} from "lit/decorators.js";
import {Papyros, papyros} from "../state/Papyros";
import {StateController} from "@dodona/lit-state";
import {t} from "../util/Util";

export class Debugger extends LitElement {
    @property()
    public papyros: Papyros = papyros;

    constructor() {
        super();
        new StateController(this)
    }

    protected override render(): TemplateResult {
        if(!this.papyros.debugger.active) {
            return html``;
        }

        return html`<tc-trace 
                .trace=${this.papyros.debugger.trace}
                .translations=${(t("Papyros.debugger") as any)}
                @frame-change=${(e: CustomEvent) => {
                    this.papyros.debugger.activeFrame = e.detail.frame;
                }
        }
        ></tc-trace>`;
    }
}