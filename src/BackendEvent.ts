/**
 * Enum representing all possible types for supported events
 */
export enum BackendEventType {
    Start = "start",
    End = "end",
    Input = "input",
    Output = "output",
    Sleep = "sleep",
    Error = "error",
    Interrupt = "interrupt",
    Debug = "debug"
}
/**
 * All possible types for ease of iteration
 */
export const BACKEND_EVENT_TYPES = [
    BackendEventType.Start, BackendEventType.End,
    BackendEventType.Input, BackendEventType.Output,
    BackendEventType.Sleep, BackendEventType.Error,
    BackendEventType.Interrupt, BackendEventType.Debug
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
