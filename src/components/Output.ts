import {customElement, property} from "lit/decorators.js";
import {StateController} from "@dodona/lit-state";
import {Papyros, papyros} from "../state/Papyros";
import {css, html, LitElement, TemplateResult} from "lit";
import {OutputEntry, OutputType} from "../state/InputOutput";
import {FriendlyError} from "../OutputManager";
import "./Circle";

@customElement("p-output")
export class Output extends LitElement {
    controller = new StateController(this);
    @property()
    papyros: Papyros = papyros

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
                height: 100%;
                overflow: auto;
                font-family: monospace;
                padding: 1rem;
                white-space: pre-wrap;
            }
            
            img {
                max-width: 100%;
                max-height: 300px;
                display: block;
                margin: 0.5rem 0;
            }
            
            .error {
                color: var(--papyros-error, #b00020);
            }
        `
    }

    private get maxOutputLength(): number {
        if(this.papyros.debugger.active && this.papyros.debugger.debugOutputs) {
            return this.papyros.debugger.debugOutputs;
        }

        return this.papyros.constants.maxOutputLength;
    }

    get outputs(): OutputEntry[] {
        return this.papyros.io.output.slice(0, this.maxOutputLength);
    }

    protected override render(): TemplateResult[] {
        return this.outputs.map(o => {
            if (o.type === OutputType.stdout) {
                return html`${o.content}`;
            } else if (o.type === OutputType.img) {
                return html`<img src="data:${o.contentType}, ${o.content}"></img>`;
            }else if(o.type === OutputType.stderr) {
                if(typeof o.content === "string") {
                    return html`<span class="error">${o.content}</span>`;
                } else {
                    const errorObject = o.content as FriendlyError;
                    const errorHTML = [ // an array to avoid unintentional spaces/newlines
                        html`<p-circle title="${errorObject.info}">?</p-circle>${errorObject.name} traceback: <p-circle title="${errorObject.traceback}">!</p-circle>\n`,
                        html`<span class="where">${errorObject.where?.trim()}</span>\n`,
                    ]
                    if(errorObject.what) {
                        errorHTML.push(html`<span class="what">${errorObject.what.trim()}</span>\n`);
                    }
                    if(errorObject.why) {
                        errorHTML.push(html`<span class="why">${errorObject.why.trim()}</span>\n`);
                    }
                    return html`<span class="error">${errorHTML}</span>`;
                }
            }
        })
    }
}