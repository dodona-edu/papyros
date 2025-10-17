import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "./Papyros";
import { Runner } from "./Runner";

export class Test extends State {
    papyros: Papyros;

    @stateProperty
    public testCode: string | undefined = undefined;

    public editTestCode(): void {
        this.papyros.runner.code = this.papyros.runner.effectiveCode;
        this.testCode = undefined;
    }
    @stateProperty
    public get testLines(): number[] | undefined {
        if (this.testCode === undefined) {
            return undefined;
        }
        const codeLines = this.papyros.runner.code.split("\n").length;
        const testLines = this.testCode.split("\n").length;
        return Array.from({ length: testLines }, (_, i) => i + codeLines + Runner.CODE_SEPARATOR.length);
    }

    @stateProperty
    public get testLineCount(): number | undefined {
        if (this.testCode === undefined) {
            return undefined;
        }
        return this.testCode.split("\n").length;
    }

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
    }
}
