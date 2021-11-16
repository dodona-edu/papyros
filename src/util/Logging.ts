export enum LogType {
    Debug, Error, Important
}

const ENVIRONMENT: string = process.env.NODE_ENV || "development";
export function papyrosLog(logType: LogType, ...args: any[]): void {
    const doLog = ENVIRONMENT !== "production" || logType !== LogType.Debug;
    if (doLog) {
        if (logType === LogType.Error) {
            console.error(...args);
        } else {
            console.log(...args);
        }
    }
}
