import { ProgrammingLanguage } from "../ProgrammingLanguage";
import { JAVASCRIPT_EXAMPLES } from "./JavaScriptExamples";
import { PYTHON_EXAMPLES } from "./PythonExamples";

const EXAMPLES_MAP: Map<ProgrammingLanguage, { [key: string]: string }> = new Map([
    [ProgrammingLanguage.JavaScript, JAVASCRIPT_EXAMPLES],
    [ProgrammingLanguage.Python, PYTHON_EXAMPLES]
]);

export function getExamples(language: ProgrammingLanguage): { [key: string]: string } {
    if (EXAMPLES_MAP.has(language)) {
        return EXAMPLES_MAP.get(language)!;
    } else {
        return {};
    }
}

export function getExampleNames(language: ProgrammingLanguage): Array<string> {
    return Object.keys(getExamples(language));
}

export function getCodeForExample(language: ProgrammingLanguage, name: string): string {
    return getExamples(language)[name];
}
