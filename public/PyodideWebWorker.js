// webworker.js
// eslint-disable-next-line no-restricted-globals
const workerContext = self;
// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.data`, `.json`,
// and `.wasm` files as well:
importScripts("https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js");
var attempts = 0;
async function loadPyodideAndPackages() {
  workerContext.pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
  });
}
let pyodideReadyPromise = loadPyodideAndPackages();

function onPrint(e){
  console.log("Printing: ", e);
  workerContext.postMessage({"type": "print", "data": e});
}

async function getInput(e){
  console.log("Performing get input");
  if(workerContext.input){
    console.log("Found input: " + workerContext.input);
    return Promise.resolve(workerContext.input);
  } else {
    console.log("Waiting 1000 ms");
    return await new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
      attempts += 1;
      console.log("Waited 1000 ms, trying again with attempt: " + attempts);
      workerContext.postMessage({"type": "input", "data": e});
      return getInput(e);
    });
  }
}

async function onInput(e){
  workerContext.input = "";
  console.log("Requesting input: ", e);
  workerContext.postMessage({"type": "input", "data": e});
  return await getInput(e);
}

workerContext.onmessage = async (event) => {
  console.log("Worker received message: ", event.data);
  const type = event.data.type;
  if(type === "input"){
    workerContext.input = event.data.data;
  } else {
    // make sure loading is done
    await pyodideReadyPromise;
    // Don't bother yet with this line, suppose our API is built in such a way:
    const { python, ...context } = event.data;
    // The worker copies the context in its own "memory" (an object mapping name to values)
    for (const key of Object.keys(context)) {
      workerContext[key] = context[key];
    }
    // Now is the easy part, the one that is similar to working in the main thread:
    try {
      await workerContext.pyodide.loadPackagesFromImports(python);
      let results = await workerContext.pyodide.runPythonAsync(python);
      console.log("ran code: " + python + " and received: ", results);
      workerContext.postMessage({ "type": "success", "data": results });
    } catch (error) {
      console.log("error in webworker:", error)
      workerContext.postMessage({ "type": "error", data: error.message });
    }
  }

};