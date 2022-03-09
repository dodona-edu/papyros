import { Remote } from "comlink";
import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
/**
 * Start a backend for the given language, while storing the worker
 * @param {ProgrammingLanguage} language The programming language supported by the backend
 * @return {Remote<Backend>} A Comlink proxy for the Backend
 */
export declare function startBackend(language: ProgrammingLanguage): Remote<Backend>;
/**
 * Stop a backend by terminating the worker and releasing memory
 * @param {Remote<Backend>} backend The proxy for the backend to stop
 */
export declare function stopBackend(backend: Remote<Backend>): void;
