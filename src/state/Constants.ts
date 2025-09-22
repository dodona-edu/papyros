import {State, stateProperty} from "@dodona/lit-state";

export class Constants extends State {
    /**
     * The maximum length of the output (in lines).
     * Default is 1000 lines.
     * If the output exceeds this length, it will be truncated.
     * Overflowing output will be downloadable.
     */
    @stateProperty
    maxOutputLength: number = 1000;
    /**
     * The maximum number of debug frames
     * Default is 10000 frames.
     * If the number of frames exceeds this limit, execution will be stopped.
     */
    @stateProperty
    maxDebugFrames: number = 10000;
}