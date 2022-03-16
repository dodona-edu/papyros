/**
 * Enum representing the importance of a log message
 * This is helpful for debugging while allowing filtering in production
 */
export enum LogType {
    Debug, Error, Important
}

const ENVIRONMENT: string = process.env.NODE_ENV || "development";
// Log everything in development
const SHOULD_LOG = ENVIRONMENT !== "production";

/**
 * Helper method to log useful information at runtime
 * @param {LogType} logType The importance of this log message
 * @param {any[]} args The data to log
 */
export function papyrosLog(logType: LogType, ...args: any[]): void {
    const doLog = SHOULD_LOG || logType !== LogType.Debug;
    if (doLog) {
        if (logType === LogType.Error) {
            console.error(...args);
        } else {
            console.log(...args);
        }
    }
}
