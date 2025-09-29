import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "../../Papyros";

export class Test extends State {
    papyros: Papyros;

    @stateProperty
    public testLineCount: number | undefined = undefined;
    @stateProperty
    set testCode(value: string | undefined) {
        if( this.testLineCount !== undefined) {
            const freedCode = this.testfreeCode;
            this.testLineCount = undefined;
            this.papyros.runner.code = freedCode;
        }
        if (value) {
            this.testLineCount = value.split("\n").length;
            this.papyros.runner.code += "\n\n" + value;
        } else {
            this.testLineCount = undefined;
        }
    }
    @stateProperty
    get testfreeCode(): string {
        if (this.testLineCount !== undefined) {
            return this.papyros.runner.code.split("\n").slice(0, -this.testLineCount).join("\n");
        }
        return this.papyros.runner.code;
    }
    public editTestCode(): void {
        if (this.testLineCount !== undefined) {
            this.testLineCount = undefined;
        }
    }
    @stateProperty
    public get testLines(): number[] | undefined {
        const codeLines = this.papyros.runner.code.split("\n").length;
        if (this.testLineCount !== undefined && this.testLineCount <= codeLines) {
            return Array.from({ length: this.testLineCount }, (_, i) => i + (codeLines - this.testLineCount!) + 1);
        }
        return undefined;
    }

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
    }
}