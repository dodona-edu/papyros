import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { UsedInputGutterInfo } from "./Gutters";
import { ViewUpdate } from "@codemirror/view";
/**
 * Arguments used to higlight lines in the Editor
 */
interface HighlightArgs {
    /**
     * Whether the user's code is currently running and using input
     */
    running: boolean;
    /**
     * Function to obtain gutter info per line (1-based indexing)
     */
    getInfo: (lineInfo: number) => UsedInputGutterInfo;
}
/**
 * Editor to handle and highlight user input
 */
export declare class BatchInputEditor extends CodeMirrorEditor {
    /**
     * Gutters to show which lines were used
     */
    private usedInputGutters;
    private lastHighlightArgs?;
    constructor();
    private getLastHighlightArgs;
    protected onViewUpdate(v: ViewUpdate): void;
    /**
     * Apply highlighting to the lines in the Editor
     * @param {HightlightArgs} args Arguments for highlighting
     * @param {Array<string>} highlightClasses HTML classes to use for consumed lines
     */
    highlight(args: HighlightArgs, highlightClasses?: string[]): void;
    /**
     * @return {Array<string>} Array of valid user input
     * Data in the last line that is not terminated by a newline is omitted
     */
    getLines(): Array<string>;
}
export {};
