// @ts-nocheck
import Polyglot from "node-polyglot";
import { TRANSLATIONS } from "./Translations";

const forEach = Array.prototype.forEach;
const entries = Object.entries;

export class I18n extends Polyglot {
    extend(morePhrases = {}, prefix: string): void {
        entries(morePhrases || {}).forEach( entry => {
            const key = entry[0];
            const phrase = entry[1];
            const prefixedKey = prefix ? prefix + "." + key : key;
            if (typeof phrase === "object" && !Array.isArray(phrase)) {
                this.extend(phrase, prefixedKey);
            } else {
                this.phrases[prefixedKey] = phrase;
            }
        });
    }

    t(key: string, options?: Record<string, unknown>): string {
        if (Array.isArray(this.phrases[key])) {
            return this.phrases[key];
        }
        return super.t(key, options);
    }

    get locale(): string {
        return super.locale();
    }

    set locale(locale: string) {
        if (locale == "en" || locale == "nl") {
            let translation = {};
            for (const [language, translations] of Object.entries(TRANSLATIONS)) {
                // Add keys to already existing translations if they exist
                translation[language] = Object.assign(
                    (translation[language] || {}),
                    translations
                );
            }
            super.replace(translation[locale]);
        }
    }

    formatNumber(number: number, options?: Record<string, unknown>): string {
        return new Intl.NumberFormat(this.locale(), options).format(number);
    }
}