import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
export declare class DebugExtension {
    private readonly view;
    private gutter;
    private lineEffect;
    constructor(view: EditorView);
    reset(): void;
    markLine(lineNr: number): void;
    toExtension(): Extension;
}
