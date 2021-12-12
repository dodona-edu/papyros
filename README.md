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

Papyros is a programming scratchpad in the browser. It allows running arbitrary
in various programming languages directly in your browser, no installation required.
By taking away obstacles between students and coding, the learning experience becomes
smoother and less error-prone. 

Papyros aims to be:

- **Easy to use** by having minimal installation instructions and an intuitive user interface
- **Flexible** to support many programming languages

Currently, Papyros provides support for the following programming languages:
- Python, powered by [Pyodide](https://pyodide.org/en/stable/)
- JavaScript, powered by your browser

## Installation

You can install Papyros on your system using npm:
```shell
npm install -g @dodona/papyros
```

## Usage

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

Start coding immediately in your [browser](https://docs.dodona.be/papyros/).
