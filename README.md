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

You can install Papyros on your system using npm:
```shell
npm install -g @dodona/papyros
```

Papyros currently supports two modes of operation: stand-alone and embedded.

In stand-alone mode, Papyros runs as a full application in the browser. 
This includes extra UI elements to allow selecting a locale, a programming language, ...

In embedded mode, the layout is reduced to the minimum. Dynamic selections are not displayed,
as the user knows for what purpose Papyros is being used. For example, when used in the
scope of a Python exercise in Dodona, there is no need to support other programming languages.
The locale should also match that of the actual application.

The easiest way to initialize Papyros is by using the static method Papyros.fromElement.
This method expects a parent element that wraps the scratchpad and a PapyrosConfig object.
The following options are supported:
- standAlone: Whether to operate in stand-alone or embedded mode as described above.
- locale: The locale to use, currently English and Dutch translations are provided.
- programmingLanguage: The language to use in the CodeEditor and Backend
- inputMode: How the users can provide input, according to the [InputMode enum](/src/InputManager.ts)

Furthermore, you can provide fine-grained configuration in embedded mode by providing RenderOptions
to each main component in the application. You minimally need to specify the ID of the parent element.
You can also specify attributes, such as style or data, or classNames to be used.
The main components are the following:
- code -> the CodeEditor
- panel -> the StatusPanel in the CodeEditor
- input -> The field for the user input
- output -> The panel for output of the code

### User input

Important to note is that handling asynchronous input in a synchronous way is not straightforward.
This requires advanced features which are not available by default in your browser. We support two options

The most efficient and practical way is using SharedArrayBuffers, which requires the presence of certain HTTP headers.
The following headers must be set on resources using Papyros.
```json
'Cross-Origin-Opener-Policy': 'same-origin',
'Cross-Origin-Embedder-Policy': 'require-corp'
```
If you are also embedding other components (such as iframes) in those pages, you will also need to set
'Cross-Origin-Resource-Policy' to 'cross-origin' to make them work correctly. In order to limit the effect of this
change, it is advised to restrict access using the 'Access-Control-Allow-Origin'-header to prevent abuse of including code.

If you would like to use this project without enabling these HTTP headers, we provide a solution using a service worker.
If your application does not use a service worker yet, a default service worker is pre-built and included in the package.
Simply copy the file located [here](dist/inputServiceWorker.js) to a location of choice in your application where it can be served.
Then, before launching your instance of Papyros, make a call to configureInput with the location of the folder and the name of the file.

If you already use a service worker, simply include our functionality in your existing worker using imports. An example can be found [here](src/InputServiceWorker.ts). Afterwards, inform Papyros of this using configureInput as above.

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
