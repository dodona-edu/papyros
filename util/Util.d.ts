import I18n from "i18n-js";
export declare const t: typeof I18n.t;
export declare function loadTranslations(): void;
export declare function getLocales(): Array<string>;
export declare function getSelectOptions<T>(options: Array<T>, optionText: (option: T) => string, selected?: T): string;
export declare function renderSelect<T>(selectId: string, options: Array<T>, optionText: (option: T) => string, selected?: T, labelText?: string): string;
export declare function addListener<T extends string>(elementId: string, onEvent: (e: T) => void, eventType?: string, attribute?: string): void;
export declare function removeSelection(selectId: string): void;
