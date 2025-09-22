import {html, LitElement, TemplateResult} from "lit";
import "@dodona/trace-component"
import {customElement, property} from "lit/decorators.js";
import {Papyros, papyros} from "../state/Papyros";
import {StateController} from "@dodona/lit-state";
import {t} from "../util/Util";

@customElement("p-debugger")
export class Debugger extends LitElement {
    controller = new StateController(this);
    @property()
    public papyros: Papyros = papyros;

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