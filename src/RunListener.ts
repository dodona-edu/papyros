/**
 * Interface for components that maintain state based on runs of code
 */
export interface RunListener {
    /**
     * Inform the listener that a new run started
     */
    onRunStart(): void;
    /**
     * Inform the listener that the run ended
     */
    onRunEnd(): void;
}
