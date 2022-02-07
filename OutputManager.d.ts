import { PapyrosEvent } from "./PapyrosEvent";
export interface FriendlyError {
    name: string;
    traceback?: string;
    info?: string;
    why?: string;
    what?: string;
    where?: string;
}
export declare class OutputManager {
    outputArea: HTMLElement;
    constructor(outputWrapperId: string);
    renderNextElement(html: string): void;
    spanify(text: string, ignoreEmpty?: boolean): string;
    showOutput(output: PapyrosEvent): void;
    showError(error: FriendlyError | string): void;
    onRunStart(): void;
    onRunEnd(): void;
}
