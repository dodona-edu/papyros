import {State, StateMap, stateProperty} from "@dodona/lit-state";
import Polyglot from "node-polyglot";
import {DUTCH_TRANSLATION, ENGLISH_TRANSLATION} from "../Translations";

export type Translations = Record<string, Translations | string>;

export class I18n extends State {
    private readonly polyglot = new Polyglot();
    private readonly translations = new StateMap<string, Translations>();
    @stateProperty
    private _locale: string = "en";

    get availableLocales(): string[] {
        return [...this.translations.keys()];
    }

    public setTranslations(locale: string, translations: Translations): void {
        this.translations.set(locale, translations);
        if (this.locale === locale) {
            this.dispatchStateEvent("t");
            this.polyglot.replace(this.translations.get(locale)!);
        }
    }

    public set locale(locale: string) {
        if (this.translations.has(locale)) {
            this.dispatchStateEvent("t");
            this._locale = locale;
            this.polyglot.locale(locale);
            this.polyglot.replace(this.translations.get(locale)!);
        } else {
            throw new Error(`Locale ${locale} not loaded`);
        }
    }

    @stateProperty
    public get locale(): string {
        return this._locale;
    }

    public t(phrase: string, options?: Record<string, any>): string {
        this.recordRead("t");
        return this.polyglot.t(phrase, options);
    }

    public getTranslations(key?: string): Translations | undefined {
        if(!this.translations.has(this.locale)) {
            return undefined;
        }
        if (!key) {
            return this.translations.get(this.locale);
        }
        const keys = key.split('.');
        let record: Translations | string = this.translations.get(this.locale)!;
        for (const k of keys) {
            if (typeof record === "string" || !(k in record)) {
                return undefined;
            }
            record = record[k];
        }
        if (typeof record === "string") {
            return undefined;
        }
        return record;
    }

    constructor() {
        super();
        this.polyglot.locale(this.locale);
        this.setTranslations("en", ENGLISH_TRANSLATION)
        this.setTranslations("nl", DUTCH_TRANSLATION);
    }
}