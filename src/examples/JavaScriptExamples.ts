import { Example } from "./Example";

export const JAVASCRIPT_EXAMPLES: Array<Example> = [
    {
        name: "Hello world!", code: "console.log(\"Hello world!\");"
    },
    {
        name: "Fibonacci",
        code:
            `
function fibonacci(n){
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 2) + fibonacci(n - 1);
}
            `
    }
];
