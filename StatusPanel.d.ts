import { RenderOptions } from "./util/Util";
export declare class StatusPanel {
    get statusSpinner(): HTMLElement;
    get statusText(): HTMLElement;
    showSpinner(show: boolean): void;
    setStatus(status: string): void;
    render(options: RenderOptions): HTMLElement;
}
