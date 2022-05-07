import { ProgrammingLanguage } from "../ProgrammingLanguage";
export declare function getExamples(language: ProgrammingLanguage): {
    [key: string]: string;
};
export declare function getExampleNames(language: ProgrammingLanguage): Array<string>;
export declare function getCodeForExample(language: ProgrammingLanguage, name: string): string;
