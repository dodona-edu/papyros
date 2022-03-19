/**
 * Interface for events used for communication between threads
 */
export interface PapyrosEvent {
    /**
     * The type of action generating this event
     */
    type: "input" | "output" | "success" | "error" | "debug";
    /**
     * The identifier for the run this message is associated with
     * This allows discarding outdated events that were delayed
     */
    runId: number;
    /**
     * The actual data stored in this event
     */
    data: string;
    /**
     * The format used for the data to help with parsing
     */
    contentType: string;
}
