import * as Comlink from "comlink";
import PythonWorker from "./PythonWorker";

const worker = new PythonWorker();
Comlink.expose(worker);
