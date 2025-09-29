export const JAVASCRIPT_EXAMPLES = {
    "Hello world!": "console.log(\"Hello, World!\");",
    "Input":
        `const name = prompt('What is your name?')
console.log(\`Hello, \${name}!\`)`,
    "Fibonacci":
        `function fibonacci(n){
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 2) + fibonacci(n - 1);
}
for(let i = 0; i < 10; i += 1){
    console.log(fibonacci(i));
}
`
};
