# Papyros

<p align="center">
  <a href="https://www.npmjs.com/package/@dodona/papyros">
    <img src="https://img.shields.io/npm/v/@dodona/papyros.svg" alt="Version of the npm package">
  </a>
  <a href="https://github.com/dodona-edu/papyros/actions?query=branch%3Amain">
    <img src="https://github.com/dodona-edu/papyros/actions/workflows/deploy-pages.yaml/badge.svg" alt="GitHub checks status">
  </a>
  <a href="https://github.com/dodona-edu/papyros/blob/main/LICENSE">
    <img alt="Source code license" src="https://img.shields.io/github/license/dodona-edu/papyros">
  </a>
</p>

Papyros is a programming scratchpad in the browser. It allows running code directly in your browser, no installation required. 
Right now, the focus is on providing a great experience for Python, while also supporting JavaScript.
By taking away obstacles between students and coding, the learning experience becomes smoother and less error-prone.

Currently, Papyros provides support for the following programming languages:
- Python, powered by [Pyodide](https://pyodide.org/en/stable/)
- JavaScript, powered by your browser

---

## Try it Online

Start coding directly in your [browser](https://papyros.dodona.be/).

---

## Use papyros in your project

### Installation

Install via npm or yarn:

```shell
npm install @dodona/papyros
# or
yarn add @dodona/papyros
```

### Setup input handling

Running interactive programs in the browser requires special handling of synchronous input.
Papyros supports two approaches (via [`sync-message`](https://github.com/alexmojaki/sync-message)):

#### COOP/COEP headers
Add the following HTTP headers to your server responses:

```yaml
{
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp"
}
```
These headers are required to enable `SharedArrayBuffer`, which is the preferred way to handle synchronous input.
They need to be set on all assets that are loaded, including scripts, images, fonts, etc.

#### Service Worker
If you cannot set these headers, you can use a service worker to handle input.
We provide a compiled and minified version of the `InputServiceWorker` in the `dist` folder.
You need to serve this file from the root of your domain (i.e. `/input-sw.js`).
You can then register the service worker in your application before launching: `papyros.serviceWorkerName = 'input-sw.js';`.

---

## Usage

### Minimal setup

If you only want to use the state and runner logic without UI components:

```ts
import { papyros } from "@dodona/papyros";

papyros.launch(); // heavy operation, loads workers and Pyodide
papyros.runner.code = "print(input())";

papyros.io.subscribe(
  () => (papyros.io.awaitingInput ? papyros.io.provideInput("foo") : ""),
  "awaitingInput"
);

await papyros.runner.start();
console.log(papyros.runner.io.output[0].content);
```

### Minimal setup with components

Papyros provides four web components for visualization.
Each expects a `papyros` state instance, but defaults to the global `papyros`.

```html
<script type="module">
  import { papyros } from "@dodona/papyros";

  papyros.launch();
</script>

<p-code-runner></p-code-runner>
<p-debugger></p-debugger>
<p-input></p-input>
<p-output></p-output>
```

---

## Theming

Papyros uses [Material Web Components](https://github.com/material-components/material-web) for buttons, inputs, sliders, etc.
All styling is driven by Material color system CSS variables (`--md-sys-color-...`).
Generate your own theme using the [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/).

* Three example themes (light + dark) are provided via `papyros.constants.themes`.
* A theme picker component is available out of the box.

---

## Structure

The codebase organized into clear layers:

* `backend`: code execution functionality (runs in Web Workers)
* `communication`: helpers to connect frontend and backend
* `frontend`: all browser-side code
    * `state`: state management (e.g. execution state, debugger, input/output)
    * `components`: visualization of that state, as Lit web components

### Components

#### `<p-code-runner>`

A [CodeMirror 6](https://codemirror.net/6/) editor to edit, run, and debug code.
Additional buttons can be added via the `.buttons` slot.

#### `<p-input>`

Lets users provide input (batch or interactive), passed to `papyros.io`.

#### `<p-output>`

Visualizes program output: stdout, stderr, and images.

#### `<p-debugger>`

Displays execution traces using [`@dodona/json-tracer`](https://github.com/dodona-edu/json-tracer).

### State API

A `Papyros` instance contains multiple logical parts:

* `papyros.constants`: general settings, constants, and themes (can be overridden).
* `papyros.debugger`: debug frames and currently active frame.
* `papyros.examples`: available code examples.
* `papyros.i18n`: translations (extend or override as needed).
* `papyros.io`: input/output handling. Subscribe to `awaitingInput` to supply input when needed.
* `papyros.runner`: code, execution state, programming language. Run code with `papyros.runner.start()`.
* `papyros.test`: test code (appended to the code document).

---

## Development

```shell
# Clone the repository:
git clone git@github.com:dodona-edu/papyros.git
cd papyros
# Install dependencies:
yarn install
# Build the python packages:
yarn setup
# Start a local server with live reload:
yarn start
```

## Publishing

```shell
# Build as library
yarn build:lib
# Publish to npm
yarn publish
```
