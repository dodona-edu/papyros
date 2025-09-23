import {html, TemplateResult} from "lit";
import "@dodona/trace-component"
import {customElement} from "lit/decorators.js";
import {t} from "../util/Util";
import {PapyrosElement} from "./helpers/PapyrosElement";

@customElement("p-debugger")
export class Debugger extends PapyrosElement {
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