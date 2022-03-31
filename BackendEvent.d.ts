/**
 * Enum representing all possible types for supported events
 */
export declare enum BackendEventType {
    Start = "start",
    End = "end",
    Input = "input",
    Output = "output",
    Sleep = "sleep",
    Error = "error"
}
/**
 * All possible types for ease of iteration
 */
export declare const BACKEND_EVENT_TYPES: BackendEventType[];
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
