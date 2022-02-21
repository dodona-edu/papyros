export interface PapyrosEvent {
    type: "input" | "output" | "script" | "success" | "error" | "loading";
    data: string;
    runId?: number;
    content?: string;
}
