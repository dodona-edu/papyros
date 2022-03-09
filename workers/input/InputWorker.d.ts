/**
 * Class that is used in a service worker to allow synchronous communication
 * between threads. This is achieved in two different ways.
 * Responses can be modified by attaching headers allowing the use of shared memory.
 * Requests to certain endpoints can be used with synchronous requests
 * to achieve the same goal.
 */
export declare class InputWorker {
    private hostName;
    private syncMessageListener;
    /**
     * Create a worker for a specific domain
     * @param {string} hostName The name of the host domain
     */
    constructor(hostName: string);
    /**
     * Process and potentially handle a fetch request from the application
     * @param {FetchEvent} event The event denoting a request to a url
     * @return {boolean} Whether the event was handled
     */
    handleInputRequest(event: FetchEvent): Promise<boolean>;
}
