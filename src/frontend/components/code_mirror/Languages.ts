import { LanguageSupport } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { Extension } from "@codemirror/state";
import { ProgrammingLanguage } from "../../../ProgrammingLanguage";

// Module-level singletons: a fresh javascript()/python() call builds a new
// LanguageSupport, which would reconfigure the language compartment and force
// a re-parse of the whole document, even when the language hasn't changed.
export const languageExtensions: Record<ProgrammingLanguage, LanguageSupport> = {
    JavaScript: javascript(),
    Python: python(),
};

/**
 * Picks the language extension for a file based on its extension, for use in
 * file tabs where the programming language isn't known ahead of time.
 */
export function languageForFileName(name: string): Extension {
    if (/\.py$/i.test(name)) return languageExtensions.Python;
    if (/\.js$/i.test(name)) return languageExtensions.JavaScript;
    return [];
}
