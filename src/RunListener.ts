/**
 * Interface for components that maintain state based on runs of code
 */
export interface RunListener {
    /**
     * Inform this listener that a new run started
     */
    onRunStart(): void;
    /**
     * Inform this listener that the run ended
     */
    onRunEnd(): void;
}
