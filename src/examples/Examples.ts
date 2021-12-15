import { ProgrammingLanguage } from "../ProgrammingLanguage";
import { Example } from "./Example";
import { JAVASCRIPT_EXAMPLES } from "./JavaScriptExamples";

const EXAMPLES_MAP: Map<ProgrammingLanguage, Array<Example>> = new Map([
    [ProgrammingLanguage.JavaScript, JAVASCRIPT_EXAMPLES]
]);

export function getExamples(language: ProgrammingLanguage): Array<Example> {
    if (EXAMPLES_MAP.has(language)) {
        return EXAMPLES_MAP.get(language)!;
    } else {
        return [];
    }
}
