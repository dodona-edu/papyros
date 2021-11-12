import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import { MAIN_APP_ID } from './Constants';
import { Papyros } from './Papyros';
import { papyrosLog, LogType } from './util/Logging';

const RELOAD_STORAGE_KEY = "__papyros_reloading";
const SERVICE_WORKER_PATH = "./inputServiceWorker.js";

if(window.localStorage.getItem(RELOAD_STORAGE_KEY)){
    // We are the result of the page reload, so we can start
    window.localStorage.removeItem(RELOAD_STORAGE_KEY);
    startPapyros();
} else {
    if(typeof SharedArrayBuffer === "undefined"){
        papyrosLog(LogType.Important, "SharedArrayBuffers are not available. ");
        if("serviceWorker" in navigator){
            papyrosLog(LogType.Important, "Registering service worker.");
            // Store that we are reloading, to prevent the next load from doing all this again
            window.localStorage.setItem(RELOAD_STORAGE_KEY, RELOAD_STORAGE_KEY);
            navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "" })
                // service worker adds new headers that may allow SharedArrayBuffers to be used anyway
                .then(() => window.location.reload());
        } else {
            document.getElementById(MAIN_APP_ID)!.innerHTML = "Your browser is unsupported. Please use a modern version of Chrome, Safari, Firefox, ...";
        }
    } else {
        startPapyros();
    }
}


function startPapyros(){
    let inputTextArray: Uint8Array | undefined = undefined;
    let inputMetaData: Int32Array | undefined = undefined;
    if(typeof SharedArrayBuffer !== "undefined"){
        papyrosLog(LogType.Important, "Using SharedArrayBuffers");
        // shared memory
        inputTextArray = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * 1024));
        // 2 Int32s: index 0 indicates whether data is written, index 1 denotes length of the string
        inputMetaData = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));
    } else {
        papyrosLog(LogType.Important, "Using serviceWorker for input");
    }

    Papyros(inputTextArray, inputMetaData);
}