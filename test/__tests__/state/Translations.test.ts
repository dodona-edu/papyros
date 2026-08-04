import { describe, expect, it } from "vitest";
import { DUTCH_TRANSLATION, ENGLISH_TRANSLATION } from "../../../src/frontend/state/Translations";
import type { Translations } from "../../../src/frontend/state/I18n";

const sources = import.meta.glob("../../../src/**/*.ts", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

/** CodeMirror ships English phrases of its own, so only other locales override them. */
const ENGLISH_OPTIONAL_PREFIXES = ["CodeMirror."];

function flatten(translations: Translations, prefix = ""): string[] {
    return Object.entries(translations).flatMap(([key, value]) =>
        typeof value === "string" ? [prefix + key] : flatten(value, `${prefix}${key}.`),
    );
}

function matchAll(pattern: RegExp): string[] {
    return Object.entries(sources)
        .filter(([path]) => !path.endsWith("/Translations.ts"))
        .flatMap(([, source]) => [...source.matchAll(pattern)].map((match) => match[1]));
}

/** Keys passed to t() as a plain string, the only ones that can be checked exactly. */
function usedKeys(): string[] {
    return matchAll(/\.t\(\s*"([^"]+)"/g);
}

/**
 * Prefixes of keys that are resolved at runtime, either by interpolating into the phrase
 * (`t(`Papyros.states.${state}`)`) or by handing a whole subtree to another component
 * (`getTranslations("CodeMirror")`). Every key below such a prefix counts as used.
 */
function usedPrefixes(): string[] {
    return [
        ...matchAll(/\.t\(\s*`([^`$]*)\$\{/g),
        ...matchAll(/getTranslations\(\s*"([^"]+)"/g).map((key) => `${key}.`),
    ];
}

describe("translations", () => {
    const english = flatten(ENGLISH_TRANSLATION);
    const dutch = flatten(DUTCH_TRANSLATION);

    it("translates every English key into Dutch", () => {
        expect(english.filter((key) => !dutch.includes(key))).toEqual([]);
    });

    it("has an English phrase for every Dutch key", () => {
        const missing = dutch
            .filter((key) => !english.includes(key))
            .filter((key) => !ENGLISH_OPTIONAL_PREFIXES.some((prefix) => key.startsWith(prefix)));
        expect(missing).toEqual([]);
    });

    it("defines every key used in the source", () => {
        expect(usedKeys().filter((key) => !english.includes(key))).toEqual([]);
    });

    it("uses every key it defines", () => {
        const used = usedKeys();
        const prefixes = usedPrefixes();
        const unused = english
            .filter((key) => !used.includes(key))
            .filter((key) => !prefixes.some((prefix) => key.startsWith(prefix)));
        expect(unused).toEqual([]);
    });
});
