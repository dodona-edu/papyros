import {State, stateProperty} from "@dodona/lit-state";
import {RunMode} from "../../backend/Backend";
import {html, CSSResult} from "lit";
import {material} from "../components/code_mirror/MaterialTheme";
import {Extension} from "@codemirror/state";
import blueLight from "./themes/blue-light";
import blueDark from "./themes/blue-dark";
import greenLight from "./themes/green-light";
import greenDark from "./themes/green-dark";
import redLight from "./themes/red-light";
import redDark from "./themes/red-dark";

export type ThemeOption = {
    theme: CSSResult;
    dark: boolean;
    name: string;
};

export class Constants extends State {
    /**
     * The maximum length of the output (in lines).
     * Default is 1000 lines.
     * If the output exceeds this length, it will be truncated.
     * Overflowing output will be downloadable.
     */
    @stateProperty
    maxOutputLength: number = 1000;
    /**
     * The maximum number of debug frames
     * Default is 10000 frames.
     * If the number of frames exceeds this limit, execution will be stopped.
     */
    @stateProperty
    maxDebugFrames: number = 10000;

    @stateProperty
    icons = {
        [RunMode.Debug]: html`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7H16.19C15.74 6.2 15.12 5.5 14.37 5L16 3.41L14.59 2L12.42 4.17C11.96 4.06 11.5 4 11 4S10.05 4.06 9.59 4.17L7.41 2L6 3.41L7.62 5C6.87 5.5 6.26 6.21 5.81 7H3V9H5.09C5.03 9.33 5 9.66 5 10V11H3V13H5V14C5 14.34 5.03 14.67 5.09 15H3V17H5.81C7.26 19.5 10.28 20.61 13 19.65V19C13 18.43 13.09 17.86 13.25 17.31C12.59 17.76 11.8 18 11 18C8.79 18 7 16.21 7 14V10C7 7.79 8.79 6 11 6S15 7.79 15 10V14C15 14.19 15 14.39 14.95 14.58C15.54 14.04 16.24 13.62 17 13.35V13H19V11H17V10C17 9.66 16.97 9.33 16.91 9H19V7M13 9V11H9V9H13M13 13V15H9V13H13M17 16V22L22 19L17 16Z"/>
            </svg>`,
        [RunMode.Run]: html`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><
                <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>`,
        [RunMode.Doctest]: html`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><
                <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>`,
        stop: html`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18,18H6V6H18V18Z"/>
            </svg>`,
        stopDebug: html`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7H16.19C15.74 6.2 15.12 5.5 14.37 5L16 3.41L14.59 2L12.42 4.17C11.96 4.06 11.5 4 11 4S10.05 4.06 9.59 4.17L7.41 2L6 3.41L7.62 5C6.87 5.5 6.26 6.21 5.81 7H3V9H5.09C5.03 9.33 5 9.66 5 10V11H3V13H5V14C5 14.34 5.03 14.67 5.09 15H3V17H5.81C7.26 19.5 10.28 20.61 13 19.65V19C13 18.43 13.09 17.86 13.25 17.31C12.59 17.76 11.8 18 11 18C8.79 18 7 16.21 7 14V10C7 7.79 8.79 6 11 6S15 7.79 15 10V14C15 14.19 15 14.39 14.95 14.58C15.54 14.04 16.24 13.62 17 13.35V13H19V11H17V10C17 9.66 16.97 9.33 16.91 9H19V7M13 9V11H9V9H13M13 13V15H9V13H13M16 16H22V22H16V16Z"/>
            </svg>`,
        info: html`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
            </svg>
        `,
        help: html`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                <path d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
            </svg>
        `
    };

    @stateProperty
    indentationSize: number = 4;

    @stateProperty
    CodeMirrorTheme: Extension = material;

    @stateProperty
    themes: Record<string, ThemeOption> = {
        "Blue Light": {theme: blueLight, dark: false, name: "Blue Light"},
        "Blue Dark": {theme: blueDark, dark: true, name: "Blue Dark"},
        "Green Light": {theme: greenLight, dark: false, name: "Green Light"},
        "Green Dark": {theme: greenDark, dark: true, name: "Green Dark"},
        "Red Light": {theme: redLight, dark: false, name: "Red Light"},
        "Red Dark": {theme: redDark, dark: true, name: "Red Dark"},
    };

    @stateProperty
    private _activeThemeName: string = "Blue Light";

    @stateProperty
    get activeTheme(): ThemeOption {
        return this.themes[this._activeThemeName];
    }

    @stateProperty
    set activeTheme(value: ThemeOption) {
        this._activeThemeName = value.name;
    }
}