import { BackendEvent, BackendEventType } from "./BackendEvent";

export class BackendEventQueue {
    private callback: (e: BackendEvent) => void;
    private limit: number;
    private flushTime: number;

    private queue: Array<BackendEvent>;
    private overflow: Array<BackendEvent>;
    private lastFlushTime: number;
    private sendCount: number;
    private encoder: TextDecoder;
    constructor(callback: (e: BackendEvent) => void,
        limit = 250, flushTime = 0.1) {
        this.callback = callback;
        this.limit = limit;
        this.flushTime = flushTime;

        this.queue = [];
        this.overflow = [];
        this.lastFlushTime = new Date().getTime();
        this.sendCount = 0;
        this.encoder = new TextDecoder();
    }

    public put(type: BackendEventType, text: string | BufferSource, extra: string | any): void {
        let stringData = "";
        if (typeof text !== "string") {
            stringData = this.encoder.decode(text);
        } else {
            stringData = text;
        }
        let extraArgs = {};
        let contentType = "text/plain";
        if (extra) {
            if (typeof extra === "string") {
                contentType = extra;
            } else {
                contentType = extra["contentType"];
                delete extra["contentType"];
                extraArgs = extra;
            }
        }

        if (this.queue.length === 0 || this.queue[this.queue.length - 1].type !== type) {
            this.queue.push({
                type: type,
                data: stringData,
                contentType: contentType,
                ...extraArgs
            });
        } else {
            this.queue[this.queue.length - 1].data += stringData;
        }
        if (this.shouldFlush()) {
            this.flush();
        }
    }

    protected shouldFlush(): boolean {
        return this.queue.length > 1 ||
            new Date().getTime() - this.lastFlushTime > this.flushTime;
    }

    public reset(): void {
        this.queue = [];
        this.overflow = [];
        this.lastFlushTime = new Date().getTime();
        this.sendCount = 0;
    }

    public flush(): void {
        this.queue.forEach(e => {
            if (this.sendCount < this.limit || e.type !== BackendEventType.Output) {
                this.callback(e);
            } else {
                this.overflow.push(e);
            }
        });
        this.sendCount += this.queue.length;
        this.queue = [];
        this.lastFlushTime = new Date().getTime();
    }

    public getOverflow(): Array<BackendEvent> {
        return this.overflow;
    }

    public setCallback(callback: (e: BackendEvent) => void): void {
        this.callback = callback;
    }
}
