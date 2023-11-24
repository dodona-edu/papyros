import * as Comlink from "comlink";
import JavaScriptWorker from "./JavaScriptWorker";

const worker = new JavaScriptWorker();
Comlink.expose(worker);
