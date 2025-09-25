import {State, stateProperty} from "@dodona/lit-state";
import Polyglot from "node-polyglot";
import {DUTCH_PHRASES, DUTCH_TRANSLATION, ENGLISH_PHRASES, ENGLISH_TRANSLATION} from "../Translations";

export type Translations = Record<string, Translations | string>;

export class I18n extends State {
    private readonly polyglot = new Polyglot();
    private readonly translations = new Map<string, Translations>();
    @stateProperty
    locale: string = "en";

    public setTranslations(locale: string, translations: Translations): void {
        this.translations.set(locale, translations);
        if (this.locale === locale) {
            this.dispatchStateEvent("t");
            this.polyglot.replace(this.translations.get(locale)!);
        }
    }

    public setLocale(locale: string): void {
        if (this.translations.has(locale)) {
            this.dispatchStateEvent("t");
            this.locale = locale;
            this.polyglot.locale(locale);
            this.polyglot.replace(this.translations.get(locale)!);
        } else {
            throw new Error(`Locale ${locale} not loaded`);
        }
    }

    public t(phrase: string, options?: Record<string, any>): string {
        this.recordRead("t");
        return this.polyglot.t(phrase, options);
    }

    constructor() {
        super();
        this.polyglot.locale(this.locale);
        this.setTranslations("en", {
            "Papyros": ENGLISH_TRANSLATION,
            "CodeMirror": ENGLISH_PHRASES,
        })
        this.setTranslations("nl", {
            "Papyros": DUTCH_TRANSLATION,
            "CodeMirror": DUTCH_PHRASES,
        });
    }
}