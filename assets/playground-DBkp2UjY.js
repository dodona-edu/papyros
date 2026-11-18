import{$ as e,Ct as t,E as n,F as r,G as i,H as a,K as o,N as s,O as c,P as l,T as u,U as d,V as f,W as p,a as m,at as h,c as g,d as ee,f as _,ft as v,i as y,it as b,l as x,lt as S,m as C,mt as w,n as T,nt as te,ot as ne,p as E,pt as D,r as O,rt as k,s as A,st as j,t as M,tt as N,u as P,vt as F,wt as I,xt as L}from"./turtle-Bp6wRsIN.js";function R(){return c()?w:F`<md-circular-progress indeterminate aria-hidden="true"></md-circular-progress>`}function z(e,t=``){return F`<div class="status-line ${t}">${R()}${e}</div>`}function B(e){let t=e?F`${R()}<span class="message" title=${e}>${e}</span>`:w;return F`<div class="toolbar-status" role="status" aria-live="polite">${t}</div>`}var V=t`
    .status-line,
    .toolbar-status {
        --md-circular-progress-size: 14px;
    }

    .status-line {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--md-sys-color-on-surface);
    }

    .toolbar-status {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1 1 0;
        min-width: 0;
        font-size: 14px;
    }

    /* Never shrinks below the spinner; the message truncates down to nothing. */
    .toolbar-status:not(:empty) {
        min-width: var(--md-circular-progress-size);
    }

    /* An empty status cancels the toolbar gap it adds. */
    .toolbar-status:empty {
        margin-left: -12px;
    }

    .toolbar-status .message {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .toolbar-status md-circular-progress {
        --md-circular-progress-active-indicator-color: var(--md-sys-color-on-primary-container);
    }

    md-circular-progress {
        flex-shrink: 0;
    }
`,H=class{constructor(e){this.host=e,this.refs=[],this.tabs=[],this.previews=new Map,this.failedFiles=new Set,e.addController(this)}t(e,t){return this.host.papyros.i18n.t(e,t)}get declared(){return this.refs.length>0}get configError(){let e=this.refs.find(e=>!v(e.name));if(e)return this.t(`Papyros.playground.invalid_file_name`,{path:e.path});let t=this.refs.map(e=>e.name),n=t.find((e,n)=>t.indexOf(e)!==n);if(n!==void 0)return this.t(`Papyros.playground.duplicate_file_name`,{name:n})}get activeFile(){return this.refs.find(e=>e.name===this.host.papyros.io.activeEditorTab)}hostUpdate(){this.host.files!==this.parsedFrom&&(this.parsedFrom=this.host.files,this.refs=this.host.files.split(/\s+/).filter(e=>e!==``).map(e=>{let t=new URL(e,document.baseURI).href;return{path:e,name:ne(t),url:t}}),this.tabs=this.refs.map(e=>({name:e.name,content:``,binary:!1})),this.failedFiles.clear(),this.shownTab=void 0);let e=this.host.papyros.io.activeEditorTab;if(e!==this.shownTab){this.shownTab=e;let t=this.activeFile;t&&(this.clearFailed(t.url),this.previews.has(t.url)||j(t.url).then(e=>{this.previews.set(t.url,e),this.host.requestUpdate()},()=>this.markFailed([t.url])))}}markFailed(e){e.forEach(e=>this.failedFiles.add(e)),this.host.requestUpdate()}clearFailed(e){this.failedFiles.delete(e)&&this.host.requestUpdate()}get failed(){return this.failedFiles.size>0}clearFailures(){this.failedFiles.clear(),this.host.requestUpdate()}async loadForRun(){let e=this.refs,t=await Promise.allSettled(e.map(e=>j(e.url))),n=[],r=[];if(t.forEach((t,i)=>{t.status===`fulfilled`?n.push(t.value):r.push(e[i].url)}),r.length>0)throw this.markFailed(r),Error(`Loading ${r.join(`, `)} failed`);return n}renderTabs(){if(!this.declared)return w;let e=this.host.papyros,t=this.activeFile,n=this.refs.filter(e=>this.previews.has(e.url));return F`
            <p-editor-tabs .papyros=${e} .files=${this.tabs} readonly></p-editor-tabs>
            <div class="file-panel" role="tabpanel" aria-label=${t?.name??w} ?hidden=${!t}>
                ${s(n,e=>e.name,n=>F`<p-file-viewer
                            .papyros=${e}
                            .file=${this.previews.get(n.url)}
                            .url=${n.url}
                            .active=${n===t}
                            readonly
                        ></p-file-viewer>`)}
                ${t&&!this.previews.has(t.url)&&!this.failedFiles.has(t.url)?z(this.t(`Papyros.playground.file_loading`),`file-status`):w}
            </div>
            ${this.refs.filter(e=>this.failedFiles.has(e.url)).map(e=>F`<div class="file-error" role="alert">
                            ${this.t(`Papyros.playground.file_load_failed`,{name:e.name})}
                        </div>`)}
        `}renderCodePanel(e){return this.declared?F`<div
            class="code-panel"
            role="tabpanel"
            aria-label=${this.t(`Papyros.editor_tab_code`)}
            ?hidden=${this.activeFile!==void 0}
        >
            ${e}
        </div>`:e}},U=new WeakMap;function W(e,t){let n=U.get(t.runtime);if(n?.started)t.runner.ensureLaunched().catch(()=>void 0);else{if(!n){let e=new Map,r={waiting:e,started:!1,observer:new IntersectionObserver(t=>{let n=t.find(e=>e.isIntersecting);if(!n)return;r.observer.disconnect(),r.started=!0;let i=e.get(n.target),a=[...e.values()].map(e=>e.runner.ensureLaunched());e.clear(),Promise.all(a).catch(e=>i.reportLaunchFailure(e,`Preloading the code playground runtime failed`))})};n=r,U.set(t.runtime,n)}n.waiting.set(e,t),n.observer.observe(e)}}function G(e,t){let n=U.get(t);n&&!n.started&&(n.observer.unobserve(e),n.waiting.delete(e))}var K,q=class{constructor(e,t){this.host=e,this.runsCode=t,e.addController(this)}hostConnected(){this.host.papyros===d&&(K??=new p,this.host.papyros=this.ownPapyros=new a({runtime:K})),this.syncPreload()}hostDisconnected(){this.syncPreload(),queueMicrotask(()=>{!this.host.isConnected&&this.ownPapyros&&this.host.papyros===this.ownPapyros&&(this.disposeOwnPapyros(),this.host.papyros=d)})}hostUpdate(){let{papyros:e,code:t}=this.host;this.ownPapyros&&e!==this.ownPapyros&&this.disposeOwnPapyros(),e!==d&&(e!==this.synced?.papyros||t!==this.synced.code)&&(e.runner.code=t,this.synced={papyros:e,code:t}),this.syncPreload()}disposeOwnPapyros(){this.ownPapyros.dispose(),this.ownPapyros=void 0}syncPreload(){let e=this.host.isConnected&&this.runsCode()?this.host.papyros:void 0;e!==this.preloaded&&(this.preloaded&&G(this.host,this.preloaded.runtime),this.preloaded=e,e&&W(this.host,e))}},J=class{constructor(e,t){this.host=e,this.focusRunStop=t,this.wasAwaitingInput=!1,this.inputLeaving=!1,this.resizing=!1,this.shown=[],this.turtle=new M,this.previousRun={log:!1,reservedHeight:0,canvas:void 0},this.followEnd=new y(e,()=>this.log),e.addController(this)}t(e,t){return this.host.papyros.i18n.t(e,t)}get log(){return this.host.renderRoot.querySelector(`.output`)}get input(){return this.host.renderRoot.querySelector(`.input-row input`)}get busy(){return this.host.papyros.runner.inProgress}get awaitingInput(){return this.host.papyros.runner.lifecycle.status===b.AwaitingInput}get launchError(){let{lifecycle:e,backendStatus:t}=this.host.papyros.runner;if(e.status===b.Ended&&e.outcome===k.LaunchFailed)return t.status===te.Failed&&t.reason===N.UnsupportedBrowser?this.t(`Papyros.unsupported_browser`):this.t(`Papyros.playground.error`)}onRunStart(){this.followEnd.restart();let e=this.log,t=this.host.renderRoot.querySelector(`.output-body`);this.previousRun={log:e!==null,reservedHeight:e&&t?Math.min(t.offsetHeight,e.clientHeight-(e.scrollHeight-t.offsetHeight)):0,canvas:this.computePanels().drawing&&this.turtle.blank()},this.host.requestUpdate()}hostUpdate(){let e=this.awaitingInput,t=this.input;this.inputLeaving=!e&&t!==null&&this.host.renderRoot.activeElement===t;let n=this.view(),r=[n.log,n.canvas&&`${n.canvas.width}x${n.canvas.height}`,n.errors.length,this.busy,n.noOutput,this.launchError!==void 0,e];r.some((e,t)=>e!==this.shown[t])&&(this.shown=r,this.resize?.capture(),this.resizing=!0)}hostUpdated(){let e=this.host.renderRoot.querySelector(`.panels`);e===this.resizeHost?this.resizing&&this.resize?.play():(this.resize?.cancel(),this.resizeHost=e??void 0,this.resize=e?new u(e):void 0),this.resizing=!1;let t=this.awaitingInput;t&&!this.wasAwaitingInput?this.input?.focus():this.inputLeaving&&this.focusRunStop(),this.wasAwaitingInput=t,this.inputLeaving=!1}onInputKeydown(e){if(e.key!==`Enter`||e.isComposing||e.keyCode===229)return;e.preventDefault();let t=e.target,n=t.value;this.host.papyros.io.provideInput(n),t.value=``}renderInput(){let e=this.host.papyros.io.prompt;return F`
            <div class="input-row">
                ${e?F`<span class="prompt" id="prompt">${e}</span>`:w}
                <input
                    type="text"
                    aria-label=${this.t(`Papyros.playground.input_label`)}
                    aria-describedby=${e?`prompt`:w}
                    placeholder=${this.t(`Papyros.playground.input_placeholder`)}
                    @keydown=${e=>this.onInputKeydown(e)}
                />
            </div>
        `}bodyReservationStyle(e){return e?{"--reserved-height":`${this.previousRun.reservedHeight}px`}:{}}computePanels(){let t=this.host.papyros,n=t.io.output;if(this.panelsCache?.source===n)return this.panelsCache;let r=[],i=[],a=[],o=[],s=()=>{o.length>0&&(r.push(F`<pre class="transcript">${o}</pre>`),o=[])},c=t.constants.maxOutputLength,{shown:l,hidden:u}=E(n,c);for(let n of l)n.type===e.turtle?a.push(n.content):n.type===e.stderr?i.push(n):n.type===e.stdout&&typeof n.content==`string`?o.push(n.content):n.type===e.img&&(s(),r.push(g(n,t)));s(),u.length>0&&r.push(ee(t,u));let d={source:n,logBlocks:r,errors:i,drawing:this.turtle.update(a)};return this.panelsCache=d,d}view(){let e=this.computePanels(),t=this.busy,n=_(this.host.papyros),r=e.drawing??(t?this.previousRun.canvas:void 0),i=e.logBlocks.length>0||n||t&&(r===void 0||this.previousRun.log);return{...e,log:i,noOutput:n,canvas:r}}renderPanels(){let e=this.view(),t=this.launchError;return F`<div class="panels">
            ${this.awaitingInput?this.renderInput():w} ${e.log?this.renderLog(e):w}
            ${e.canvas?this.renderDrawing(e.canvas):w}
            ${e.errors.map(e=>this.renderError(e.content))}
            ${t===void 0?w:this.renderError(t)}
            ${P(this.host.papyros,e.noOutput)}
        </div>`}renderLog(e){return F`
            <div
                class="output"
                role="log"
                tabindex="0"
                aria-live="polite"
                aria-label=${this.t(`Papyros.playground.output_label`)}
                @scroll=${this.followEnd.onScroll}
            >
                <div class="panel-label">${this.t(`Papyros.playground.output_panel_label`)}</div>
                ${e.noOutput?x(this.host.papyros):F`<div class="output-body" style=${C(this.bodyReservationStyle(this.busy))}>
                              ${e.logBlocks}
                          </div>`}
            </div>
        `}renderDrawing(e){return F`
            <div class="drawing">
                <div class="panel-label">${this.t(`Papyros.playground.drawing_panel_label`)}</div>
                <div class="easel">${T(e,this.t(`Papyros.turtle_alt`))}</div>
            </div>
        `}renderError(e){return F`<div class="error">${A(e,this.host.papyros,!0)}</div>`}},Y=t`
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
`,X=t`
    .input-row,
    .output,
    .drawing,
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

    .output,
    .drawing {
        background: var(--md-sys-color-surface-container-high);
        color: var(--md-sys-color-on-surface);
    }

    .output {
        max-height: 300px;
        overflow: auto;
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

    .easel {
        display: flex;
        justify-content: center;
        padding: 4px 0 6px;
    }

    /* The canvas at its own size, scaled down to the card's width and 400px of height. Sized
       from the canvas size, so it takes its place before the image decodes. */
    .easel img.turtle {
        display: block;
        width: min(100%, calc(var(--turtle-width) * 1px), calc(400px * var(--turtle-width) / var(--turtle-height)));
        height: auto;
        aspect-ratio: var(--turtle-width) / var(--turtle-height);
        border-radius: 4px;
        box-shadow:
            0 1px 2px rgb(0, 0, 0, 0.08),
            0 3px 8px rgb(0, 0, 0, 0.07);
    }
`,re=t`
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
`,ie=t`
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
`,Z=class extends f{constructor(...e){super(...e),this.code=``,this.programmingLanguage=`python`,this.files=``,this.reducedMotion=new n(this),this.runStopButton=l(),this.instance=new q(this,()=>this.supported),this.output=new J(this,()=>this.focusRunStop()),this.dataFiles=new H(this)}static get styles(){return[Y,ie,X,V,re,m,O]}get supported(){return this.programmingLanguage.toLowerCase()===`python`}get isActive(){return this.papyros.runner.inProgress}get otherRunning(){let e=this.papyros.runtime.currentRun;return e!==null&&e.owner!==this.papyros}get canReset(){return!this.isActive&&(this.papyros.runner.code!==this.code||this.papyros.runner.lifecycle.status!==b.Idle||this.dataFiles.failed)}get titleText(){return this.label??this.t(`Papyros.playground.title`)}focusRunStop(){this.runStopButton.value?.focus()}run(){this.output.onRunStart(),this.dataFiles.clearFailures(),this.papyros.runner.ensureLaunched().catch(e=>{this.papyros.reportLaunchFailure(e,`Launching the code playground runtime failed`)}),this.papyros.runner.start(S.Run,{files:this.dataFiles.loadForRun()}).catch(e=>this.papyros.errorHandler(e))}onRunStopClick(){this.isActive?this.papyros.runner.stop():this.otherRunning||this.run()}reset(e){this.canReset&&(this.shadowRoot?.activeElement===e.currentTarget&&this.updateComplete.then(()=>this.focusRunStop()),this.papyros.runner.code=this.code,this.papyros.runner.reset(),this.dataFiles.clearFailures())}render(){if(!this.supported)return this.renderConfigError(this.t(`Papyros.playground.unsupported_language`,{language:this.programmingLanguage}));let e=this.dataFiles.configError;return e===void 0?this.renderCard():this.renderConfigError(e)}renderCard(){let e=this.isActive,t=this.otherRunning,n=this.papyros.constants.icons;return F`
            <div class="card" role="group" aria-labelledby=${this.titleText?`title`:w}>
                <div class="toolbar">
                    ${this.titleText?F`<span class="title" id="title">${this.titleText}</span>`:w}
                    ${B(e?this.papyros.runner.statusMessage:``)}
                    <div class="actions">
                        <button
                            class="text-button reset"
                            aria-disabled=${this.canReset?w:`true`}
                            title=${this.t(`Papyros.playground.reset_hint`)}
                            @click=${this.reset}
                        >
                            <span class="icon" aria-hidden="true">${n.restore}</span>
                            ${this.t(`Papyros.playground.reset`)}
                        </button>
                        <button
                            ${r(this.runStopButton)}
                            class="pill ${e?`stop`:`run`}"
                            aria-disabled=${t?`true`:w}
                            aria-describedby=${t?`run-gate`:w}
                            title=${t?this.t(`Papyros.playground.other_running`):w}
                            @click=${this.onRunStopClick}
                        >
                            ${e?w:F`<span class="icon" aria-hidden="true">${n[S.Run]}</span>`}
                            ${e?this.t(`Papyros.playground.stop`):this.t(`Papyros.playground.run`)}
                        </button>
                        ${t?F`<span id="run-gate" class="visually-hidden"
                                      >${this.t(`Papyros.playground.other_running`)}</span
                                  >`:w}
                    </div>
                </div>
                ${this.dataFiles.renderTabs()}
                ${this.dataFiles.renderCodePanel(F`<p-code .papyros=${this.papyros}></p-code>`)}
                ${this.output.renderPanels()}
            </div>
        `}renderConfigError(e){return F`
            <div class="config-error">
                <div class="config-error-title">${this.t(`Papyros.playground.config_error_title`)}</div>
                <div>${e}</div>
            </div>
        `}};h([L({attribute:!1})],Z.prototype,`code`,void 0),h([L({type:String,attribute:`programming-language`})],Z.prototype,`programmingLanguage`,void 0),h([L({type:String})],Z.prototype,`label`,void 0),h([L({type:String})],Z.prototype,`files`,void 0),Z=h([I(`p-code-playground`)],Z);var Q=[{title:`Read a data file`,description:`The file is listed in the tab above the code. Run the code to print it.`,files:`playground/grades.txt`,code:`grade_file = open('grades.txt')
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
`},{title:`A turtle drawing`,description:`The drawing shows below the code. Run it again: the canvas clears and redraws in place.`,label:`Spiral`,code:`import turtle

pen = turtle.Turtle()
pen.speed(0)
pen.width(2)
colors = ["#e63946", "#f4a261", "#e9c46a", "#2a9d8f", "#457b9d", "#6d597a"]
for step in range(90):
    pen.pencolor(colors[step % len(colors)])
    pen.forward(step * 2)
    pen.left(59)
`},{title:`Drawing, printing and input`,description:`Text output and the drawing each get a panel of their own.`,code:`import turtle

sides = int(input("How many sides? "))
for _ in range(sides):
    turtle.forward(300 / sides)
    turtle.left(360 / sides)
print(f"Drew a shape with {sides} sides")
`},{title:`A drawing that builds up`,description:`The canvas updates whenever the program sleeps. A wide canvas scales down to fit.`,code:`import time
import turtle

turtle.setup(800, 300)
turtle.bgcolor("midnightblue")
turtle.pencolor("gold")
turtle.penup()
turtle.goto(-360, 0)
turtle.pendown()
for star in range(8):
    for _ in range(5):
        turtle.forward(60)
        turtle.right(144)
    turtle.penup()
    turtle.forward(90)
    turtle.pendown()
    time.sleep(0.3)
turtle.hideturtle()
`},{title:`A long-running loop`,description:`Run it, then try Stop. While it runs, the Run buttons of the other blocks are disabled.`,label:`Stop me`,code:`import time

counter = 0
while True:
    counter += 1
    print(counter)
    time.sleep(1)
`}],$=class extends D{constructor(...e){super(...e),this.runtime=new p,this.playgrounds=Q.map(()=>new a({runtime:this.runtime})),this.darkQuery=window.matchMedia(`(prefers-color-scheme: dark)`),this.onSchemeChange=()=>this.applyTheme()}static get styles(){return t`
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
        `}connectedCallback(){super.connectedCallback(),this.applyTheme(),this.darkQuery.addEventListener(`change`,this.onSchemeChange)}disconnectedCallback(){super.disconnectedCallback(),this.darkQuery.removeEventListener(`change`,this.onSchemeChange)}applyTheme(){let e=this.darkQuery.matches;document.documentElement.style.setProperty(`color-scheme`,e?`dark`:`light`),document.adoptedStyleSheets=[(e?i:o).styleSheet]}render(){return F`
            <main>
                <h1>Papyros code playgrounds</h1>
                <p>
                    Each block below is a <code>&lt;p-code-playground&gt;</code> with its own Papyros instance. They
                    share one runtime, so Python boots once and the blocks take turns running.
                </p>
                ${Q.map((e,t)=>F`
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
        `}};$=h([I(`p-playground-demo`)],$);