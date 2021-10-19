// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.data`, `.json`,
// and `.wasm` files as well:
importScripts("https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
  });
}
let pyodideReadyPromise = loadPyodideAndPackages();

function onPrint(e){
  console.log("Printing: ", e);
  self.postMessage({"type": "print", "data": e});
}

function onInput(e){
  console.log("Requesting input: ", e);
  self.postMessage({"type": "input", "data": e});
}

self.onmessage = async (event) => {
  // make sure loading is done
  await pyodideReadyPromise;
  // Don't bother yet with this line, suppose our API is built in such a way:
  const { python, ...context } = event.data;
  // The worker copies the context in its own "memory" (an object mapping name to values)
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }
  // Now is the easy part, the one that is similar to working in the main thread:
  try {
    await self.pyodide.loadPackagesFromImports(python);
    let results = await self.pyodide.runPythonAsync(python);
    console.log("ran code: " + python + " and received: ", results);
    self.postMessage({ "type": "success", "data": results });
  } catch (error) {
    console.log("error in webworker:", error)
    self.postMessage({ "type": "error", data: error.message });
  }
};