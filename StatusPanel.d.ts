export declare class StatusPanel {
    onRun: () => void;
    constructor(onRun: () => void);
    initialize(): void;
    get statusSpinner(): HTMLElement;
    get statusText(): HTMLElement;
    showSpinner(show: boolean): void;
    setStatus(status: string): void;
    render(parent: HTMLElement): HTMLElement;
}
