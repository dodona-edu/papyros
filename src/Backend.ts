export interface Backend {
    launch: () => Promise<Backend>;
    runCode: (code: string) => Promise<any>;
};