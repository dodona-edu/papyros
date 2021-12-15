export interface PapyrosEvent {
    type: "input" | "output" | "script" | "success" | "error";
    data: string;
    runId: number;
}
