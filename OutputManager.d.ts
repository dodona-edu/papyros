import { PapyrosEvent } from "./PapyrosEvent";
import { RenderOptions } from "./util/Util";
export interface FriendlyError {
    name: string;
    traceback?: string;
    info?: string;
    why?: string;
    what?: string;
    where?: string;
}
export declare class OutputManager {
    outputAreaId: string;
    get outputArea(): HTMLElement;
    renderNextElement(html: string): void;
    spanify(text: string, ignoreEmpty?: boolean): string;
    showOutput(output: PapyrosEvent): void;
    showError(error: FriendlyError | string): void;
    render(options: RenderOptions): HTMLElement;
    reset(): void;
    onRunStart(): void;
    onRunEnd(): void;
}
