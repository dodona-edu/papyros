import {State, StateMap, stateProperty} from "@dodona/lit-state";
import {ProgrammingLanguage} from "../ProgrammingLanguage";
import {Papyros} from "./Papyros";
import {JAVASCRIPT_EXAMPLES} from "../examples/JavaScriptExamples";
import {PYTHON_EXAMPLES} from "../examples/PythonExamples";

export class Examples extends State {
    papyros: Papyros;
    @stateProperty
    private examples = new StateMap<ProgrammingLanguage, Record<string, string>>();

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
        this.setExamples(ProgrammingLanguage.JavaScript, JAVASCRIPT_EXAMPLES);
        this.setExamples(ProgrammingLanguage.Python, PYTHON_EXAMPLES);
    }

    public setExamples(language: ProgrammingLanguage, examples: Record<string, string>) {
        this.examples.set(language, examples);
    }

    public get names(): Array<string> {
        const language = this.papyros.runner.programmingLanguage;
        return Object.keys(this.examples.get(language) ?? {});
    }

    public getExampleCode(name: string): string {
        const language = this.papyros.runner.programmingLanguage;
        return this.examples.get(language)?.[name] ?? "";
    }
}