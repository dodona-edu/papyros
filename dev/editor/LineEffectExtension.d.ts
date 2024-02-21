import { Extension, Range } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
export declare class LineEffectExtension {
    private readonly addEffect;
    private readonly clearEffect;
    private readonly setEffect;
    private editorView;
    constructor(view: EditorView);
    add(range: Range<Decoration>[]): void;
    clear(): void;
    set(range: Range<Decoration>[]): void;
    toExtension(): Extension;
}
