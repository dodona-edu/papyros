/**
 * I18n translations object:
 *
 */
interface Translation {
    /**
     * Phrase for given translation key
     */
    [key: string]: string;
}
interface NestedTranslations {
    /**
     * Each key yields a translated string or a nested object
     */
    [key: string]: Translation | NestedTranslations;
}
interface CodeMirrorTranslations {
    /**
     * CodeMirror expects a flat object per language
     */
    [key: string]: Translation
}
export declare const TRANSLATIONS: NestedTranslations;
export declare const CODE_MIRROR_TRANSLATIONS: CodeMirrorTranslations;
