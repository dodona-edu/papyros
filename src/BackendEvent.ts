/**
 * Enum representing all possible types for supported events
 */
export enum BackendEventType {
    Start = "start",
    Input = "input",
    Output = "output",
    Error = "error",
    End = "end"
}
/**
 * All possible types for ease of iteration
 */
export const BACKEND_EVENT_TYPES = [
    BackendEventType.Input, BackendEventType.Output,
    BackendEventType.Start, BackendEventType.End,
    BackendEventType.Error
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
    data: string;
    /**
     * The format used for the data to help with parsing
     */
    contentType: string;
}
