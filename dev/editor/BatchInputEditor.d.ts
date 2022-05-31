import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { UsedInputGutterInfo } from "./Gutters";
/**
 * Editor to handle and highlight user input
 */
export declare class BatchInputEditor extends CodeMirrorEditor {
    /**
     * Style classes used to highlight lines
     */
    private static HIGHLIGHT_CLASSES;
    /**
     * Gutters to show which lines were used
     */
    private usedInputGutters;
    constructor();
    /**
     * Apply highlighting to the lines in the Editor
     * @param {boolean} disable Whether to disable editing the lines if marked
     * @param {function(number): UsedInputGutterInfo} getInfo Function to obtain gutter
     * info per line (1-based indexing)
     */
    highlight(disable: boolean, getInfo: (lineNr: number) => UsedInputGutterInfo): void;
    /**
     * @return {Array<string>} Array of valid user input
     * Data in the last line that is not terminated by a newline is omitted
     */
    getLines(): Array<string>;
}
