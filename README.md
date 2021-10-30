# papyros
Python scratchpad in the browser, powered by Pyodide

Depends on SharedArrayBuffer/Atomics, making Safari unsupported until they re-enable this feature. craco.config.js handles enabling this feature.
TypeScript worker support based on https://blog.johnnyreilly.com/2020/02/21/web-workers-comlink-typescript-and-react/