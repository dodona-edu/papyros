import { LitElement } from "lit";
import { StateController } from "@dodona/lit-state";
import { property } from "lit/decorators.js";
import { Papyros, papyros } from "../../Papyros";

export abstract class PapyrosElement extends LitElement {
    controller = new StateController(this);
    @property()
        papyros: Papyros = papyros;

    protected t(phrase: string, options?: Record<string, any>): string {
        return this.papyros.i18n.t(phrase, options);
    }
}
