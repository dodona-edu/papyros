export enum ProgrammingLanguage {
    Python = "Python",
    JavaScript = "JavaScript"
}

const LANGUAGE_MAP = new Map([
    ["python", ProgrammingLanguage.Python],
    ["javascript", ProgrammingLanguage.JavaScript]
]);

export function plFromString(language: string): ProgrammingLanguage {
    const langLC = language.toLowerCase();
    if (LANGUAGE_MAP.has(langLC)) {
        return LANGUAGE_MAP.get(langLC)!;
    } else {
        throw new Error(`Unsupported language: ${language}`);
    }
}
