/**
 * Enum representing the importance of a log message
 * This is helpful for debugging while allowing filtering in production
 */
export declare enum LogType {
    Debug = 0,
    Error = 1,
    Important = 2
}
/**
 * Helper method to log useful information at runtime
 * @param {LogType} logType The importance of this log message
 * @param {any[]} args The data to log
 */
export declare function papyrosLog(logType: LogType, ...args: any[]): void;
