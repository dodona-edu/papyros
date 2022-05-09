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

Papyros is a programming scratchpad in the browser. It allows running code
directly in your browser, no installation required. Right now, the focus is on providing a great experience for Python, while also supporting JavaScript.
By taking away obstacles between students and coding, the learning experience becomes
smoother and less error-prone.

Currently, Papyros provides support for the following programming languages:
- Python, powered by [Pyodide](https://pyodide.org/en/stable/)
- JavaScript, powered by your browser

## Using Papyros in your own project

You can add Papyros to your project as follows:
- npm:
```shell
npm install @dodona/papyros
```
- yarn:
```shell
yarn add @dodona/papyros
```

Papyros currently supports two modes of operation: stand-alone and embedded.

In stand-alone mode, Papyros runs as a full application in the browser. 
This includes extra UI elements to allow selecting a locale, a programming language, ...

In embedded mode, the layout is reduced to the minimum. Dynamic selections are not displayed,
as the user knows for what purpose Papyros is being used. For example, when used in the
scope of a Python exercise in Dodona, there is no need to support other programming languages.
The locale should also match that of the actual application.

Using Papyros in your project is done by following a few steps. First, you create a new
Papyros instance with a `PapyrosConfig` object.
The following options are supported:

- `standAlone`: Whether to operate in stand-alone or embedded mode as described above.
- `programmingLanguage`: The [programming language](/src/ProgrammingLanguage.ts) to use in the CodeEditor and Backend.
- `locale`: The locale to use, currently English and Dutch translations are provided.
- `inputMode`: How the users can provide input, according to the [InputMode enum](/src/InputManager.ts)
- `example`: Optional name of the selected example, only appliccable in standAlone-mode
- `channelOptions`: Optional options to provide to the [sync-message](https://github.com/alexmojaki/sync-message) channel. Extra is the serviceWorkerName, which is the relative pathname to the service worker script

Furthermore, you can provide fine-grained configuration by providing `RenderOptions` to each main component in the application when rendering Papyros. You minimally need to specify the ID of the parent element.
You can also specify attributes, such as `style`, `data`-attributes or `classNames` to be used.
The components you can style like this are the following:
- `standAloneOptions`: for the global application in standAlone mode
- `codeEditorOptions`: for the CodeEditor.
- `statusPanelOptions`: for the StatusPanel in the CodeEditor
- `inputOptions`: for the field that handles the user input
- `outputOptions`: for the panel that displays the output of the code

### User input

Important to note is that handling asynchronous input in a synchronous way is not straightforward.
This requires advanced features which are not available by default in your browser. We support two options based on [sync-message](https://github.com/alexmojaki/sync-message).

The most efficient and practical way is using SharedArrayBuffers, which requires the presence of certain HTTP headers.
The following headers must be set on resources using Papyros.
```json
'Cross-Origin-Opener-Policy': 'same-origin',
'Cross-Origin-Embedder-Policy': 'require-corp'
```
If you are also embedding other components (such as iframes, videos or images) in those pages, you will also need to set the `Cross-Origin-Resource-Policy`-header to `cross-origin` to make them work correctly. If these elements come from external URLs, it will likely not be possible to keep using them. An alternative is described below.

If you would like to use this project without enabling these HTTP headers, we provide a solution using a service worker.
If your application does not use a service worker yet, you can create one based on the [service worker used in stand-alone mode](src/InputServiceWorker.ts)).
If you already use a service worker, simply include our [InputWorker](src/workers/input/InputWorker.ts) in your existing service worker using imports (you can import it separately from /dist/workers/input/InputWorker). An example of how to use it can be found in our described service worker. Afterwards, inform Papyros of the location using the channelOptions described earlier.

### Code editor

The editor used in Papyros is powered by [CodeMirror 6](https://codemirror.net/6/). It is accessible in code via an instance of Papyros and by default allows configuring many options:
- the [programming language](/src/ProgrammingLanguage.ts) of the contents (for e.g. syntax higlighting)
- the displayed placeholder
- the indentation unit
- the shown panel
- the autocompletion source
- the linting source
- the theme used to style the editor

If you need more specific functionality, this can be added in your own code by accessing the internal CodeMirror editorView.

## Documentation

Visit our web page at <https://docs.dodona.be/papyros/>.

## Building and developing

Clone the repository using git.
```shell
git@github.com:dodona-edu/papyros.git
```

Install the required dependencies.
```shell
yarn install
```

Start the local dev-server, powered by webpack.
```shell
yarn start
```

You can now develop with live-reloading.
You can view the results in your browser by visting http://localhost:8080.

## Try it online

Start coding immediately in your [browser](https://papyros.dodona.be/).
