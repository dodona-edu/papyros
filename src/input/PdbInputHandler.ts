import { DebuggingCommand, DebuggingInputHandler } from "./DebuggingInputHandler";

/**
 * Implementation of a DebuggingInputHandler for Python with Pdb
 */
export class PdbInputHandler extends DebuggingInputHandler {
    protected override buildCommandMap(): Map<DebuggingCommand, string> {
        return new Map([
            [DebuggingCommand.StepInto, "s"],
            [DebuggingCommand.StepOver, "n"],
            [DebuggingCommand.Continue, "c"]
        ]);
    }

    override waitWithPrompt(waiting: boolean, prompt?: string): void {
        if (waiting) {
            this.debugging = /^\(Pdb\)/.test(prompt || "");
        }
        super.waitWithPrompt(waiting, prompt);
    }
}
