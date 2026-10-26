import{$ as e,B as t,D as n,F as r,I as i,L as a,O as o,Q as s,R as c,S as l,X as u,Z as d,a as f,at as p,b as m,c as h,gt as g,ht as _,i as v,it as y,k as b,n as x,o as S,ot as C,pt as w,q as T,s as E,t as D,tt as O,ut as k,y as A,z as j}from"./followEnd-Rc6hY-of.js";function M(e,t=``){return k`<div class="status-line ${t}">
        ${l()?C:k`<md-circular-progress indeterminate aria-hidden="true"></md-circular-progress>`}${e}
    </div>`}var N=_`
    .status-line {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--md-sys-color-on-surface);
    }

    md-circular-progress {
        --md-circular-progress-size: 14px;
        flex-shrink: 0;
    }
`,P=class{constructor(e){this.host=e,this.refs=[],this.tabs=[],this.previews=new Map,this.failedFiles=new Set,e.addController(this)}t(e,t){return this.host.papyros.i18n.t(e,t)}get declared(){return this.refs.length>0}get configError(){let e=this.refs.find(e=>!y(e.name));if(e)return this.t(`Papyros.playground.invalid_file_name`,{path:e.path});let t=this.refs.map(e=>e.name),n=t.find((e,n)=>t.indexOf(e)!==n);if(n!==void 0)return this.t(`Papyros.playground.duplicate_file_name`,{name:n})}get activeFile(){return this.refs.find(e=>e.name===this.host.papyros.io.activeEditorTab)}hostUpdate(){this.host.files!==this.parsedFrom&&(this.parsedFrom=this.host.files,this.refs=this.host.files.split(/\s+/).filter(e=>e!==``).map(e=>{let t=new URL(e,document.baseURI).href;return{path:e,name:d(t),url:t}}),this.tabs=this.refs.map(e=>({name:e.name,content:``,binary:!1})),this.failedFiles.clear(),this.shownTab=void 0);let e=this.host.papyros.io.activeEditorTab;if(e!==this.shownTab){this.shownTab=e;let t=this.activeFile;t&&(this.clearFailed(t.url),this.previews.has(t.url)||s(t.url).then(e=>{this.previews.set(t.url,e),this.host.requestUpdate()},()=>this.markFailed([t.url])))}}markFailed(e){e.forEach(e=>this.failedFiles.add(e)),this.host.requestUpdate()}clearFailed(e){this.failedFiles.delete(e)&&this.host.requestUpdate()}get failed(){return this.failedFiles.size>0}clearFailures(){this.failedFiles.clear(),this.host.requestUpdate()}async loadForRun(){let e=this.refs,t=await Promise.allSettled(e.map(e=>s(e.url))),n=[],r=[];if(t.forEach((t,i)=>{t.status===`fulfilled`?n.push(t.value):r.push(e[i].url)}),r.length>0)throw this.markFailed(r),Error(`Loading ${r.join(`, `)} failed`);return n}renderTabs(){if(!this.declared)return C;let e=this.host.papyros,t=this.activeFile,r=this.refs.filter(e=>this.previews.has(e.url));return k`
            <p-editor-tabs .papyros=${e} .files=${this.tabs} readonly></p-editor-tabs>
            <div class="file-panel" role="tabpanel" aria-label=${t?.name??C} ?hidden=${!t}>
                ${n(r,e=>e.name,n=>k`<p-file-viewer
                            .papyros=${e}
                            .file=${this.previews.get(n.url)}
                            .url=${n.url}
                            .active=${n===t}
                            readonly
                        ></p-file-viewer>`)}
                ${t&&!this.previews.has(t.url)&&!this.failedFiles.has(t.url)?M(this.t(`Papyros.playground.file_loading`),`file-status`):C}
            </div>
            ${this.refs.filter(e=>this.failedFiles.has(e.url)).map(e=>k`<div class="file-error" role="alert">
                            ${this.t(`Papyros.playground.file_load_failed`,{name:e.name})}
                        </div>`)}
        `}renderCodePanel(e){return this.declared?k`<div
            class="code-panel"
            role="tabpanel"
            aria-label=${this.t(`Papyros.editor_tab_code`)}
            ?hidden=${this.activeFile!==void 0}
        >
            ${e}
        </div>`:e}},F=new WeakMap;function I(e,t){let n=F.get(t.runtime);if(n?.started)t.runner.ensureLaunched().catch(()=>void 0);else{if(!n){let e=new Map,r={waiting:e,started:!1,observer:new IntersectionObserver(t=>{let n=t.find(e=>e.isIntersecting);if(!n)return;r.observer.disconnect(),r.started=!0;let i=e.get(n.target),a=[...e.values()].map(e=>e.runner.ensureLaunched());e.clear(),Promise.all(a).catch(e=>i.reportLaunchFailure(e,`Preloading the code playground runtime failed`))})};n=r,F.set(t.runtime,n)}n.waiting.set(e,t),n.observer.observe(e)}}function L(e,t){let n=F.get(t);n&&!n.started&&(n.observer.unobserve(e),n.waiting.delete(e))}var R,z=class{constructor(e,t){this.host=e,this.runsCode=t,e.addController(this)}hostConnected(){this.host.papyros===a&&(R??=new c,this.host.papyros=this.ownPapyros=new i({runtime:R})),this.syncPreload()}hostDisconnected(){this.syncPreload(),queueMicrotask(()=>{!this.host.isConnected&&this.ownPapyros&&this.host.papyros===this.ownPapyros&&(this.disposeOwnPapyros(),this.host.papyros=a)})}hostUpdate(){let{papyros:e,code:t}=this.host;this.ownPapyros&&e!==this.ownPapyros&&this.disposeOwnPapyros(),e!==a&&(e!==this.synced?.papyros||t!==this.synced.code)&&(e.runner.code=t,this.synced={papyros:e,code:t}),this.syncPreload()}disposeOwnPapyros(){this.ownPapyros.dispose(),this.ownPapyros=void 0}syncPreload(){let e=this.host.isConnected&&this.runsCode()?this.host.papyros:void 0;e!==this.preloaded&&(this.preloaded&&L(this.host,this.preloaded.runtime),this.preloaded=e,e&&I(this.host,e))}},B=class{constructor(e,t){this.host=e,this.focusRunStop=t,this.reservedHeight=0,this.launchError=void 0,this.wasAwaitingInput=!1,this.inputLeaving=!1,this.resizing=!1,this.shown=[],this.followEnd=new D(e,()=>this.log),new m(e),e.addController(this)}t(e,t){return this.host.papyros.i18n.t(e,t)}get log(){return this.host.renderRoot.querySelector(`.output`)}get input(){return this.host.renderRoot.querySelector(`.input-row input`)}get busy(){return this.host.papyros.runtime.isRunning(this.host.papyros)}get awaitingInput(){return this.busy&&this.host.papyros.io.awaitingInput}get launchFailed(){return this.launchError!==void 0}setLaunchError(e){this.launchError=e,this.host.requestUpdate()}onLaunchFailed(t){this.setLaunchError(t instanceof e?this.t(`Papyros.unsupported_browser`):this.t(`Papyros.playground.error`))}reset(){this.host.papyros.io.reset(),this.setLaunchError(void 0)}onRunStart(){this.launchError=void 0,this.followEnd.restart();let e=this.log,t=this.host.renderRoot.querySelector(`.output-body`);this.reservedHeight=e&&t?Math.min(t.offsetHeight,e.clientHeight-(e.scrollHeight-t.offsetHeight)):0,this.host.requestUpdate()}hostUpdate(){let e=this.awaitingInput,t=this.input;this.inputLeaving=!e&&t!==null&&this.host.renderRoot.activeElement===t;let n=[this.host.papyros.io.output.length===0,this.computePanels().errors.length,this.busy,this.launchError,e];n.some((e,t)=>e!==this.shown[t])&&(this.shown=n,this.resize?.capture(),this.resizing=!0)}hostUpdated(){let e=this.host.renderRoot.querySelector(`.panels`);e===this.resizeHost?this.resizing&&this.resize?.play():(this.resize?.cancel(),this.resizeHost=e??void 0,this.resize=e?new A(e):void 0),this.resizing=!1;let t=this.awaitingInput;t&&!this.wasAwaitingInput?this.input?.focus():this.inputLeaving&&this.focusRunStop(),this.wasAwaitingInput=t,this.inputLeaving=!1}onInputKeydown(e){if(e.key!==`Enter`||e.isComposing||e.keyCode===229)return;e.preventDefault();let t=e.target,n=t.value;this.host.papyros.io.provideInput(n),t.value=``}renderInput(){let e=this.host.papyros.io.prompt;return k`
            <div class="input-row">
                ${e?k`<span class="prompt" id="prompt">${e}</span>`:C}
                <input
                    type="text"
                    aria-label=${this.t(`Papyros.playground.input_label`)}
                    aria-describedby=${e?`prompt`:C}
                    placeholder=${this.t(`Papyros.playground.input_placeholder`)}
                    @keydown=${e=>this.onInputKeydown(e)}
                />
            </div>
        `}bodyReservationStyle(e){return e?{"--reserved-height":`${this.reservedHeight}px`}:{}}computePanels(){let e=this.host.papyros,t=e.io.output;if(this.panelsCache?.source===t)return this.panelsCache;let n=[],r=[],i=[],a=()=>{i.length>0&&(n.push(k`<pre class="transcript">${i}</pre>`),i=[])},o=e.constants.maxOutputLength,{shown:s,truncated:c}=E(t,o);for(let t of s)t.type===T.stderr?r.push(t):t.type===T.stdout&&typeof t.content==`string`?i.push(t.content):t.type===T.img&&(a(),n.push(f(t,e)));a(),c&&n.push(S(e,o));let l={source:t,outputBlocks:n,errors:r};return this.panelsCache=l,l}renderPanels(){return k`<div class="panels">
            ${this.awaitingInput?this.renderInput():C} ${this.renderOutput()}
        </div>`}renderOutput(){let e=this.busy;if(this.host.papyros.io.output.length===0&&!e)return this.launchError===void 0?C:this.renderError(this.launchError);let{outputBlocks:t,errors:n}=this.computePanels();return k`
            <div
                class="output"
                role="log"
                tabindex="0"
                aria-live="polite"
                aria-label=${this.t(`Papyros.playground.output_label`)}
                @scroll=${this.followEnd.onScroll}
            >
                <div class="panel-label">${this.t(`Papyros.playground.output_panel_label`)}</div>
                <div class="output-body" style=${h(this.bodyReservationStyle(e))}>
                    ${t.length===0&&e?M(this.host.papyros.runner.stateMessage):t}
                </div>
            </div>
            ${n.map(e=>this.renderError(e.content))}
            ${this.launchError===void 0?C:this.renderError(this.launchError)}
        `}renderError(e){return k`<div class="error">${v(e,this.host.papyros,!0)}</div>`}},V=_`
    :host {
        display: block;
        margin: 24px 0;
        color: var(--md-sys-color-on-surface);
    }

    .card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-size: 16px;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        box-shadow:
            0 2px 4px -1px rgb(0, 0, 0, 0.14),
            0 4px 5px 0 rgb(0, 0, 0, 0.098),
            0 1px 10px 0 rgb(0, 0, 0, 0.084);
    }

    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px 10px 16px;
        background: var(--md-sys-color-primary-container);
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        color: var(--md-sys-color-on-primary-container);
    }

    .title {
        min-width: 0;
        font-size: 16px;
        font-weight: 500;
        overflow-wrap: break-word;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
    }

    .text-button,
    .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        border: 0;
        border-radius: 20px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
    }

    .text-button {
        padding: 0 14px;
        background: none;
        color: var(--md-sys-color-primary);
        transition: background 145ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .text-button:hover:not([aria-disabled="true"]) {
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
    }

    .pill {
        padding: 0 18px;
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        transition: box-shadow 145ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pill:hover:not([aria-disabled="true"]) {
        box-shadow:
            0 2px 4px -1px rgb(0, 0, 0, 0.14),
            0 4px 5px 0 rgb(0, 0, 0, 0.098),
            0 1px 10px 0 rgb(0, 0, 0, 0.084);
    }

    /* aria-disabled buttons stay focusable so screen readers can reach their reason
       text, so they need the disabled look without the disabled attribute. */
    button[aria-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .icon {
        display: inline-flex;
        flex: none;
    }

    .icon svg {
        width: 18px;
        height: 18px;
    }

    p-code {
        display: block;
        height: auto;
        min-height: 40px;
    }
`,H=_`
    .input-row,
    .output,
    .error {
        padding: 14px 16px;
        border-top: 1px solid var(--md-sys-color-outline-variant);
        font-size: 14px;
        line-height: 22px;
    }

    /* Not on .output itself: its panel label keeps the page's font */
    .input-row,
    .output-body,
    .error {
        font-family: sfmono-regular, menlo, monaco, consolas, "Liberation Mono", "Courier New", monospace;
    }

    .input-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        background: var(--md-sys-color-surface);
    }

    .prompt {
        white-space: pre-wrap;
        color: var(--md-sys-color-on-surface);
    }

    .input-row input {
        flex: 1;
        font: inherit;
        border: 0;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: inherit;
        padding: 2px 0;
    }

    .input-row input:focus {
        outline: none;
        border-bottom-color: var(--md-sys-color-primary);
    }

    .input-row input::placeholder {
        color: var(--md-sys-color-on-surface-variant);
    }

    .panel-label {
        margin-bottom: 6px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--md-sys-color-on-surface);
    }

    .output {
        max-height: 300px;
        overflow: auto;
        background: var(--md-sys-color-surface-container-high);
        color: var(--md-sys-color-on-surface);
    }

    /* --reserved-height holds the height of the previous output during a run */
    .output-body {
        min-height: max(22px, var(--reserved-height, 0px));
    }

    .transcript {
        margin: 0;
        padding: 0;
        white-space: pre-wrap;
        word-break: normal;
        overflow-wrap: break-word;
        font: inherit;
    }

    .error {
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
    }
`,U=_`
    .config-error {
        padding: 14px 16px;
        background: var(--md-sys-color-error-container);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        color: var(--md-sys-color-on-error-container);
    }

    .config-error-title {
        font-weight: 700;
    }
`,W=_`
    [hidden] {
        display: none;
    }

    /* Each preview scrolls on its own, so a hidden one keeps its scroll position. */
    .file-panel p-file-viewer {
        height: auto;
        max-height: 300px;
    }

    .file-status {
        padding: 14px 16px;
        font-size: 14px;
    }

    .file-error {
        padding: 14px 16px;
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
        font-size: 14px;
    }
`,G=class extends r{constructor(...e){super(...e),this.code=``,this.programmingLanguage=`python`,this.files=``,this.runStopButton=o(),this.instance=new z(this,()=>this.supported),this.output=new B(this,()=>this.focusRunStop()),this.dataFiles=new P(this)}static get styles(){return[V,W,H,N,U,x]}get supported(){return this.programmingLanguage.toLowerCase()===`python`}get isActive(){return this.papyros.runtime.isRunning(this.papyros)}get otherRunning(){let e=this.papyros.runtime.currentRun;return e!==null&&e.owner!==this.papyros}get canReset(){return!this.isActive&&(this.papyros.runner.code!==this.code||this.papyros.io.output.length>0||this.output.launchFailed||this.dataFiles.failed)}get titleText(){return this.label??this.t(`Papyros.playground.title`)}focusRunStop(){this.runStopButton.value?.focus()}run(){this.output.onRunStart(),this.dataFiles.clearFailures(),this.papyros.runner.ensureLaunched().catch(e=>{this.papyros.reportLaunchFailure(e,`Launching the code playground runtime failed`),this.output.onLaunchFailed(e)}),this.papyros.runner.start(O.Run,{files:this.dataFiles.loadForRun()}).catch(e=>this.papyros.errorHandler(e))}onRunStopClick(){this.isActive?this.papyros.runner.stop():this.otherRunning||this.run()}reset(e){this.canReset&&(this.shadowRoot?.activeElement===e.currentTarget&&this.updateComplete.then(()=>this.focusRunStop()),this.papyros.runner.code=this.code,this.output.reset(),this.dataFiles.clearFailures())}render(){if(!this.supported)return this.renderConfigError(this.t(`Papyros.playground.unsupported_language`,{language:this.programmingLanguage}));let e=this.dataFiles.configError;return e===void 0?this.renderCard():this.renderConfigError(e)}renderCard(){let e=this.isActive,t=this.otherRunning,n=this.papyros.constants.icons;return k`
            <div class="card" role="group" aria-labelledby=${this.titleText?`title`:C}>
                <div class="toolbar">
                    ${this.titleText?k`<span class="title" id="title">${this.titleText}</span>`:C}
                    <div class="actions">
                        <button
                            class="text-button reset"
                            aria-disabled=${this.canReset?C:`true`}
                            title=${this.t(`Papyros.playground.reset_hint`)}
                            @click=${this.reset}
                        >
                            <span class="icon" aria-hidden="true">${n.restore}</span>
                            ${this.t(`Papyros.playground.reset`)}
                        </button>
                        <button
                            ${b(this.runStopButton)}
                            class="pill ${e?`stop`:`run`}"
                            aria-disabled=${t?`true`:C}
                            aria-describedby=${t?`run-gate`:C}
                            title=${t?this.t(`Papyros.playground.other_running`):C}
                            @click=${this.onRunStopClick}
                        >
                            ${e?C:k`<span class="icon" aria-hidden="true">${n[O.Run]}</span>`}
                            ${e?this.t(`Papyros.playground.stop`):this.t(`Papyros.playground.run`)}
                        </button>
                        ${t?k`<span id="run-gate" class="visually-hidden"
                                      >${this.t(`Papyros.playground.other_running`)}</span
                                  >`:C}
                    </div>
                </div>
                ${this.dataFiles.renderTabs()}
                ${this.dataFiles.renderCodePanel(k`<p-code .papyros=${this.papyros}></p-code>`)}
                ${this.output.renderPanels()}
            </div>
        `}renderConfigError(e){return k`
            <div class="config-error">
                <div class="config-error-title">${this.t(`Papyros.playground.config_error_title`)}</div>
                <div>${e}</div>
            </div>
        `}};u([w({attribute:!1})],G.prototype,`code`,void 0),u([w({type:String,attribute:`programming-language`})],G.prototype,`programmingLanguage`,void 0),u([w({type:String})],G.prototype,`label`,void 0),u([w({type:String})],G.prototype,`files`,void 0),G=u([g(`p-code-playground`)],G);var K=[{title:`Read a data file`,description:`The file is listed in the tab above the code. Run the code to print it.`,files:`playground/grades.txt`,code:`grade_file = open('grades.txt')
contents = grade_file.read()
grade_file.close()

print(contents)
`},{title:`Other data under the same name`,description:`This block also opens grades.txt, but its file is playground/example-2/grades.txt.`,label:`Other grades`,files:`playground/example-2/grades.txt`,code:`grade_file = open('grades.txt')

total = 0
count = 0
for line in grade_file:
    grade = int(line.strip())
    total += grade
    count += 1

grade_file.close()

print(total/count)
`},{title:`Every run starts clean`,description:`Run this block twice: it prints one line each time.`,label:`Run me twice`,code:`log = open('log.txt', 'a')
log.write('one more line\\n')
log.close()

print(open('log.txt').read())
`},{title:`A workspace of its own`,description:`Files written by the block above are gone: this one lists an empty workspace.`,label:`What is in the workspace?`,code:`import os
print(os.listdir())
`},{title:`Input`,description:`Run it and type a name in the input field.`,code:`name = input("What is your name? ")
print(f"Hello, {name}!")
`},{title:`A traceback`,description:`The error shows below the output that came before it.`,code:`print("Dividing...")
print(1 / 0)
`},{title:`Several files, one of them an image`,description:`Binary files are not previewed: the tab links to the file instead.`,files:`playground/grades.txt playground/dodona.png`,code:`import os
print(sorted(os.listdir()))
print(os.path.getsize('dodona.png'), 'bytes')
`},{title:`A missing file`,description:`The file cannot be loaded, so an alert shows and the code does not run.`,files:`playground/missing.txt`,code:`print(open('missing.txt').read())
`},{title:`A long-running loop`,description:`Run it, then try Stop. While it runs, the Run buttons of the other blocks are disabled.`,label:`Stop me`,code:`import time

counter = 0
while True:
    counter += 1
    print(counter)
    time.sleep(1)
`}],q=class extends p{constructor(...e){super(...e),this.runtime=new c,this.playgrounds=K.map(()=>new i({runtime:this.runtime})),this.darkQuery=window.matchMedia(`(prefers-color-scheme: dark)`),this.onSchemeChange=()=>this.applyTheme()}static get styles(){return _`
            :host {
                display: block;
                min-height: 100vh;
                box-sizing: border-box;
                padding: 1rem 1.5rem 3rem;
                background-color: var(--md-sys-color-background);
                color: var(--md-sys-color-on-background);
                font-family: Roboto, "Helvetica Neue", sans-serif;
            }

            main {
                max-width: 900px;
                margin: 0 auto;
            }

            h1 {
                color: var(--md-sys-color-primary);
            }

            h2 {
                margin-bottom: 0.25rem;
                font-size: 1.25rem;
            }

            p {
                margin: 0.25rem 0;
            }

            a {
                color: var(--md-sys-color-primary);
            }
        `}connectedCallback(){super.connectedCallback(),this.applyTheme(),this.darkQuery.addEventListener(`change`,this.onSchemeChange)}disconnectedCallback(){super.disconnectedCallback(),this.darkQuery.removeEventListener(`change`,this.onSchemeChange)}applyTheme(){let e=this.darkQuery.matches;document.documentElement.style.setProperty(`color-scheme`,e?`dark`:`light`),document.adoptedStyleSheets=[(e?j:t).styleSheet]}render(){return k`
            <main>
                <h1>Papyros code playgrounds</h1>
                <p>
                    Each block below is a <code>&lt;p-code-playground&gt;</code> with its own Papyros instance. They
                    share one runtime, so Python boots once and the blocks take turns running.
                </p>
                ${K.map((e,t)=>k`
                        <section>
                            <h2>${e.title}</h2>
                            <p>${e.description}</p>
                            <p-code-playground
                                .papyros=${this.playgrounds[t]}
                                .code=${e.code}
                                .label=${e.label}
                                files=${e.files??``}
                            ></p-code-playground>
                        </section>
                    `)}
            </main>
        `}};q=u([g(`p-playground-demo`)],q);