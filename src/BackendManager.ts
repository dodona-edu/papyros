import { Remote, wrap } from 'comlink';
import { Backend } from "./Backend";

export function getBackend(language: string): Remote<Backend> {
    language = language.toLowerCase();
    let worker;
    switch(language){
        // Requires switch to have actual string constants and make webpack bundle the workers
        case "python": {
            worker = new Worker("./workers/python", {
                type: 'module',
            });
            break;
        }
        /*
        case "javascript": {
            worker = new Worker("./workers/javascript", {
                type: 'module',
            });
            break;
        }
        */
        default: {
            throw new Error(`${language} is not yet supported.`);
        }
    }
    return wrap<Backend>(worker);
}