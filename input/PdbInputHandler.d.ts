import { DebuggingCommand, DebuggingInputHandler } from "./DebuggingInputHandler";
/**
 * Implementation of a DebuggingInputHandler for Python with Pdb
 */
export declare class PdbInputHandler extends DebuggingInputHandler {
    protected buildCommandMap(): Map<DebuggingCommand, string>;
    waitWithPrompt(waiting: boolean, prompt?: string): void;
}
