export declare enum LogType {
    Debug = 0,
    Error = 1,
    Important = 2
}
export declare function papyrosLog(logType: LogType, ...args: any[]): void;
