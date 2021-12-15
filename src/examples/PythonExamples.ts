import { Example } from "./Example";

export const PYTHON_EXAMPLES: Array<Example> = [
    {
        name: "Hello world!", code: "print(\"Hello world!\");"
    },
    {
        name: "Fibonacci",
        code:
            `
def fibonacci(n):
    if n <= 1:
        return n;
    return fibonacci(n - 2) + fibonacci(n - 1)
            `
    }
];
