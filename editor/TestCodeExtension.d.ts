import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
export declare class TestCodeExtension {
    private readonly view;
    private readonly widget;
    private readonly lineEffect;
    private lines;
    private allowEdit;
    constructor(view: EditorView);
    private get numberOfTestLines();
    private lineFromEnd;
    private highlightLines;
    private addWidget;
    private clearAllLineEffects;
    private getReadOnlyRanges;
    private insertTestCode;
    reset(keepCode?: boolean): void;
    set testCode(code: string);
    getNonTestCode(): string;
    toExtension(): Extension;
}
