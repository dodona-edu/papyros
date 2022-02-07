import { Remote } from "comlink";
import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
export declare function getBackend(language: ProgrammingLanguage): Remote<Backend>;
export declare function stopBackend(backend: Remote<Backend>): void;
