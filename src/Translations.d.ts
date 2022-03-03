/**
 * I18n translations object:
 *
 */
interface Translations {
    /**
     * Each key yields a translated string or a nested object
     */
    [key: string]: string | Translations;
}
export declare const TRANSLATIONS: Translations;
