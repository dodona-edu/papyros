/**
 * Enum representing all possible types for supported events
 */
export enum BackendEventType {
    Start = "start",
    End = "end",
    StartTraceGeneration = "startTraceGeneration",
    CompletedTraceGeneration = "completedTraceGeneration",
    Input = "input",
    Output = "output",
    Sleep = "sleep",
    Error = "error",
    Interrupt = "interrupt",
    Loading = "loading",
    ClearOutput = "clearOutput",
    ClearInput = "clearInput",
    VisualizeStep = "visualizeStep"
}
/**
 * All possible types for ease of iteration
 */
export const BACKEND_EVENT_TYPES = [
    BackendEventType.Start, BackendEventType.End,
    BackendEventType.StartTraceGeneration, BackendEventType.CompletedTraceGeneration,
    BackendEventType.Input, BackendEventType.Output,
    BackendEventType.Sleep, BackendEventType.Error,
    BackendEventType.Interrupt, BackendEventType.Loading,
    BackendEventType.ClearOutput, BackendEventType.ClearInput,
    BackendEventType.VisualizeStep
];
/**
 * Interface for events used for communication between threads
 */
export interface BackendEvent {
    /**
     * The type of action generating this event
     */
    type: BackendEventType;
    /**
     * The actual data stored in this event
     */
    data: any;
    /**
     * The format used for the data to help with parsing
     */
    contentType?: string;
}
