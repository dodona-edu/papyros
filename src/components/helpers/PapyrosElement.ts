import {LitElement} from "lit";
import {StateController} from "@dodona/lit-state";
import {property} from "lit/decorators.js";
import {Papyros, papyros} from "../../state/Papyros";

export abstract class PapyrosElement extends LitElement {
    controller = new StateController(this);
    @property()
    papyros: Papyros = papyros;
}
