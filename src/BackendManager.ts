import { Backend } from "./Backend";
import { JavaScriptBackend } from "./JavaScriptBackend";
import { PythonBackend } from "./PythonBackend";

const BACKEND_LANGUAGE_MAP: Map<string, Backend> = new Map([
    ["python", new PythonBackend()],
    ["javascript", new JavaScriptBackend()]
]);

export function getBackend(language: string): Backend {
    language = language.toLowerCase();
    if(BACKEND_LANGUAGE_MAP.has(language)){
        return BACKEND_LANGUAGE_MAP.get(language)!;
    } else {
        throw new Error(`${language} is not yet supported.`);
    }
}