import{A as e,C as t,D as n,E as r,F as i,G as a,H as o,J as s,K as c,M as l,N as u,O as d,P as f,S as p,T as m,U as h,V as ee,W as te,X as g,Y as _,_ as v,at as y,b as ne,c as b,ct as re,d as ie,et as x,f as ae,ft as S,g as C,gt as w,h as oe,ht as T,j as se,k as E,l as ce,m as le,mt as ue,n as de,nt as fe,o as pe,ot as D,p as me,pt as O,q as he,r as ge,rt as _e,s as ve,st as ye,t as be,tt as xe,u as Se,ut as k,v as A,w as Ce,x as we,y as Te}from"./followEnd-q_BuTnNd.js";var Ee=(e,t,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&typeof t!=`object`&&Object.defineProperty(e,t,n),n);function j(e,t){return(n,r,i)=>{let a=t=>t.renderRoot?.querySelector(e)??null;if(t){let{get:e,set:t}=typeof r==`object`?n:i??(()=>{let e=Symbol();return{get(){return this[e]},set(t){this[e]=t}}})();return Ee(n,r,{get(){let n=e.call(this);return n===void 0&&(n=a(this),(n!==null||this.hasUpdated)&&t.call(this,n)),n}})}return Ee(n,r,{get(){return a(this)}})}}var De;function Oe(e){return(t,n)=>Ee(t,n,{get(){return(this.renderRoot??(De??=document.createDocumentFragment())).querySelectorAll(e)}})}function ke(e){return(t,n)=>Ee(t,n,{async get(){return await this.updateComplete,this.renderRoot?.querySelector(e)??null}})}function M(e){return(t,n)=>{let{slot:r,selector:i}=e??{},a=`slot`+(r?`[name=${r}]`:`:not([name])`);return Ee(t,n,{get(){let t=(this.renderRoot?.querySelector(a))?.assignedElements(e)??[];return i===void 0?t:t.filter(e=>e.matches(i))}})}}function Ae(e){return(t,n)=>{let{slot:r}=e??{},i=`slot`+(r?`[name=${r}]`:`:not([name])`);return Ee(t,n,{get(){return(this.renderRoot?.querySelector(i))?.assignedNodes(e)??[]}})}}var je=class extends i{constructor(...e){super(...e),this.reducedMotion=new ne(this)}static get styles(){return T`
            :host {
                display: flex;
                align-items: center;
                min-width: 0;
            }

            [role="status"] {
                display: flex;
                align-items: center;
                gap: 0.375rem;
                min-width: 0;
            }

            .message {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            md-circular-progress {
                --md-circular-progress-size: 1rem;
                flex-shrink: 0;
            }
        `}update(e){this.toggleAttribute(`empty`,!this.papyros.runner.stateMessage),super.update(e)}render(){let e=this.papyros.runner.stateMessage,t=!!e&&![_.Ready,_.Error].includes(this.papyros.runner.state)&&!p();return k`
            <div role="status" aria-live="polite">
                ${t?k`<md-circular-progress indeterminate aria-hidden="true"></md-circular-progress>`:``}
                <!-- The title sits on the text, not on the live region, so it cannot become its name. -->
                <span class="message" title=${e||D}>${e}</span>
            </div>
        `}};je=g([w(`p-run-state`)],je);var Me=class extends y{connectedCallback(){super.connectedCallback(),this.setAttribute(`aria-hidden`,`true`)}render(){return k`<span class="shadow"></span>`}},Ne=T`:host,.shadow,.shadow::before,.shadow::after{border-radius:inherit;inset:0;position:absolute;transition-duration:inherit;transition-property:inherit;transition-timing-function:inherit}:host{display:flex;pointer-events:none;transition-property:box-shadow,opacity}.shadow::before,.shadow::after{content:"";transition-property:box-shadow,opacity;--_level: var(--md-elevation-level, 0);--_shadow-color: var(--md-elevation-shadow-color, var(--md-sys-color-shadow, #000))}.shadow::before{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 3,1) + 2*clamp(0,var(--_level) - 4,1))) calc(1px*(2*clamp(0,var(--_level),1) + clamp(0,var(--_level) - 2,1) + clamp(0,var(--_level) - 4,1))) 0px var(--_shadow-color);opacity:.3}.shadow::after{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 1,1) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(3*clamp(0,var(--_level),2) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(clamp(0,var(--_level),4) + 2*clamp(0,var(--_level) - 4,1))) var(--_shadow-color);opacity:.15}
`;Ne.styleSheet;var Pe=class extends Me{};Pe.styles=[Ne],Pe=A([w(`md-elevation`)],Pe);var Fe=Symbol(`attachableController`),Ie=new MutationObserver(e=>{for(let t of e)t.target[Fe]?.hostConnected()}),Le=class{get htmlFor(){return this.host.getAttribute(`for`)}set htmlFor(e){e===null?this.host.removeAttribute(`for`):this.host.setAttribute(`for`,e)}get control(){return this.host.hasAttribute(`for`)?!this.htmlFor||!this.host.isConnected?null:this.host.getRootNode().querySelector(`#${this.htmlFor}`):this.currentControl||this.host.parentElement}set control(e){e?this.attach(e):this.detach()}constructor(e,t){this.host=e,this.onControlChange=t,this.currentControl=null,e.addController(this),e[Fe]=this,Ie?.observe(e,{attributeFilter:[`for`]})}attach(e){e!==this.currentControl&&(this.setCurrentControl(e),this.host.removeAttribute(`for`))}detach(){this.setCurrentControl(null),this.host.setAttribute(`for`,``)}hostConnected(){this.setCurrentControl(this.control)}hostDisconnected(){this.setCurrentControl(null)}setCurrentControl(e){this.onControlChange(this.currentControl,e),this.currentControl=e}},Re=[`focusin`,`focusout`,`pointerdown`],ze=class extends y{constructor(){super(...arguments),this.visible=!1,this.inward=!1,this.attachableController=new Le(this,this.onControlChange.bind(this))}get htmlFor(){return this.attachableController.htmlFor}set htmlFor(e){this.attachableController.htmlFor=e}get control(){return this.attachableController.control}set control(e){this.attachableController.control=e}attach(e){this.attachableController.attach(e)}detach(){this.attachableController.detach()}connectedCallback(){super.connectedCallback(),this.setAttribute(`aria-hidden`,`true`)}handleEvent(e){if(!e[Be]){switch(e.type){default:return;case`focusin`:this.visible=this.control?.matches(`:focus-visible`)??!1;break;case`focusout`:case`pointerdown`:this.visible=!1}e[Be]=!0}}onControlChange(e,t){for(let n of Re)e?.removeEventListener(n,this),t?.addEventListener(n,this)}update(e){e.has(`visible`)&&this.dispatchEvent(new Event(`visibility-changed`)),super.update(e)}};A([O({type:Boolean,reflect:!0})],ze.prototype,`visible`,void 0),A([O({type:Boolean,reflect:!0})],ze.prototype,`inward`,void 0);var Be=Symbol(`handledByFocusRing`),Ve=T`:host{animation-delay:0s,calc(var(--md-focus-ring-duration, 600ms)*.25);animation-duration:calc(var(--md-focus-ring-duration, 600ms)*.25),calc(var(--md-focus-ring-duration, 600ms)*.75);animation-timing-function:cubic-bezier(0.2, 0, 0, 1);box-sizing:border-box;color:var(--md-focus-ring-color, var(--md-sys-color-secondary, #625b71));display:none;pointer-events:none;position:absolute}:host([visible]){display:flex}:host(:not([inward])){animation-name:outward-grow,outward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));inset:calc(-1*var(--md-focus-ring-outward-offset, 2px));outline:var(--md-focus-ring-width, 3px) solid currentColor}:host([inward]){animation-name:inward-grow,inward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border:var(--md-focus-ring-width, 3px) solid currentColor;inset:var(--md-focus-ring-inward-offset, 0px)}@keyframes outward-grow{from{outline-width:0}to{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes outward-shrink{from{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-grow{from{border-width:0}to{border-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-shrink{from{border-width:var(--md-focus-ring-active-width, 8px)}}@media(prefers-reduced-motion){:host{animation:none}}
`;Ve.styleSheet;var He=class extends ze{};He.styles=[Ve],He=A([w(`md-focus-ring`)],He);var Ue={STANDARD:`cubic-bezier(0.2, 0, 0, 1)`,STANDARD_ACCELERATE:`cubic-bezier(.3,0,1,1)`,STANDARD_DECELERATE:`cubic-bezier(0,0,0,1)`,EMPHASIZED:`cubic-bezier(.3,0,0,1)`,EMPHASIZED_ACCELERATE:`cubic-bezier(.3,0,.8,.15)`,EMPHASIZED_DECELERATE:`cubic-bezier(.05,.7,.1,1)`};function We(){let e=null;return{start(){return e?.abort(),e=new AbortController,e.signal},finish(){e=null}}}var Ge=450,Ke=225,qe=.2,Je=10,Ye=75,Xe=.35,Ze=`::after`,Qe=`forwards`,N;(function(e){e[e.INACTIVE=0]=`INACTIVE`,e[e.TOUCH_DELAY=1]=`TOUCH_DELAY`,e[e.HOLDING=2]=`HOLDING`,e[e.WAITING_FOR_CLICK=3]=`WAITING_FOR_CLICK`})(N||={});var $e=[`click`,`contextmenu`,`pointercancel`,`pointerdown`,`pointerenter`,`pointerleave`,`pointerup`],et=150,tt=window.matchMedia(`(forced-colors: active)`),nt=class extends y{constructor(){super(...arguments),this.disabled=!1,this.hovered=!1,this.pressed=!1,this.rippleSize=``,this.rippleScale=``,this.initialSize=0,this.state=N.INACTIVE,this.attachableController=new Le(this,this.onControlChange.bind(this))}get htmlFor(){return this.attachableController.htmlFor}set htmlFor(e){this.attachableController.htmlFor=e}get control(){return this.attachableController.control}set control(e){this.attachableController.control=e}attach(e){this.attachableController.attach(e)}detach(){this.attachableController.detach()}connectedCallback(){super.connectedCallback(),this.setAttribute(`aria-hidden`,`true`)}render(){let e={hovered:this.hovered,pressed:this.pressed};return k`<div class="surface ${v(e)}"></div>`}update(e){e.has(`disabled`)&&this.disabled&&(this.hovered=!1,this.pressed=!1),super.update(e)}handlePointerenter(e){this.shouldReactToEvent(e)&&(this.hovered=!0)}handlePointerleave(e){this.shouldReactToEvent(e)&&(this.hovered=!1,this.state!==N.INACTIVE&&this.endPressAnimation())}handlePointerup(e){this.shouldReactToEvent(e)&&(this.state===N.HOLDING?this.state=N.WAITING_FOR_CLICK:this.state===N.TOUCH_DELAY&&(this.state=N.WAITING_FOR_CLICK,this.startPressAnimation(this.rippleStartEvent)))}async handlePointerdown(e){this.shouldReactToEvent(e)&&(this.rippleStartEvent=e,this.isTouch(e)?(this.state=N.TOUCH_DELAY,await new Promise(e=>{setTimeout(e,et)}),this.state===N.TOUCH_DELAY&&(this.state=N.HOLDING,this.startPressAnimation(e))):(this.state=N.WAITING_FOR_CLICK,this.startPressAnimation(e)))}handleClick(){this.disabled||(this.state===N.WAITING_FOR_CLICK?this.endPressAnimation():this.state===N.INACTIVE&&(this.startPressAnimation(),this.endPressAnimation()))}handlePointercancel(e){this.shouldReactToEvent(e)&&this.endPressAnimation()}handleContextmenu(){this.disabled||this.endPressAnimation()}determineRippleSize(){let{height:e,width:t}=this.getBoundingClientRect(),n=Math.max(e,t),r=Math.max(Xe*n,Ye),i=this.currentCSSZoom??1,a=Math.floor(n*qe/i),o=Math.sqrt(t**2+e**2)+Je;this.initialSize=a;let s=(o+r)/a;this.rippleScale=`${s/i}`,this.rippleSize=`${a}px`}getNormalizedPointerEventCoords(e){let{scrollX:t,scrollY:n}=window,{left:r,top:i}=this.getBoundingClientRect(),a=t+r,o=n+i,{pageX:s,pageY:c}=e,l=this.currentCSSZoom??1;return{x:(s-a)/l,y:(c-o)/l}}getTranslationCoordinates(e){let{height:t,width:n}=this.getBoundingClientRect(),r=this.currentCSSZoom??1,i={x:(n/r-this.initialSize)/2,y:(t/r-this.initialSize)/2},a;return a=e instanceof PointerEvent?this.getNormalizedPointerEventCoords(e):{x:n/r/2,y:t/r/2},a={x:a.x-this.initialSize/2,y:a.y-this.initialSize/2},{startPoint:a,endPoint:i}}startPressAnimation(e){if(!this.mdRoot)return;this.pressed=!0,this.growAnimation?.cancel(),this.determineRippleSize();let{startPoint:t,endPoint:n}=this.getTranslationCoordinates(e),r=`${t.x}px, ${t.y}px`,i=`${n.x}px, ${n.y}px`;this.growAnimation=this.mdRoot.animate({top:[0,0],left:[0,0],height:[this.rippleSize,this.rippleSize],width:[this.rippleSize,this.rippleSize],transform:[`translate(${r}) scale(1)`,`translate(${i}) scale(${this.rippleScale})`]},{pseudoElement:Ze,duration:Ge,easing:Ue.STANDARD,fill:Qe})}async endPressAnimation(){this.rippleStartEvent=void 0,this.state=N.INACTIVE;let e=this.growAnimation,t=1/0;typeof e?.currentTime==`number`?t=e.currentTime:e?.currentTime&&(t=e.currentTime.to(`ms`).value),t>=Ke?this.pressed=!1:(await new Promise(e=>{setTimeout(e,Ke-t)}),this.growAnimation===e&&(this.pressed=!1))}shouldReactToEvent(e){if(this.disabled||!e.isPrimary||this.rippleStartEvent&&this.rippleStartEvent.pointerId!==e.pointerId)return!1;if(e.type===`pointerenter`||e.type===`pointerleave`)return!this.isTouch(e);let t=e.buttons===1;return this.isTouch(e)||t}isTouch({pointerType:e}){return e===`touch`}async handleEvent(e){if(!tt?.matches)switch(e.type){case`click`:this.handleClick();break;case`contextmenu`:this.handleContextmenu();break;case`pointercancel`:this.handlePointercancel(e);break;case`pointerdown`:await this.handlePointerdown(e);break;case`pointerenter`:this.handlePointerenter(e);break;case`pointerleave`:this.handlePointerleave(e);break;case`pointerup`:this.handlePointerup(e)}}onControlChange(e,t){for(let n of $e)e?.removeEventListener(n,this),t?.addEventListener(n,this)}};A([O({type:Boolean,reflect:!0})],nt.prototype,`disabled`,void 0),A([S()],nt.prototype,`hovered`,void 0),A([S()],nt.prototype,`pressed`,void 0),A([j(`.surface`)],nt.prototype,`mdRoot`,void 0);var rt=T`:host{display:flex;margin:auto;pointer-events:none}:host([disabled]){display:none}@media(forced-colors: active){:host{display:none}}:host,.surface{border-radius:inherit;position:absolute;inset:0;overflow:hidden}.surface{-webkit-tap-highlight-color:rgba(0,0,0,0)}.surface::before,.surface::after{content:"";opacity:0;position:absolute}.surface::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));inset:0;transition:opacity 15ms linear,background-color 15ms linear}.surface::after{background:radial-gradient(closest-side, var(--md-ripple-pressed-color, var(--md-sys-color-on-surface, #1d1b20)) max(100% - 70px, 65%), transparent 100%);transform-origin:center center;transition:opacity 375ms linear}.hovered::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-ripple-hover-opacity, 0.08)}.pressed::after{opacity:var(--md-ripple-pressed-opacity, 0.12);transition-duration:105ms}
`;rt.styleSheet;var it=class extends nt{};it.styles=[rt],it=A([w(`md-ripple`)],it);function at(e){let t=new MouseEvent(`click`,{bubbles:!0});return e.dispatchEvent(t),t}function ot(e){return e.currentTarget!==e.target||e.composedPath()[0]!==e.target||e.target.disabled?!1:!st(e)}function st(e){let t=ct;return t&&(e.preventDefault(),e.stopImmediatePropagation()),lt(),t}var ct=!1;async function lt(){ct=!0,await null,ct=!1}var P=Symbol(`internals`),ut=Symbol(`privateInternals`);function dt(e){class t extends e{get[P](){return this[ut]||(this[ut]=this.attachInternals()),this[ut]}}return t}var ft=Symbol(`getFormValue`),pt=Symbol(`getFormState`);function mt(e){class t extends e{get form(){return this[P].form}get labels(){return this[P].labels}get name(){return this.getAttribute(`name`)??``}set name(e){this.setAttribute(`name`,e)}get disabled(){return this.hasAttribute(`disabled`)}set disabled(e){this.toggleAttribute(`disabled`,!!e)}attributeChangedCallback(e,t,n){if(e===`name`||e===`disabled`){let n=e===`disabled`?t!==null:t;this.requestUpdate(e,n)}else super.attributeChangedCallback(e,t,n)}requestUpdate(e,t,n){super.requestUpdate(e,t,n),this[P].setFormValue(this[ft](),this[pt]())}[ft](){return this.getAttribute(`value`)}[pt](){return this[ft]()}formDisabledCallback(e){this.disabled=e}}return t.formAssociated=!0,A([O({noAccessor:!0})],t.prototype,`name`,null),A([O({type:Boolean,noAccessor:!0})],t.prototype,`disabled`,null),t}var ht=Symbol(`dispatchHooks`);function gt(e,t){let n=e[ht];if(!n)throw Error(`'${e.type}' event needs setupDispatchHooks().`);n.addEventListener(`after`,t,{once:!0})}var _t=new WeakMap;function vt(e,...t){let n=_t.get(e);n||(n=new Set,_t.set(e,n));for(let r of t)n.has(r)||(e.addEventListener(r,e=>{let t=new EventTarget;e[ht]=t;let n=new AbortController,i=()=>{n.abort(),t.dispatchEvent(new Event(`after`))},a=e=>function(){e.call(this),i()};e.stopPropagation=a(e.stopPropagation),e.stopImmediatePropagation=a(e.stopImmediatePropagation);let o=e.composedPath(),s;s=e.composed&&e.bubbles?o[o.length-1]:e.bubbles?o[0].getRootNode():o[0],s.addEventListener(r,()=>{i()},{once:!0,signal:n.signal})},{capture:!0}),n.add(r))}function yt(e){class t extends e{get name(){return this.getAttribute(`name`)??``}set name(e){this.setAttribute(`name`,e)}constructor(...e){super(...e),this.type=`submit`,this.value=``,vt(this,`click`),this.addEventListener(`click`,async e=>{let t=this.type===`reset`,n=this.type===`submit`,r=this[P],{form:i}=r;i&&(n||t)&&gt(e,()=>{e.defaultPrevented||(t?i.reset():(i.addEventListener(`submit`,e=>{Object.defineProperty(e,"submitter",{configurable:!0,enumerable:!0,get:()=>this})},{capture:!0,once:!0}),r.setFormValue(this.value),i.requestSubmit()))})})}}return A([O()],t.prototype,`type`,void 0),A([O({reflect:!0})],t.prototype,`value`,void 0),t}var bt=C(yt(mt(dt(y)))),F=class extends bt{constructor(){super(),this.softDisabled=!1,this.href=``,this.download=``,this.target=``,this.trailingIcon=!1,this.hasIcon=!1,this.addEventListener(`click`,this.handleClick.bind(this))}focus(){this.buttonElement?.focus()}blur(){this.buttonElement?.blur()}render(){let e=this.disabled||this.softDisabled,t=this.href?this.renderLink():this.renderButton(),n=this.href?`link`:`button`;return k`
      ${this.renderElevationOrOutline?.()}
      <div class="background"></div>
      <md-focus-ring part="focus-ring" for=${n}></md-focus-ring>
      <md-ripple
        part="ripple"
        for=${n}
        ?disabled="${e}"></md-ripple>
      ${t}
    `}renderButton(){let{ariaLabel:e,ariaHasPopup:t,ariaExpanded:n}=this;return k`<button
      id="button"
      class="button"
      ?disabled=${this.disabled}
      aria-disabled=${this.softDisabled||D}
      aria-label="${e||D}"
      aria-haspopup="${t||D}"
      aria-expanded="${n||D}">
      ${this.renderContent()}
    </button>`}renderLink(){let{ariaLabel:e,ariaHasPopup:t,ariaExpanded:n}=this;return k`<a
      id="link"
      class="button"
      aria-label="${e||D}"
      aria-haspopup="${t||D}"
      aria-expanded="${n||D}"
      aria-disabled=${this.disabled||this.softDisabled||D}
      tabindex="${this.disabled&&!this.softDisabled?-1:D}"
      href=${this.href}
      download=${this.download||D}
      target=${this.target||D}
      >${this.renderContent()}
    </a>`}renderContent(){let e=k`<slot
      name="icon"
      @slotchange="${this.handleSlotChange}"></slot>`;return k`
      <span class="touch"></span>
      ${this.trailingIcon?D:e}
      <span class="label"><slot></slot></span>
      ${this.trailingIcon?e:D}
    `}handleClick(e){this.softDisabled||this.disabled&&this.href?(e.stopImmediatePropagation(),e.preventDefault()):ot(e)&&this.buttonElement&&(this.focus(),at(this.buttonElement))}handleSlotChange(){this.hasIcon=this.assignedIcons.length>0}};F.shadowRootOptions={mode:`open`,delegatesFocus:!0},A([O({type:Boolean,attribute:`soft-disabled`,reflect:!0})],F.prototype,`softDisabled`,void 0),A([O()],F.prototype,`href`,void 0),A([O()],F.prototype,`download`,void 0),A([O()],F.prototype,`target`,void 0),A([O({type:Boolean,attribute:`trailing-icon`,reflect:!0})],F.prototype,`trailingIcon`,void 0),A([O({type:Boolean,attribute:`has-icon`,reflect:!0})],F.prototype,`hasIcon`,void 0),A([j(`.button`)],F.prototype,`buttonElement`,void 0),A([M({slot:`icon`,flatten:!0})],F.prototype,`assignedIcons`,void 0);var xt=class extends F{renderElevationOrOutline(){return k`<md-elevation part="elevation"></md-elevation>`}},St=T`:host{--_container-color: var(--md-filled-button-container-color, var(--md-sys-color-primary, #6750a4));--_container-elevation: var(--md-filled-button-container-elevation, 0);--_container-height: var(--md-filled-button-container-height, 40px);--_container-shadow-color: var(--md-filled-button-container-shadow-color, var(--md-sys-color-shadow, #000));--_disabled-container-color: var(--md-filled-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-elevation: var(--md-filled-button-disabled-container-elevation, 0);--_disabled-container-opacity: var(--md-filled-button-disabled-container-opacity, 0.12);--_disabled-label-text-color: var(--md-filled-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-button-disabled-label-text-opacity, 0.38);--_focus-container-elevation: var(--md-filled-button-focus-container-elevation, 0);--_focus-label-text-color: var(--md-filled-button-focus-label-text-color, var(--md-sys-color-on-primary, #fff));--_hover-container-elevation: var(--md-filled-button-hover-container-elevation, 1);--_hover-label-text-color: var(--md-filled-button-hover-label-text-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-color: var(--md-filled-button-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-opacity: var(--md-filled-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-filled-button-label-text-color, var(--md-sys-color-on-primary, #fff));--_label-text-font: var(--md-filled-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-filled-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-filled-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-container-elevation: var(--md-filled-button-pressed-container-elevation, 0);--_pressed-label-text-color: var(--md-filled-button-pressed-label-text-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-color: var(--md-filled-button-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-opacity: var(--md-filled-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-filled-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-button-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-icon-color: var(--md-filled-button-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-color: var(--md-filled-button-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-size: var(--md-filled-button-icon-size, 18px);--_pressed-icon-color: var(--md-filled-button-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_container-shape-start-start: var(--md-filled-button-container-shape-start-start, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-button-container-shape-start-end, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-button-container-shape-end-end, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-button-container-shape-end-start, var(--md-filled-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-filled-button-leading-space, 24px);--_trailing-space: var(--md-filled-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-filled-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-filled-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-filled-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-filled-button-with-trailing-icon-trailing-space, 16px)}
`;St.styleSheet;var Ct=T`md-elevation{transition-duration:280ms}:host(:is([disabled],[soft-disabled])) md-elevation{transition:none}md-elevation{--md-elevation-level: var(--_container-elevation);--md-elevation-shadow-color: var(--_container-shadow-color)}:host(:focus-within) md-elevation{--md-elevation-level: var(--_focus-container-elevation)}:host(:hover) md-elevation{--md-elevation-level: var(--_hover-container-elevation)}:host(:active) md-elevation{--md-elevation-level: var(--_pressed-container-elevation)}:host(:is([disabled],[soft-disabled])) md-elevation{--md-elevation-level: var(--_disabled-container-elevation)}
`;Ct.styleSheet;var wt=T`:host{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end);box-sizing:border-box;cursor:pointer;display:inline-flex;gap:8px;min-height:var(--_container-height);outline:none;padding-block:calc((var(--_container-height) - max(var(--_label-text-line-height),var(--_icon-size)))/2);padding-inline-start:var(--_leading-space);padding-inline-end:var(--_trailing-space);place-content:center;place-items:center;position:relative;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);text-overflow:ellipsis;text-wrap:nowrap;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);vertical-align:top;--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){cursor:default;pointer-events:none}.button{border-radius:inherit;cursor:inherit;display:inline-flex;align-items:center;justify-content:center;border:none;outline:none;-webkit-appearance:none;vertical-align:middle;background:rgba(0,0,0,0);text-decoration:none;min-width:calc(64px - var(--_leading-space) - var(--_trailing-space));width:100%;z-index:0;height:100%;font:inherit;color:var(--_label-text-color);padding:0;gap:inherit;text-transform:inherit}.button::-moz-focus-inner{padding:0;border:0}:host(:hover) .button{color:var(--_hover-label-text-color)}:host(:focus-within) .button{color:var(--_focus-label-text-color)}:host(:active) .button{color:var(--_pressed-label-text-color)}.background{background:var(--_container-color);border-radius:inherit;inset:0;position:absolute}.label{overflow:hidden}:is(.button,.label,.label slot),.label ::slotted(*){text-overflow:inherit}:host(:is([disabled],[soft-disabled])) .label{color:var(--_disabled-label-text-color);opacity:var(--_disabled-label-text-opacity)}:host(:is([disabled],[soft-disabled])) .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}@media(forced-colors: active){.background{border:1px solid CanvasText}:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1;--_disabled-container-opacity: 1;--_disabled-label-text-color: GrayText;--_disabled-label-text-opacity: 1}}:host([has-icon]:not([trailing-icon])){padding-inline-start:var(--_with-leading-icon-leading-space);padding-inline-end:var(--_with-leading-icon-trailing-space)}:host([has-icon][trailing-icon]){padding-inline-start:var(--_with-trailing-icon-leading-space);padding-inline-end:var(--_with-trailing-icon-trailing-space)}::slotted([slot=icon]){display:inline-flex;position:relative;writing-mode:horizontal-tb;fill:currentColor;flex-shrink:0;color:var(--_icon-color);font-size:var(--_icon-size);inline-size:var(--_icon-size);block-size:var(--_icon-size)}:host(:hover) ::slotted([slot=icon]){color:var(--_hover-icon-color)}:host(:focus-within) ::slotted([slot=icon]){color:var(--_focus-icon-color)}:host(:active) ::slotted([slot=icon]){color:var(--_pressed-icon-color)}:host(:is([disabled],[soft-disabled])) ::slotted([slot=icon]){color:var(--_disabled-icon-color);opacity:var(--_disabled-icon-opacity)}.touch{position:absolute;top:50%;height:max(48px,100%);left:0;right:0;transform:translateY(-50%)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) 0}:host([touch-target=none]) .touch{display:none}
`;wt.styleSheet;var Tt=class extends xt{};Tt.styles=[wt,Ct,St],Tt=A([w(`md-filled-button`)],Tt);var Et=class extends F{renderElevationOrOutline(){return k`<div class="outline"></div>`}},Dt=T`:host{--_container-height: var(--md-outlined-button-container-height, 40px);--_disabled-label-text-color: var(--md-outlined-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-button-disabled-label-text-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-button-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-button-disabled-outline-opacity, 0.12);--_focus-label-text-color: var(--md-outlined-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-outlined-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-outlined-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-outlined-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-outlined-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-outlined-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-outlined-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-outlined-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_outline-color: var(--md-outlined-button-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-button-outline-width, 1px);--_pressed-label-text-color: var(--md-outlined-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-outline-color: var(--md-outlined-button-pressed-outline-color, var(--md-sys-color-outline, #79747e));--_pressed-state-layer-color: var(--md-outlined-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-outlined-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-outlined-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-outlined-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-outlined-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-outlined-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-outlined-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-outlined-button-icon-size, 18px);--_pressed-icon-color: var(--md-outlined-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-outlined-button-container-shape-start-start, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-outlined-button-container-shape-start-end, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-outlined-button-container-shape-end-end, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-outlined-button-container-shape-end-start, var(--md-outlined-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-outlined-button-leading-space, 24px);--_trailing-space: var(--md-outlined-button-trailing-space, 24px);--_with-leading-icon-leading-space: var(--md-outlined-button-with-leading-icon-leading-space, 16px);--_with-leading-icon-trailing-space: var(--md-outlined-button-with-leading-icon-trailing-space, 24px);--_with-trailing-icon-leading-space: var(--md-outlined-button-with-trailing-icon-leading-space, 24px);--_with-trailing-icon-trailing-space: var(--md-outlined-button-with-trailing-icon-trailing-space, 16px);--_container-color: none;--_disabled-container-color: none;--_disabled-container-opacity: 0}.outline{inset:0;border-style:solid;position:absolute;box-sizing:border-box;border-color:var(--_outline-color);border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}:host(:active) .outline{border-color:var(--_pressed-outline-color)}:host(:is([disabled],[soft-disabled])) .outline{border-color:var(--_disabled-outline-color);opacity:var(--_disabled-outline-opacity)}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])) .background{border-color:GrayText}:host(:is([disabled],[soft-disabled])) .outline{opacity:1}}.outline,md-ripple{border-width:var(--_outline-width)}md-ripple{inline-size:calc(100% - 2*var(--_outline-width));block-size:calc(100% - 2*var(--_outline-width));border-style:solid;border-color:rgba(0,0,0,0)}
`;Dt.styleSheet;var Ot=class extends Et{};Ot.styles=[wt,Dt],Ot=A([w(`md-outlined-button`)],Ot);var kt=T`:host{--_container-color: var(--md-filled-icon-button-container-color, var(--md-sys-color-primary, #6750a4));--_container-height: var(--md-filled-icon-button-container-height, 40px);--_container-width: var(--md-filled-icon-button-container-width, 40px);--_disabled-container-color: var(--md-filled-icon-button-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-icon-button-disabled-container-opacity, 0.12);--_disabled-icon-color: var(--md-filled-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-filled-icon-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-filled-icon-button-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-icon-color: var(--md-filled-icon-button-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-color: var(--md-filled-icon-button-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_hover-state-layer-opacity: var(--md-filled-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-filled-icon-button-icon-color, var(--md-sys-color-on-primary, #fff));--_icon-size: var(--md-filled-icon-button-icon-size, 24px);--_pressed-icon-color: var(--md-filled-icon-button-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-color: var(--md-filled-icon-button-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_pressed-state-layer-opacity: var(--md-filled-icon-button-pressed-state-layer-opacity, 0.12);--_selected-container-color: var(--md-filled-icon-button-selected-container-color, var(--md-sys-color-primary, #6750a4));--_toggle-selected-focus-icon-color: var(--md-filled-icon-button-toggle-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-hover-icon-color: var(--md-filled-icon-button-toggle-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-hover-state-layer-color: var(--md-filled-icon-button-toggle-selected-hover-state-layer-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-icon-color: var(--md-filled-icon-button-toggle-selected-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-pressed-icon-color: var(--md-filled-icon-button-toggle-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff));--_toggle-selected-pressed-state-layer-color: var(--md-filled-icon-button-toggle-selected-pressed-state-layer-color, var(--md-sys-color-on-primary, #fff));--_unselected-container-color: var(--md-filled-icon-button-unselected-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_toggle-focus-icon-color: var(--md-filled-icon-button-toggle-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-hover-icon-color: var(--md-filled-icon-button-toggle-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-hover-state-layer-color: var(--md-filled-icon-button-toggle-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_toggle-icon-color: var(--md-filled-icon-button-toggle-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-pressed-icon-color: var(--md-filled-icon-button-toggle-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_toggle-pressed-state-layer-color: var(--md-filled-icon-button-toggle-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-filled-icon-button-container-shape-start-start, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-filled-icon-button-container-shape-start-end, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-filled-icon-button-container-shape-end-end, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-filled-icon-button-container-shape-end-start, var(--md-filled-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)))}.icon-button{color:var(--_icon-color)}.icon-button:hover{color:var(--_hover-icon-color)}.icon-button:focus{color:var(--_focus-icon-color)}.icon-button:active{color:var(--_pressed-icon-color)}.icon-button:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}.icon-button{--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.icon-button::before{background-color:var(--_container-color);border-radius:inherit;content:"";inset:0;position:absolute;z-index:-1}.icon-button:is(:disabled,[aria-disabled=true])::before{background-color:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.icon-button:is(:disabled,[aria-disabled=true]) .icon{opacity:var(--_disabled-icon-opacity)}.toggle-filled:not(:disabled,[aria-disabled=true]){color:var(--_toggle-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-hover-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-focus-icon-color)}.toggle-filled:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-pressed-icon-color)}.toggle-filled{--md-ripple-hover-color: var(--_toggle-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-pressed-state-layer-color)}.toggle-filled:not(:disabled,[aria-disabled=true])::before{background-color:var(--_unselected-container-color)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_toggle-selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_toggle-selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_toggle-selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_toggle-selected-pressed-icon-color)}.selected{--md-ripple-hover-color: var(--_toggle-selected-hover-state-layer-color);--md-ripple-pressed-color: var(--_toggle-selected-pressed-state-layer-color)}.selected:not(:disabled,[aria-disabled=true])::before{background-color:var(--_selected-container-color)}
`;kt.styleSheet;var At=Symbol.for(``),jt=e=>{if(e?.r===At)return e?._$litStatic$},Mt=(e,...t)=>({_$litStatic$:t.reduce((t,n,r)=>t+(e=>{if(e._$litStatic$!==void 0)return e._$litStatic$;throw Error(`Value passed to 'literal' function must be a 'literal' result: ${e}. Use 'unsafeStatic' to pass non-literal values, but\n            take care to ensure page security.`)})(n)+e[r+1],e[0]),r:At}),Nt=new Map,Pt=(e=>(t,...n)=>{let r=n.length,i,a,o=[],s=[],c,l=0,u=!1;for(;l<r;){for(c=t[l];l<r&&(a=n[l],(i=jt(a))!==void 0);)c+=i+t[++l],u=!0;l!==r&&s.push(a),o.push(c),l++}if(l===r&&o.push(t[r]),u){let e=o.join(`$$lit$$`);(t=Nt.get(e))===void 0&&(o.raw=o,Nt.set(e,t=o)),n=s}return e(t,...n)})(k);function Ft(e,t=!0){return t&&getComputedStyle(e).getPropertyValue(`direction`).trim()===`rtl`}var It=C(yt(mt(dt(y)))),I=class extends It{constructor(){super(),this.softDisabled=!1,this.flipIconInRtl=!1,this.href=``,this.download=``,this.target=``,this.ariaLabelSelected=``,this.toggle=!1,this.selected=!1,this.flipIcon=Ft(this,this.flipIconInRtl),vt(this,`click`),this.addEventListener(`click`,e=>{if(this.softDisabled||this.disabled&&this.href){e.stopImmediatePropagation(),e.preventDefault();return}let t=this.selected;gt(e,()=>{!this.toggle||this.disabled||e.defaultPrevented||(this.selected=!t,this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0})))})})}willUpdate(){this.href&&(this.disabled=!1,this.softDisabled=!1)}render(){let e=this.href?Mt`div`:Mt`button`,{ariaLabel:t,ariaHasPopup:n,ariaExpanded:r}=this,i=t&&this.ariaLabelSelected,a=this.toggle?this.selected:D,o=D;return this.href||(o=i&&this.selected?this.ariaLabelSelected:t),Pt`<${e}
        class="icon-button ${v(this.getRenderClasses())}"
        id="button"
        aria-label="${o||D}"
        aria-haspopup="${!this.href&&n||D}"
        aria-expanded="${!this.href&&r||D}"
        aria-pressed="${a}"
        aria-disabled=${!this.href&&this.softDisabled||D}
        ?disabled="${!this.href&&this.disabled}">
        ${this.renderFocusRing()}
        ${this.renderRipple()}
        ${this.selected?D:this.renderIcon()}
        ${this.selected?this.renderSelectedIcon():D}
        ${this.href?this.renderLink():this.renderTouchTarget()}
  </${e}>`}renderLink(){let{ariaLabel:e}=this;return k`
      <a
        class="link"
        id="link"
        href="${this.href}"
        download="${this.download||D}"
        target="${this.target||D}"
        aria-label="${e||D}">
        ${this.renderTouchTarget()}
      </a>
    `}getRenderClasses(){return{"flip-icon":this.flipIcon,selected:this.toggle&&this.selected}}renderIcon(){return k`<span class="icon"><slot></slot></span>`}renderSelectedIcon(){return k`<span class="icon icon--selected"
      ><slot name="selected"><slot></slot></slot
    ></span>`}renderTouchTarget(){return k`<span class="touch"></span>`}renderFocusRing(){return k`<md-focus-ring
      part="focus-ring"
      for=${this.href?`link`:`button`}></md-focus-ring>`}renderRipple(){let e=!this.href&&(this.disabled||this.softDisabled);return k`<md-ripple
      for=${this.href?`link`:D}
      ?disabled="${e}"></md-ripple>`}connectedCallback(){this.flipIcon=Ft(this,this.flipIconInRtl),super.connectedCallback()}};I.shadowRootOptions={mode:`open`,delegatesFocus:!0},A([O({type:Boolean,attribute:`soft-disabled`,reflect:!0})],I.prototype,`softDisabled`,void 0),A([O({type:Boolean,attribute:`flip-icon-in-rtl`})],I.prototype,`flipIconInRtl`,void 0),A([O()],I.prototype,`href`,void 0),A([O()],I.prototype,`download`,void 0),A([O()],I.prototype,`target`,void 0),A([O({attribute:`aria-label-selected`})],I.prototype,`ariaLabelSelected`,void 0),A([O({type:Boolean})],I.prototype,`toggle`,void 0),A([O({type:Boolean,reflect:!0})],I.prototype,`selected`,void 0),A([S()],I.prototype,`flipIcon`,void 0);var Lt=T`:host{display:inline-flex;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);height:var(--_container-height);width:var(--_container-width);justify-content:center}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) max(0px,(48px - var(--_container-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){pointer-events:none}.icon-button{place-items:center;background:none;border:none;box-sizing:border-box;cursor:pointer;display:flex;place-content:center;outline:none;padding:0;position:relative;text-decoration:none;user-select:none;z-index:0;flex:1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.icon ::slotted(*){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size);font-weight:inherit}md-ripple{z-index:-1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.flip-icon .icon{transform:scaleX(-1)}.icon{display:inline-flex}.link{display:grid;height:100%;outline:none;place-items:center;position:absolute;width:100%}.touch{position:absolute;height:max(48px,100%);width:max(48px,100%)}:host([touch-target=none]) .touch{display:none}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1}}
`;Lt.styleSheet;var Rt=class extends I{getRenderClasses(){return{...super.getRenderClasses(),filled:!0,"toggle-filled":this.toggle}}};Rt.styles=[Lt,kt],Rt=A([w(`md-filled-icon-button`)],Rt);var zt=T`:host{--_container-height: var(--md-outlined-icon-button-container-height, 40px);--_container-width: var(--md-outlined-icon-button-container-width, 40px);--_disabled-icon-color: var(--md-outlined-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-outlined-icon-button-disabled-icon-opacity, 0.38);--_disabled-selected-container-color: var(--md-outlined-icon-button-disabled-selected-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-selected-container-opacity: var(--md-outlined-icon-button-disabled-selected-container-opacity, 0.12);--_hover-state-layer-opacity: var(--md-outlined-icon-button-hover-state-layer-opacity, 0.08);--_icon-size: var(--md-outlined-icon-button-icon-size, 24px);--_pressed-state-layer-opacity: var(--md-outlined-icon-button-pressed-state-layer-opacity, 0.12);--_selected-container-color: var(--md-outlined-icon-button-selected-container-color, var(--md-sys-color-inverse-surface, #322f35));--_selected-focus-icon-color: var(--md-outlined-icon-button-selected-focus-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-hover-icon-color: var(--md-outlined-icon-button-selected-hover-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-hover-state-layer-color: var(--md-outlined-icon-button-selected-hover-state-layer-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-icon-color: var(--md-outlined-icon-button-selected-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-pressed-icon-color: var(--md-outlined-icon-button-selected-pressed-icon-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_selected-pressed-state-layer-color: var(--md-outlined-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-inverse-on-surface, #f5eff7));--_disabled-outline-color: var(--md-outlined-icon-button-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-icon-button-disabled-outline-opacity, 0.12);--_focus-icon-color: var(--md-outlined-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-outlined-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-outlined-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_icon-color: var(--md-outlined-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_outline-color: var(--md-outlined-icon-button-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-icon-button-outline-width, 1px);--_pressed-icon-color: var(--md-outlined-icon-button-pressed-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_pressed-state-layer-color: var(--md-outlined-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_container-shape-start-start: var(--md-outlined-icon-button-container-shape-start-start, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-outlined-icon-button-container-shape-start-end, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-outlined-icon-button-container-shape-end-end, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-outlined-icon-button-container-shape-end-start, var(--md-outlined-icon-button-container-shape, var(--md-sys-shape-corner-full, 9999px)))}.outlined{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.outlined::before{border-color:var(--_outline-color);border-width:var(--_outline-width)}.outlined:hover{color:var(--_hover-icon-color)}.outlined:focus{color:var(--_focus-icon-color)}.outlined:active{color:var(--_pressed-icon-color)}.outlined:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}.outlined:is(:disabled,[aria-disabled=true])::before{border-color:var(--_disabled-outline-color);opacity:var(--_disabled-outline-opacity)}.outlined:is(:disabled,[aria-disabled=true]) .icon{opacity:var(--_disabled-icon-opacity)}.outlined::before{block-size:100%;border-style:solid;border-radius:inherit;box-sizing:border-box;content:"";inline-size:100%;inset:0;pointer-events:none;position:absolute;z-index:-1}.outlined.selected::before{border-width:0}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.selected:not(:disabled,[aria-disabled=true])::before{background-color:var(--_selected-container-color)}.selected:is(:disabled,[aria-disabled=true])::before{background-color:var(--_disabled-selected-container-color);opacity:var(--_disabled-selected-container-opacity)}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-outline-opacity: 1}.selected::before{border-color:CanvasText;border-width:var(--_outline-width)}.selected:is(:disabled,[aria-disabled=true])::before{border-color:GrayText;opacity:1}}
`;zt.styleSheet;var Bt=class extends I{getRenderClasses(){return{...super.getRenderClasses(),outlined:!0}}};Bt.styles=[Lt,zt],Bt=A([w(`md-outlined-icon-button`)],Bt);var Vt=class extends i{constructor(...e){super(...e),this.hasSlotted=!1,this.compact=!1,this.firstButtonRef=d(),this.firstIconButtonRef=d(),this.renderedSet=void 0,this.shouldRefocus=!1,this.focusedIndexInHiddenRow=void 0,this.wideRef=d(),this.narrowRef=d(),this.slottedRef=d(),this.slotRef=d(),this.resizeObserver=new ResizeObserver(()=>this.dispatchEvent(new Event(`p-button-lint-resize`)))}static get styles(){return T`
            /* A toolbar row of 44px with the hairline of the tab bar next to it, so the two
               read as one bar, and as two stacked bars once a narrow column wraps them.
               It never wraps itself, so the divider cannot end a row: the buttons turn
               into icon buttons instead. */
            :host {
                position: relative;
                overflow: clip;
                display: flex;
                align-items: center;
                min-height: 2.75rem;
                box-sizing: border-box;
                padding: 0.375rem 0.5rem;
                gap: 0.5rem;
                box-shadow: inset 0 -1px 0 var(--md-sys-color-outline-variant);
                background-color: var(--md-sys-color-surface);
                --md-filled-button-container-height: 2rem;
                --md-outlined-button-container-height: 2rem;
                --md-filled-button-with-leading-icon-leading-space: 0.75rem;
                --md-filled-button-with-leading-icon-trailing-space: 1rem;
                --md-outlined-button-with-leading-icon-leading-space: 0.75rem;
                --md-outlined-button-with-leading-icon-trailing-space: 1rem;
                --md-outlined-button-outline-color: var(--md-sys-color-outline-variant);
                --md-filled-icon-button-container-width: 2rem;
                --md-filled-icon-button-container-height: 2rem;
                --md-filled-icon-button-icon-size: 1.125rem;
                --md-outlined-icon-button-container-width: 2rem;
                --md-outlined-icon-button-container-height: 2rem;
                --md-outlined-icon-button-icon-size: 1.125rem;
                --md-outlined-icon-button-outline-color: var(--md-sys-color-outline-variant);
            }

            .buttons,
            .slotted,
            .slotted > slot {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            /* The form that is not shown keeps its size, so the code runner can measure both. */
            .narrow,
            :host([compact]) .wide {
                position: absolute;
                top: 0;
                left: 0;
                width: max-content;
                visibility: hidden;
            }

            :host([compact]) .narrow {
                position: static;
                width: auto;
                visibility: visible;
            }

            .divider {
                width: 1px;
                height: 1.25rem;
                background-color: var(--md-sys-color-outline-variant);
            }

            [hidden] {
                display: none;
            }
        `}get runInProgress(){return this.papyros.runtime.isRunning(this.papyros)}get buttonSet(){return this.runInProgress?`stop`:this.papyros.debugger.active?`stop-debugging`:`run`}willUpdate(e){super.willUpdate(e);let t=this.buttonSet,n=this.shadowRoot?.activeElement!=null;if(this.shouldRefocus=n&&t!==this.renderedSet,this.renderedSet=t,e.has(`compact`)){let e=(this.compact?this.wideRef:this.narrowRef).value,t=Array.from(e?.children??[]).indexOf(this.shadowRoot?.activeElement);this.focusedIndexInHiddenRow=t>=0?t:void 0}}updated(e){super.updated(e),this.focusedIndexInHiddenRow!==void 0&&(((this.compact?this.narrowRef:this.wideRef).value?.children[this.focusedIndexInHiddenRow])?.focus(),this.focusedIndexInHiddenRow=void 0),this.shouldRefocus&&requestAnimationFrame(()=>{[this.firstButtonRef.value,this.firstIconButtonRef.value].find(e=>e?.isConnected&&e.checkVisibility({visibilityProperty:!0}))?.focus()})}get buttonSpecs(){if(!this.runInProgress){let e=!this.papyros.runner.canStart;return this.papyros.debugger.active?[{filled:!1,icon:this.papyros.constants.icons.stopDebug,label:this.t(`Papyros.debug.stop`),disabled:!1,onClick:()=>this.papyros.debugger.active=!1}]:[xe.Run,...this.papyros.runner.runModes].map((t,n)=>({filled:n===0,icon:this.papyros.constants.icons[t],label:this.t(`Papyros.run_modes.${t}`),disabled:e,onClick:()=>void this.papyros.runner.start(t)}))}return[{filled:!0,icon:this.papyros.constants.icons.stop,label:this.t(`Papyros.stop`),disabled:!1,onClick:()=>void this.papyros.runner.stop()}]}renderButton(e,t){let n=t?E(this.firstButtonRef):D,r=k`<span slot="icon">${e.icon}</span>`;return e.filled?k`<md-filled-button ${n} ?disabled=${e.disabled} @click=${e.onClick}>
                  ${r}${e.label}
              </md-filled-button>`:k`<md-outlined-button ${n} ?disabled=${e.disabled} @click=${e.onClick}>
                  ${r}${e.label}
              </md-outlined-button>`}renderIconButton(e,t){let n=t?E(this.firstIconButtonRef):D;return e.filled?k`<md-filled-icon-button
                  ${n}
                  aria-label=${e.label}
                  title=${e.label}
                  ?disabled=${e.disabled}
                  @click=${e.onClick}
              >
                  ${e.icon}
              </md-filled-icon-button>`:k`<md-outlined-icon-button
                  ${n}
                  aria-label=${e.label}
                  title=${e.label}
                  ?disabled=${e.disabled}
                  @click=${e.onClick}
              >
                  ${e.icon}
              </md-outlined-icon-button>`}get slottedWidth(){let e=this.slottedRef.value;return e&&!e.hidden?e.offsetWidth:void 0}neededWidth(e,t){let n=(e?this.narrowRef:this.wideRef).value;if(!n)return 0;let r=getComputedStyle(this),i=parseFloat(r.columnGap)||0,a=parseFloat(r.paddingLeft)+parseFloat(r.paddingRight)+n.offsetWidth;return t!==void 0&&(a+=2*i+1+t),Math.ceil(a)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>this.observeSizes())}disconnectedCallback(){super.disconnectedCallback(),this.resizeObserver.disconnect()}observeSizes(){this.resizeObserver.disconnect();for(let e of[this.wideRef.value,this.narrowRef.value,this.slotRef.value])e&&this.resizeObserver.observe(e)}onSlotChange(e){this.hasSlotted=e.target.assignedElements({flatten:!0}).length>0}render(){let e=this.hasSlotted&&!this.papyros.debugger.active,t=this.buttonSpecs;return k`
            <div class="buttons wide" ${E(this.wideRef)}>
                ${t.map((e,t)=>this.renderButton(e,t===0))}
            </div>
            <div class="buttons narrow" ${E(this.narrowRef)}>
                ${t.map((e,t)=>this.renderIconButton(e,t===0))}
            </div>
            <span class="divider" aria-hidden="true" ?hidden=${!e}></span>
            <div class="slotted" ${E(this.slottedRef)} ?hidden=${!e}>
                <slot ${E(this.slotRef)} @slotchange=${this.onSlotChange}></slot>
            </div>
        `}};g([S()],Vt.prototype,`hasSlotted`,void 0),g([O({type:Boolean,reflect:!0})],Vt.prototype,`compact`,void 0),Vt=g([w(`p-button-lint`)],Vt);var Ht=class extends y{render(){return k`<slot></slot>`}connectedCallback(){super.connectedCallback(),this.getAttribute(`aria-hidden`)===`false`?this.removeAttribute(`aria-hidden`):this.setAttribute(`aria-hidden`,`true`)}},Ut=T`:host{font-size:var(--md-icon-size, 24px);width:var(--md-icon-size, 24px);height:var(--md-icon-size, 24px);color:inherit;font-variation-settings:inherit;font-weight:400;font-family:var(--md-icon-font, Material Symbols Outlined);display:inline-flex;font-style:normal;place-items:center;place-content:center;line-height:1;overflow:hidden;letter-spacing:normal;text-transform:none;user-select:none;white-space:nowrap;word-wrap:normal;flex-shrink:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale}::slotted(svg){fill:currentColor}::slotted(*){height:100%;width:100%}
`;Ut.styleSheet;var Wt=class extends Ht{};Wt.styles=[Ut],Wt=A([w(`md-icon`)],Wt);var Gt=class extends i{constructor(...e){super(...e),this.dragOver=!1,this.showEscapeHint=!1,this.hostTabLabel=void 0,this.hostTabSlotRef=d(),this.hostTabObserver=new MutationObserver(()=>this.readHostTabLabel()),this.toolbarRef=d(),this.toolbarWidthRef=d(),this.tabsRef=d(),this.buttonsRef=d(),this.toolbarObserver=new ResizeObserver(()=>this.updateCompactButtons()),this.labelledSlottedWidth=void 0,this.compactSlottedWidth=void 0,this.compactSlotted=!1,this.focusFromKeyboard=!1,this.onPointerDown=()=>{this.focusFromKeyboard=!1},this.onKeyDown=()=>{this.focusFromKeyboard=!0},this.updateCompactButtons=()=>{let e=this.toolbarRef.value,t=this.tabsRef.value,n=this.buttonsRef.value;if(!e||!t||!n)return;let r=n.slottedWidth;r!==void 0&&(this.compactSlotted?this.compactSlottedWidth=r:this.labelledSlottedWidth=r);let i=r===void 0?void 0:this.labelledSlottedWidth,a=r===void 0?void 0:this.compactSlottedWidth??0,o=e.clientWidth,s=t.contentWidth,c=s+n.neededWidth(!0,a)<=o?o-s:o,l=n.neededWidth(!1,i)<=c,u=n.neededWidth(!0,i)<=c;n.compact=!l,this.compactSlotted=!l&&!u},this.onButtonsSlotChange=()=>{this.labelledSlottedWidth=void 0,this.compactSlottedWidth=void 0,this.compactSlotted=!1},this.onDragOver={capture:!0,handleEvent:e=>{e.preventDefault(),e.stopPropagation(),!this.papyros.debugger.active&&(this.dragOver||=!0)}},this.onDragLeave={capture:!0,handleEvent:e=>{let t=e.currentTarget;e.relatedTarget&&t.contains(e.relatedTarget)||(this.dragOver=!1)}},this.onDrop={capture:!0,handleEvent:e=>this.drop(e)}}static get styles(){return T`
            /* Named, so the host's slotted content can query its width. */
            :host {
                width: 100%;
                display: flex;
                flex-direction: column;
                container: papyros-code-runner / inline-size;
            }

            ${ie}

            .pane {
                flex-grow: 1;
            }

            .drop-zone {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                min-height: 0;
                position: relative;
            }

            .drop-zone.drag-over::after {
                content: "";
                position: absolute;
                inset: 0;
                border: 2px dashed var(--md-sys-color-primary);
                border-radius: 0.625rem;
                background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
                pointer-events: none;
                z-index: 10;
            }

            .toolbar {
                position: relative;
                display: flex;
                flex-wrap: wrap;
                flex-shrink: 0;
            }

            /* Observed for the width of the toolbar. It has no height, so compacting the buttons does
               not resize it when that unwraps the toolbar; observing the toolbar itself made a
               ResizeObserver loop. */
            .toolbar-width {
                position: absolute;
                inset-inline: 0;
                height: 0;
            }

            /* Grows with a taller button row next to it, so the two hairlines stay level. */
            p-editor-tabs {
                flex: 1 1 auto;
                min-width: 0;
                height: auto;
                min-height: 2.75rem;
            }

            /* Grows rather than being pushed to the end, so a wrapped row keeps its hairline across the pane. */
            p-button-lint {
                flex: 1 1 auto;
                min-width: 0;
                justify-content: flex-end;
            }

            ::slotted([slot="host-tab"]) {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
            }

            .editor {
                flex-grow: 1;
                min-height: 0;
                position: relative;
            }

            .host-panel {
                position: absolute;
                inset: 0;
                overflow: auto;
                padding: 0.5rem 0.75rem;
                color: var(--md-sys-color-on-surface);
            }

            .host-panel:focus-visible {
                outline: 2px solid var(--md-sys-color-primary);
                outline-offset: -2px;
            }

            .footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                height: 1.5rem;
                padding: 0 0.75rem;
                flex-shrink: 0;
                border-top: 1px solid var(--md-sys-color-outline-variant);
                font-size: 0.75rem;
                color: var(--md-sys-color-on-surface-variant);
            }

            /* Both give up room long before the run state does: it is the message that changes. */
            .hint,
            .read-only {
                min-width: 0;
                flex-shrink: 100;
            }

            .hint,
            .read-only span {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .hint {
                visibility: hidden;
            }

            .show-escape-hint .hint {
                visibility: visible;
            }

            .read-only {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                color: var(--md-sys-color-primary);
            }

            .read-only md-icon {
                font-size: 1rem;
                width: 1rem;
                height: 1rem;
                flex-shrink: 0;
            }
        `}update(e){this.toggleAttribute(`backend-ready`,this.papyros.runner.backendReady),super.update(e)}connectedCallback(){super.connectedCallback(),document.addEventListener(`pointerdown`,this.onPointerDown,!0),document.addEventListener(`keydown`,this.onKeyDown,!0),this.hasUpdated&&(this.observeHostTabLabel(),this.toolbarWidthRef.value&&this.toolbarObserver.observe(this.toolbarWidthRef.value))}firstUpdated(){this.toolbarWidthRef.value&&this.toolbarObserver.observe(this.toolbarWidthRef.value)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`pointerdown`,this.onPointerDown,!0),document.removeEventListener(`keydown`,this.onKeyDown,!0),this.hostTabObserver.disconnect(),this.toolbarObserver.disconnect()}drop(e){if(e.preventDefault(),e.stopPropagation(),this.dragOver=!1,!this.papyros.debugger.active&&e.dataTransfer){for(let t of Array.from(e.dataTransfer.files))this.readAndAddFile(t);if(e.dataTransfer.types.includes(`text/uri-list`)){let t=e.dataTransfer.getData(`text/uri-list`).split(/\r?\n/).map(e=>e.trim()).filter(e=>e&&!e.startsWith(`#`));for(let e of t)this.papyros.runner.fetchAndAddUrl(e)}}}hostTabElements(){return this.hostTabSlotRef.value?.assignedElements({flatten:!0})??[]}readHostTabLabel(){let e=this.hostTabElements();this.hostTabLabel=e.length>0?e.map(e=>e.textContent?.trim()??``).join(` `):void 0}observeHostTabLabel(){this.hostTabObserver.disconnect();for(let e of this.hostTabElements())this.hostTabObserver.observe(e,{subtree:!0,childList:!0,characterData:!0});this.readHostTabLabel()}onHostTabSlotChange(){this.observeHostTabLabel(),this.hostTabLabel===void 0&&this.papyros.io.activeEditorTab===te&&(this.papyros.io.activeEditorTab=h)}renderPanels(e,t){let r=[...t].sort((e,t)=>e.name<t.name?-1:1);return k`
            <p-code .papyros=${this.papyros} ?hidden=${e!==h}></p-code>
            ${n(r,e=>e.name,t=>k`<p-file-viewer
                        .papyros=${this.papyros}
                        .file=${t}
                        .active=${t.name===e}
                    ></p-file-viewer>`)}
            <div class="host-panel" tabindex="0" ?hidden=${e!==te}>
                <slot name="host-tab-panel"></slot>
            </div>
        `}readAndAddFile(e){let t=new FileReader;_e(e.type)?(t.onload=()=>{this.papyros.runner.upsertFile(e.name,t.result,!1)},t.readAsText(e)):(t.onload=()=>{this.papyros.runner.upsertFile(e.name,fe(t.result),!0)},t.readAsArrayBuffer(e))}render(){let e=this.papyros.debugger.active?this.papyros.debugger.debugFiles:this.papyros.io.files,t=this.papyros.io.activeEditorTab,n=t===te&&this.hostTabLabel===void 0?h:t,r;return r=n===h?this.t(`Papyros.editor_tab_code`):n===te?this.hostTabLabel??``:n,k`
            <div
                class="drop-zone ${this.dragOver?`drag-over`:``}"
                @dragover=${this.onDragOver}
                @dragleave=${this.onDragLeave}
                @drop=${this.onDrop}
            >
                <div class="pane ${this.showEscapeHint&&n===h?`show-escape-hint`:``}">
                    <div class="toolbar" ${E(this.toolbarRef)}>
                        <div class="toolbar-width" ${E(this.toolbarWidthRef)}></div>
                        <p-editor-tabs
                            ${E(this.tabsRef)}
                            @p-editor-tabs-resize=${this.updateCompactButtons}
                            .papyros=${this.papyros}
                            .files=${e}
                            ?host-tab=${this.hostTabLabel!==void 0}
                        >
                            <slot
                                ${E(this.hostTabSlotRef)}
                                name="host-tab"
                                slot="host-tab"
                                @slotchange=${this.onHostTabSlotChange}
                            ></slot>
                        </p-editor-tabs>
                        <p-button-lint
                            ${E(this.buttonsRef)}
                            @p-button-lint-resize=${this.updateCompactButtons}
                            .papyros=${this.papyros}
                        >
                            <slot name="buttons" @slotchange=${this.onButtonsSlotChange}></slot>
                        </p-button-lint>
                    </div>
                    <!-- The tabs live in another shadow root, so the panel is named directly instead of by aria-labelledby. -->
                    <div
                        class="editor"
                        role="tabpanel"
                        aria-label=${r}
                        @focusin=${()=>this.showEscapeHint=this.focusFromKeyboard}
                        @focusout=${()=>this.showEscapeHint=!1}
                    >
                        ${this.renderPanels(n,e)}
                    </div>
                    <div class="footer">
                        <p-run-state .papyros=${this.papyros}></p-run-state>
                        ${this.papyros.debugger.active?k`<span class="read-only" title=${this.t(`Papyros.editor.read_only`)}>
                                      <md-icon aria-hidden="true">${this.papyros.constants.icons.lock}</md-icon>
                                      <span>${this.t(`Papyros.editor.read_only`)}</span>
                                  </span>`:k`<span
                                      class="hint"
                                      aria-hidden="true"
                                      title=${this.t(`Papyros.editor.escape_hint`)}
                                  >
                                      ${this.t(`Papyros.editor.escape_hint`)}
                                  </span>`}
                    </div>
                </div>
            </div>
        `}};g([S()],Gt.prototype,`dragOver`,void 0),g([S()],Gt.prototype,`showEscapeHint`,void 0),g([S()],Gt.prototype,`hostTabLabel`,void 0),g([O({type:Boolean,reflect:!0,attribute:`compact-slotted`})],Gt.prototype,`compactSlotted`,void 0),Gt=g([w(`p-code-runner`)],Gt);var Kt=T`var(--tc-surface-color, #F6FAFC)`,qt=T`var(--tc-on-surface-color, #001D32)`,Jt=T`var(--tc-surface-container-color, #E5EFF6)`,Yt=T`var(--tc-outline-color, #2C7CB5)`,L=T`var(--tc-outline-variant-color, #ABCBE2)`,R=T`var(--tc-primary-color, #0061a6)`,Xt=T`var(--tc-secondary-surface-color, #FDF8FA)`,Zt=T`var(--tc-secondary-on-surface-color, #3F0018)`,Qt=T`var(--tc-secondary-surface-container-color, #F9EAF0)`,$t=T`var(--tc-secondary-outline-color, #CE4379)`,en=T`var(--tc-secondary-color, #BC0049)`,tn=T`var(--tc-tertiary-surface-color, #FAF9F6)`,nn=T`var(--tc-tertiary-on-surface-color, #241A00)`,rn=T`var(--tc-tertiary-surface-container-color, #F2EDE4)`,an=T`var(--tc-tertiary-outline-color, #98702C)`,on=T`var(--tc-tertiary-color, #795900)`,sn=T`var(--tc-font-monospace, sfmono-regular, menlo, monaco, consolas, "Liberation Mono", "Courier New", monospace)`,cn=T`
    :host,
    :host * {
        --tc-surface-color: ${Xt};
        --tc-on-surface-color: ${Zt};
        --tc-surface-container-color: ${Qt};
        --tc-outline-color: ${$t};
        --tc-primary-color: ${en};
    }
`,ln=T`
    :host,
    :host * {
        --tc-surface-color: ${tn};
        --tc-on-surface-color: ${nn};
        --tc-surface-container-color: ${rn};
        --tc-outline-color: ${an};
        --tc-primary-color: ${on};
    }
`,z=T`
    :host {
        font-family: var(--tc-font-family, roboto, "Helvetica Neue", helvetica, arial, sans-serif);
        font-size: var(--tc-font-size, 13px);
        color: ${qt};
    }

    td,
    th {
        padding: 6px;
        background-color: ${Kt};
    }

    /* a th otherwise renders bold and centered, unlike the td beside it */
    th {
        font-weight: inherit;
        text-align: inherit;
    }
`,B=T`
    caption,
    .heap-label {
        color: var(--tc-heap-label-color, ${R});
        font-size: var(--tc-heap-label-font-size, 10px);
        margin-bottom: 2px;
    }

    caption {
        text-align: start;
        caption-side: top;
        white-space: nowrap;
    }

    .heap-label {
        display: block;
    }

    table {
        border-collapse: collapse;
        border-radius: 5px;
        overflow: hidden;
        border-style: hidden;
    }

    td,
    th {
        padding: 8px;
    }
`,un=T`
    .key {
        background-color: ${Jt};
        text-align: right;
        vertical-align: middle;
    }
    td,
    th {
        border-bottom: 1px solid ${Yt};
        font-size: 12px;
    }
`,dn=T`
    td,
    th {
        border-left: 1px solid ${Yt};
    }
    tbody td,
    tbody th {
        padding-top: 2px;
        background-color: ${Jt};
    }
    thead td,
    thead th {
        background-color: ${Jt};
        color: ${Yt};
        font-size: 10px;
        padding-bottom: 2px;
    }
`,fn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},pn=class extends y{render(){return k`
            <span class="heap-label">imported ${this.el[1]}</span>
            <div>${this.el[2]}</div>
        `}};pn.styles=[z,B],fn([O({type:Array})],pn.prototype,`el`,void 0),pn=fn([w(`tc-imported-faux-primitive`)],pn);var mn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},hn=class extends y{render(){return typeof this.el==`string`?`"${this.el}"`:typeof this.el==`number`?this.el.toString():typeof this.el==`boolean`?this.el?`True`:`False`:this.el===null||this.el===void 0?`None`:this.el[0]===`SPECIAL_FLOAT`?this.el[1]:this.el[0]===`IMPORTED_FAUX_PRIMITIVE`?k`<tc-imported-faux-primitive .el=${this.el}></tc-imported-faux-primitive>`:`?`}};hn.styles=[z,T`
            :host {
                font-family: ${sn};
                white-space: pre;
            }

            tc-imported-faux-primitive {
                white-space: normal;
            }
        `],mn([O()],hn.prototype,`el`,void 0),hn=mn([w(`tc-primitive`)],hn);var gn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},_n=class extends y{update(e){if(e.has(`el`)){let t=e.get(`el`);t!==void 0&&this.notifyHeap(t[1],`remove`),this.notifyHeap(this.el[1],`add`)}super.update(e)}labelTarget(e){this.setAttribute(`role`,`img`),this.setAttribute(`aria-label`,e)}clearTargetLabel(){this.removeAttribute(`role`),this.removeAttribute(`aria-label`)}reannounce(){this.notifyHeap(this.el[1],`remove`),this.notifyHeap(this.el[1],`add`)}notifyHeap(e,t){this.dispatchEvent(new CustomEvent(`${t}-reference`,{detail:{from:this,to:e},bubbles:!0,composed:!0}))}disconnectedCallback(){super.disconnectedCallback(),this.notifyHeap(this.el[1],`remove`)}render(){return k`<slot></slot>`}};_n.styles=[z,T`
            :host {
                display: block;
                width: 100%;
                height: 100%;
                min-width: 12px;
                min-height: 14px;
            }
        `],gn([O({type:Array})],_n.prototype,`el`,void 0),_n=gn([w(`tc-reference`)],_n);var vn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},yn=class extends y{render(){return this.el instanceof Array&&this.el[0]===`REF`?k`<tc-reference .el=${this.el}></tc-reference>`:k`<tc-primitive .el=${this.el}></tc-primitive>`}};yn.styles=[z],vn([O({type:Array})],yn.prototype,`el`,void 0),yn=vn([w(`tc-sub-element`)],yn);var bn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},xn=class extends y{render(){return k`
            <span class="label" id="label">${this.label}</span>
            <table aria-labelledby="label">
                ${this.ordered_locals.map(e=>k`
                        <tr>
                            <th class="key" scope="row">${e}</th>
                            <td class="value">
                                <tc-sub-element .el=${this.locals[e]}></tc-sub-element>
                            </td>
                        </tr>
                    `)}
            </table>
        `}};xn.styles=[z,T`
            :host {
                display: block;
                padding: 8px;
                margin-bottom: 16px;
                background-color: ${Kt};
                border-radius: 5px;
            }
            table {
                margin-left: auto;
            }
            .key {
                text-align: right;
            }
            .value {
                border-left: 1px solid ${L};
                border-bottom: 1px solid ${L};
            }
            .label {
                font-size: 14px;
                margin-bottom: 4px;
            }
        `],bn([O({type:Array})],xn.prototype,`ordered_locals`,void 0),bn([O({type:Object})],xn.prototype,`locals`,void 0),bn([O({type:String})],xn.prototype,`label`,void 0),xn=bn([w(`tc-stack-element`)],xn);var Sn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Cn=class extends y{get highlightGlobals(){return this.frame.stack_to_render.every(e=>!e.is_highlighted)}get updateComplete(){return Promise.all(Array.from(this.shadowRoot.querySelectorAll(`tc-stack-element`)).map(e=>e.updateComplete)).then(()=>super.updateComplete)}addHighlightInfoToEvent(e,t){e.detail.highlight=t}render(){return k`
            <tc-stack-element
                class="${this.highlightGlobals?`highlight`:``}"
                .locals=${this.frame.globals}
                .ordered_locals=${this.frame.ordered_globals}
                label="Global frame"
                @add-reference=${e=>this.addHighlightInfoToEvent(e,this.highlightGlobals)}
            ></tc-stack-element>
            ${this.frame.stack_to_render.map(e=>k`
                    <tc-stack-element
                        class="${e.is_highlighted?`highlight`:``} ${e.is_zombie?`mute`:``}"
                        .locals=${e.encoded_locals}
                        .ordered_locals=${e.ordered_varnames}
                        label="${e.func_name}"
                        @add-reference=${t=>this.addHighlightInfoToEvent(t,e.is_highlighted)}
                    ></tc-stack-element>
                `)}
        `}};Cn.styles=[z,T`
            .highlight {
                background-color: ${Jt};
                --tc-surface-color: ${Jt};
            }

            .mute {
                opacity: 0.5;
            }
        `],Sn([O({type:Object})],Cn.prototype,`frame`,void 0),Cn=Sn([w(`tc-stack`)],Cn);var wn=Symbol(`deepAwait`);function Tn(e){return wn in e}function V(e){var t;class n extends e{constructor(){super(...arguments),this[t]=!0}get childrenToAwait(){let e=this.shadowRoot.querySelectorAll(`*`);return Array.from(e).filter(Tn)}get deepUpdateComplete(){return this.updateComplete.then(()=>Promise.all(this.childrenToAwait.map(e=>e.deepUpdateComplete))).then(()=>this.updateComplete)}updated(e){super.updated(e),this.dispatchEvent(new CustomEvent(`deep-update`,{bubbles:!0,composed:!0}))}}return t=wn,n}var En=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},H=class extends V(y){constructor(){super(...arguments),this.expanded=!1}get firstValues(){return this.values.slice(0,2)}get lastValues(){return this.values.slice(2).slice(-2)}get hiddenValues(){return this.values.slice(2,-2)}renderedValues(e,t){return k`
            ${this.firstValues.map(e)}
            ${this.values.length<=10||this.expanded?this.hiddenValues.map((t,n)=>e(t,this.firstValues.length+n)):t}
            ${this.lastValues.map((t,n)=>e(t,this.values.length-this.lastValues.length+n))}
        `}renderedComponent(e,t){return k`
            <table>
                <caption>
                    ${this.values.length<=10?e:k`
                                  <button
                                      class="clickable"
                                      aria-expanded="${this.expanded}"
                                      @click=${()=>this.expanded=!this.expanded}
                                  >
                                      ${e} (${this.values.length})
                                      <span aria-hidden="true">${this.expanded?`▼`:`▶`}</span>
                                  </button>
                              `}
                </caption>
                ${t}
            </table>
        `}};H.styles=T`
        button.clickable {
            background: none;
            border: none;
            padding: 0;
            margin: 0;
            display: block;
            width: 100%;
            font: inherit;
            color: inherit;
            text-align: inherit;
        }

        .clickable:hover {
            cursor: pointer;
            opacity: 0.8;
        }
    `,En([O({state:!0})],H.prototype,`expanded`,void 0);var Dn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},On=class extends H{constructor(){super(...arguments),this.kind=`list`}willUpdate(e){super.willUpdate(e),e.has(`grid`)&&this.grid&&(this.kind=this.grid.kind)}get values(){return this.grid.rows}get label(){let e=new Set(this.grid.rows.map(e=>e.kind)),t=e.size===1?`${[...e][0]}s`:`sequences`;return`${this.grid.kind} of ${t}`}render(){return this.renderedComponent(this.label,k`
                <table class="nested">
                    <tbody>
                        ${this.renderedValues((e,t)=>k`
                                <tr>
                                    <th class="outer-index" scope="row">${t}</th>
                                    <td class="row-cell ${e.kind}">
                                        <table>
                                            <thead>
                                                <tr>
                                                    ${e.values.map((e,t)=>k`<th scope="col">${t}</th>`)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    ${e.values.map(e=>k`
                                                            <td>
                                                                <tc-sub-element .el=${e}></tc-sub-element>
                                                            </td>
                                                        `)}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            `,k`
                                <tr>
                                    <td class="outer-index"></td>
                                    <td class="row-cell">...</td>
                                </tr>
                            `)}
                    </tbody>
                </table>
            `)}};On.styles=[z,B,dn,T`
            /* a palette sits on the host and on a row cell alone. custom properties
               reach every value below, shadow roots included. */
            :host,
            td.row-cell.list {
                --tc-surface-color: ${tn};
                --tc-on-surface-color: ${nn};
                --tc-surface-container-color: ${rn};
                --tc-outline-color: ${an};
                --tc-primary-color: ${on};
            }

            :host([kind="tuple"]),
            td.row-cell.tuple {
                --tc-surface-color: ${Xt};
                --tc-on-surface-color: ${Zt};
                --tc-surface-container-color: ${Qt};
                --tc-outline-color: ${$t};
                --tc-primary-color: ${en};
            }

            .outer-index,
            td.row-cell {
                background: none;
                border-left: none;
                padding: 2px 4px 2px 0;
            }

            .outer-index {
                color: ${Yt};
                font-size: 10px;
                text-align: right;
                vertical-align: middle;
            }
        `,H.styles],Dn([O({type:Object})],On.prototype,`grid`,void 0),Dn([O({type:String,reflect:!0})],On.prototype,`kind`,void 0),On=Dn([w(`tc-grid`)],On);var kn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},An=class extends H{get values(){return this.el.slice(1)}render(){return this.renderedComponent(`list`,k`
                <thead>
                    <tr>
                        ${this.renderedValues((e,t)=>k`<th scope="col">${t}</th>`,k`<td></td>`)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${this.renderedValues(e=>k`
                                <td>
                                    <tc-sub-element .el=${e}></tc-sub-element>
                                </td>
                            `,k`<td>...</td>`)}
                    </tr>
                </tbody>
            `)}};An.styles=[z,B,dn,ln,H.styles],kn([O({type:Array})],An.prototype,`el`,void 0),An=kn([w(`tc-list`)],An);var jn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Mn=class extends H{get values(){return this.el.slice(1)}render(){return this.renderedComponent(`tuple`,k`
                <thead>
                    <tr>
                        ${this.renderedValues((e,t)=>k`<th scope="col">${t}</th>`,k`<td></td>`)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${this.renderedValues(e=>k`
                                <td>
                                    <tc-sub-element .el=${e}></tc-sub-element>
                                </td>
                            `,k`<td>...</td>`)}
                    </tr>
                </tbody>
            `)}};Mn.styles=[z,B,dn,cn,H.styles],jn([O({type:Array})],Mn.prototype,`el`,void 0),Mn=jn([w(`tc-tuple`)],Mn);var Nn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Pn=class extends H{get values(){return this.el.slice(1)}get displayedValues(){return this.values.length<=10||this.expanded?this.values:[...this.values.slice(0,2),...this.values.slice(-2)]}get numRows(){if(this.displayedValues.length===0)return 0;let e=Math.round(Math.sqrt(this.displayedValues.length));return e>3&&--e,e}get numCols(){return this.numRows===0?0:Math.ceil(this.displayedValues.length/this.numRows)}exists(e,t){return e*this.numCols+t<this.displayedValues.length}render(){return this.renderedComponent(`set`,k`
                ${Array(this.numRows).fill(0).map((e,t)=>k`
                            <tr>
                                ${Array(this.numCols).fill(0).map((e,n)=>this.exists(t,n)?k`
                                                  <td>
                                                      <tc-sub-element .el=${this.displayedValues[t*this.numCols+n]}>
                                                      </tc-sub-element>
                                                  </td>
                                              `:k``)}
                            </tr>
                        `)}
            `)}};Pn.styles=[z,B,ln,H.styles],Nn([O({type:Array})],Pn.prototype,`el`,void 0),Pn=Nn([w(`tc-set`)],Pn);var Fn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},In=class extends H{get values(){return this.el.slice(1)}render(){return this.renderedComponent(`dict`,k`
                <tbody>
                    ${this.renderedValues(([e,t])=>k`
                            <tr>
                                <th class="key" scope="row">
                                    <tc-sub-element .el=${e}></tc-sub-element>
                                </th>
                                <td class="value">
                                    <tc-sub-element .el=${t}></tc-sub-element>
                                </td>
                            </tr>
                        `,k`<tr>
                            <td colspan="2">...</td>
                        </tr>`)}
                </tbody>
            `)}};In.styles=[z,B,un,ln,H.styles],Fn([O({type:Array})],In.prototype,`el`,void 0),In=Fn([w(`tc-dict`)],In);var Ln=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Rn=class extends y{render(){return this.attributeEls.map(([e,t])=>k`
                <tr>
                    <th class="key" scope="row">${e}</th>
                    <td class="value">
                        <tc-sub-element .el=${t}></tc-sub-element>
                    </td>
                </tr>
            `)}};Rn.styles=[z,un,T`
            :host {
                display: contents;
            }
        `],Ln([O({type:Array})],Rn.prototype,`attributeEls`,void 0),Rn=Ln([w(`tc-attribute-map`)],Rn);var zn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Bn=class extends V(y){get instanceAttributes(){let e=this.isPPrint?3:2;return this.el.slice(e)}get name(){return this.el[1]}get isPPrint(){return this.el[0]===`INSTANCE_PPRINT`}render(){return k`
            <span class="heap-label" id="label">${this.name} instance</span>
            <table aria-labelledby="label">
                ${this.isPPrint?k`<tr>
                              <td colspan="2" class="pprint">${this.el[2]}</td>
                          </tr>`:k``}
                ${k`<tc-attribute-map .attributeEls=${this.instanceAttributes}></tc-attribute-map>`}
            </table>
        `}};Bn.styles=[z,B,ln,T`
            td {
                border-bottom: 1px solid ${Yt};
            }
            .pprint {
                font-family: ${sn};
                white-space: pre;
            }
        `],zn([O({type:Array})],Bn.prototype,`el`,void 0),Bn=zn([w(`tc-instance`)],Bn);var Vn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Hn=class extends V(y){get classAttributes(){return this.el.slice(3)}get superclassStr(){return this.el[2].length>0?`[extends ${this.el[2].join(`, `)}]`:``}get name(){return this.el[1]}render(){return k`
            <span class="heap-label" id="label"> ${this.name} class ${this.superclassStr} </span>
            <table aria-labelledby="label">
                ${k`<tc-attribute-map .attributeEls=${this.classAttributes}></tc-attribute-map>`}
            </table>
        `}};Hn.styles=[z,B,un,cn],Vn([O({type:Array})],Hn.prototype,`el`,void 0),Hn=Vn([w(`tc-class`)],Hn);var Un=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Wn=class extends V(y){get functionAttributes(){if(!(this.el.length<4))return this.el[3]}get funcName(){return this.el[1]}render(){return k`
            <span class="heap-label">function</span>
            <div>${this.funcName}</div>
            ${this.functionAttributes?k`
                          <span class="heap-label" id="default-args">default arguments:</span>
                          <table aria-labelledby="default-args">
                              ${k`<tc-attribute-map .attributeEls=${this.functionAttributes}></tc-attribute-map>`}
                          </table>
                      `:k``}
        `}};Wn.styles=[z,B,cn],Un([O({type:Array})],Wn.prototype,`el`,void 0),Wn=Un([w(`tc-function`)],Wn);var Gn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Kn=class extends V(y){render(){return k`
            <span class="heap-label">${this.el[1]}</span>
            <tc-primitive .el=${this.el[2]}></tc-primitive>
        `}};Kn.styles=[z,B,ln],Gn([O({type:Array})],Kn.prototype,`el`,void 0),Kn=Gn([w(`tc-heap-primitive`)],Kn);var qn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Jn=class extends V(y){get typeName(){return this.el[0]}get value(){return this.el[1]}render(){return k`
            <span class="heap-label" id="label">${this.typeName}</span>
            <table aria-labelledby="label">
                <tr>
                    <td>${this.value}</td>
                </tr>
            </table>
        `}};Jn.styles=[z,B],qn([O({type:Array})],Jn.prototype,`el`,void 0),Jn=qn([w(`tc-other`)],Jn);var Yn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Xn=class extends V(y){render(){if(this.el===void 0)return k``;if(this.grid!==void 0)return k`<tc-grid .grid=${this.grid}></tc-grid>`;switch(this.el[0]){case`LIST`:return k`<tc-list .el=${this.el}></tc-list>`;case`TUPLE`:return k`<tc-tuple .el=${this.el}></tc-tuple>`;case`SET`:return k`<tc-set .el=${this.el}></tc-set>`;case`DICT`:return k`<tc-dict .el=${this.el}></tc-dict>`;case`INSTANCE`:return k`<tc-instance .el=${this.el}></tc-instance>`;case`INSTANCE_PPRINT`:return k`<tc-instance .el=${this.el}></tc-instance>`;case`CLASS`:return k`<tc-class .el=${this.el}></tc-class>`;case`FUNCTION`:return k`<tc-function .el=${this.el}></tc-function>`;case`HEAP_PRIMITIVE`:return k`<tc-heap-primitive .el=${this.el}></tc-heap-primitive>`;default:return k`<tc-other .el=${this.el}></tc-other>`}}};Xn.styles=[z],Yn([O({type:Array})],Xn.prototype,`el`,void 0),Yn([O({type:Object})],Xn.prototype,`grid`,void 0),Xn=Yn([w(`tc-heap-element`)],Xn);var Zn=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},Qn=class extends V(y){constructor(){super(...arguments),this.leftMargins=new Map,this.leftMarginUpdates=new Map,this.heapConnections=new Map,this.handledByRecursion=new Map,this.endpointMap={},this.references=new Map}applyMarginUpdates(){this.heapConnections.forEach((e,t)=>{e.forEach(e=>{let n=this.endpointMap[t],r=this.endpointMap[e];n&&r&&this.fixArrowDirection(n,e)})}),this.leftMargins.clear();for(let[e,t]of this.leftMarginUpdates.entries())this.leftMargins.set(e,t)}clearMargins(){this.leftMargins.clear(),this.leftMarginUpdates.clear(),this.heapConnections.clear(),this.handledByRecursion.clear()}fixArrowDirection(e,t,n=[]){let r=this.endpointMap[t];if(r===void 0)return;let i=e.getBoundingClientRect().left+e.getBoundingClientRect().width-r.getBoundingClientRect().left,a=(this.leftMargins.get(t)||0)+i,o=e instanceof _n?e.closest(`tc-heap-element`):e,s=o?parseInt(o.getAttribute(`key`)||``):void 0;if(s&&this.leftMarginUpdates.has(s)){let e=this.leftMargins.get(s)||0,t=(this.leftMarginUpdates.get(s)||0)-e;a+=t}let c=this.leftMarginUpdates.get(t)||0,l=Math.max(c,a);if(this.leftMarginUpdates.set(t,Math.max(l,0)),this.heapConnections.has(t)){let e=[...n,t];this.heapConnections.get(t).filter(t=>!this.handledByRecursion.has(t)||!e.some(e=>this.handledByRecursion.get(t)?.has(e))).forEach(t=>{e.forEach(e=>{this.handledByRecursion.has(e)||this.handledByRecursion.set(e,new Set),this.handledByRecursion.get(e).add(t)}),this.fixArrowDirection(r,t,e)})}this.requestUpdate()}addEndpoint(e,t){t===void 0?delete this.endpointMap[e]:this.endpointMap[e]=t}get updateComplete(){return Promise.all(Object.values(this.endpointMap).map(e=>e.updateComplete)).then(()=>super.updateComplete)}addConnection(e,t,n){let r=this.heapConnections.get(e)||[];this.heapConnections.set(e,[...r,t]);let i=(t=>{this.removeConnection(e,t.detail.to),t.detail.from.removeEventListener(`remove-reference`,i)});n.addEventListener(`remove-reference`,i)}removeConnection(e,t){let n=this.heapConnections.get(e)||[];this.heapConnections.set(e,n.filter(e=>e!==t))}addReference(e,t){this.references.has(e)||this.references.set(e,new Set);let n=this.references.get(e),r=n.size===0;n.add(t),r&&this.requestUpdate()}addReferenceIfNew(e,t){this.references.get(e)?.has(t)||this.addReference(e,t)}removeReference(e,t){let n=this.references.get(e);n&&(n.delete(t),n.size===0&&this.requestUpdate())}async scheduleMarginUpdate(){await this.deepUpdateComplete,this.requestUpdate()}onChildDeepUpdate(e){e.stopPropagation(),this.scheduleMarginUpdate()}render(){return this.applyMarginUpdates(),k`
            ${this.layout.layout.map(e=>k`
                    <div class="row">
                        ${e.toArray().map(e=>k`
                                    <tc-heap-element
                                        .el=${this.references.get(e)?.size?this.layout.heap[e]:void 0}
                                        .grid=${this.references.get(e)?.size?this.layout.grids.get(e):void 0}
                                        class=${this.references.get(e)?.size?``:`hidden`}
                                        style=${`margin-left: ${this.leftMargins.get(e)||0}px`}
                                        key="${e}"
                                        ${E(t=>this.addEndpoint(e,t))}
                                        @add-reference="${t=>this.addConnection(e,t.detail.to,t.detail.from)}"
                                        @deep-update="${this.onChildDeepUpdate}"
                                    >
                                    </tc-heap-element>
                                `)}
                    </div>
                `)}
        `}};Qn.styles=[z,T`
            .row {
                display: flex;
                flex-direction: row;
                min-height: 0;
            }

            tc-heap-element {
                margin: 0.5rem 1rem;
            }

            tc-heap-element.hidden {
                opacity: 0;
                width: 0;
                height: 0;
                margin: 0;
            }
        `],Zn([O({type:Object})],Qn.prototype,`layout`,void 0),Qn=Zn([w(`tc-heap`)],Qn);var $n=`http://www.w3.org/2000/svg`,er=50,tr=3,nr=10,rr=10,ir=class{constructor(e){this.connections=[],this.suspended=!1,this.container=e,this.svg=document.createElementNS($n,`svg`),this.svg.setAttribute(`aria-hidden`,`true`),this.svg.setAttribute(`focusable`,`false`),this.svg.style.position=`absolute`,this.svg.style.top=`0`,this.svg.style.left=`0`,this.svg.style.width=`100%`,this.svg.style.height=`100%`,this.svg.style.overflow=`visible`,this.svg.style.pointerEvents=`none`,this.container.appendChild(this.svg)}connect(e){let t=document.createElementNS($n,`g`);t.setAttribute(`class`,e.highlight?`connection highlight`:`connection`);let n=document.createElementNS($n,`path`);n.setAttribute(`fill`,`none`);let r=document.createElementNS($n,`circle`);r.setAttribute(`r`,String(tr));let i=document.createElementNS($n,`path`);i.setAttribute(`class`,`arrowhead`),t.appendChild(n),t.appendChild(r),t.appendChild(i),this.svg.appendChild(t);let a={source:e.source,target:e.target,group:t,path:n,dot:r,arrow:i};return this.connections.push(a),this.suspended||this.repaintConnection(a),a}removeBySource(e){for(let t=this.connections.length-1;t>=0;t--){let n=this.connections[t];n.source===e&&(n.group.remove(),this.connections.splice(t,1))}}setSuspended(e,t=!1){this.suspended=e,!e&&t&&this.repaint()}repaint(){for(let e of this.connections)this.repaintConnection(e)}repaintConnection(e){let t=this.anchor(e.source,`center`),n=this.anchor(e.target,`left`),r={x:t.x+er,y:t.y},i={x:n.x-er,y:n.y},a=this.baseParameter(t,r,i,n),o=this.splitCubic(t,r,i,n,a),s=o.end;e.path.setAttribute(`d`,`M ${t.x} ${t.y} C ${o.c1.x} ${o.c1.y} ${o.c2.x} ${o.c2.y} ${s.x} ${s.y}`),e.dot.setAttribute(`cx`,String(t.x)),e.dot.setAttribute(`cy`,String(t.y)),e.arrow.setAttribute(`d`,this.arrowPath(s,n))}anchor(e,t){let n=this.container.getBoundingClientRect(),r=e.getBoundingClientRect(),i=r.top-n.top+r.height/2;return t===`center`?{x:r.left-n.left+r.width/2,y:i}:{x:r.left-n.left,y:i}}arrowPath(e,t){let n=t.x-e.x,r=t.y-e.y,i=Math.hypot(n,r)||1,a=-r/i,o=n/i,s=rr/2;return`M ${t.x} ${t.y} L ${e.x+a*s} ${e.y+o*s} L ${e.x-a*s} ${e.y-o*s} Z`}baseParameter(e,t,n,r){for(let i=1;i>0;i-=.02)if(this.distance(this.cubicAt(e,t,n,r,i),r)>=nr)return i;return 0}splitCubic(e,t,n,r,i){let a=this.lerp(e,t,i),o=this.lerp(t,n,i),s=this.lerp(n,r,i),c=this.lerp(a,o,i),l=this.lerp(o,s,i);return{c1:a,c2:c,end:this.lerp(c,l,i)}}cubicAt(e,t,n,r,i){let a=1-i,o=a*a*a,s=3*a*a*i,c=3*a*i*i,l=i*i*i;return{x:o*e.x+s*t.x+c*n.x+l*r.x,y:o*e.y+s*t.y+c*n.y+l*r.y}}lerp(e,t,n){return{x:e.x+(t.x-e.x)*n,y:e.y+(t.y-e.y)*n}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}},ar=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},or={title:`Drag the slider to walk through your code.`,text_1:`This window shows how your program works step by step. Explore to see how your program builds and stores information.`,text_2:`You can also use the buttons next to the slider to go to the previous or next step, or to jump to the first or last step.`};function sr(e,t){for(let n in t)e=e.replaceAll(`%{${n}}`,t[n]);return e}function cr(e,t){let n=RegExp(`%\\{(${Object.keys(t).join(`|`)})\\}`,`g`),r=[],i=0;for(let a of e.matchAll(n))r.push(e.slice(i,a.index)),r.push(t[a[1]]),i=a.index+a[0].length;return r.push(e.slice(i)),k`${r}`}var lr=class extends y{constructor(){super(...arguments),this.translations=or}render(){return k`
            <h3>
                <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    height="22"
                    viewBox="0 -960 960 960"
                    width="22"
                >
                    <path
                        d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
                    />
                </svg>
                ${this.translations.title}
            </h3>
            <p>
                <em>${this.translations.text_1}</em>
            </p>
            <p>
                ${cr(this.translations.text_2,{next:k`<span class="button">&gt;</span>`,previous:k`<span class="button">&lt;</span>`,last:k`<span class="button">&gt;&gt;</span>`,first:k`<span class="button">&lt;&lt;</span>`})}
            </p>
        `}};lr.styles=[z,T`
            :host {
                width: 360px;
                max-width: calc(100% - 80px);
                margin: 20px auto;
                border-radius: 10px;
                padding: 20px;
                display: block;
                background-color: ${Jt};
                font-size: 14px;
            }

            .button {
                display: inline-block;
                width: 25px;
                text-align: center;
                color: ${R};
                font-size: 16px;
            }
            h3 {
                display: flex;
                align-items: center;
                margin-top: 0;
            }

            svg {
                margin-right: 10px;
                fill: ${qt};
            }
        `],ar([O({type:Object})],lr.prototype,`translations`,void 0),lr=ar([w(`tc-help-card`)],lr);var ur=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},dr={call_stack:`Call stack`,heap_objects:`Heap objects`,exception_title:`The debugger crashed`,reference_to:`reference to %{type} #%{id}`};function fr(e){switch(e[0]){case`LIST`:return`list`;case`TUPLE`:return`tuple`;case`SET`:return`set`;case`DICT`:return`dict`;case`INSTANCE`:case`INSTANCE_PPRINT`:return`${e[1]} instance`;case`CLASS`:return`${e[1]} class`;case`FUNCTION`:return`function`;case`HEAP_PRIMITIVE`:return String(e[1]);default:return e[0]}}var pr=class extends V(y){constructor(){super(...arguments),this.translations={},this.liveReferences=new Map,this.generation=0}update(e){(e.has(`frame`)||e.has(`layout`))&&(this.generation++,this.heap?.clearMargins()),super.update(e)}get connections(){return this.connectionLayer===void 0&&this.canvas!==void 0&&(this.connectionLayer=new ir(this.canvas)),this.connectionLayer}trackReference(e,t){this.liveReferences.set(e,this.generation);let n=(e=>{e.detail.from.removeEventListener(`remove-reference`,n),this.liveReferences.delete(e.detail.from),this.connections.removeBySource(e.detail.from),this.heap?.removeReference(e.detail.to,e.detail.from)});e.addEventListener(`remove-reference`,n),this.heap?.endpointMap[t]!==void 0&&this.heap.addReference(t,e)}async drawConnection(e,t,n=!0){if(await this.updateComplete,!e.isConnected||e.el[1]!==t)return;let r=this.heap?.endpointMap[t];if(e.clearTargetLabel(),r===void 0){ye(k`<tc-heap-element .el=${this.layout.heap[t]}></tc-heap-element>`,e);return}ye(k``,e);let i=this.layout.heap[t];i!==void 0&&e.labelTarget(sr(this.t.reference_to,{type:fr(i),id:`${t}`})),this.heap.addReferenceIfNew(t,e),this.connections.connect({source:e,target:r,highlight:n})}updated(e){super.updated(e),(e.has(`frame`)||e.has(`layout`))&&this.reannounceReferences(),this.scheduleRedraw()}async reannounceReferences(){let e=this.generation;if(await this.updateComplete,e===this.generation){for(let[t,n]of[...this.liveReferences])n!==e&&t.isConnected&&t.reannounce();this.heap?.requestUpdate()}}async scheduleRedraw(){await this.deepUpdateComplete,this.connections?.setSuspended(!1,!0)}get updateComplete(){return Promise.all([this.heap?.updateComplete,this.stack?.updateComplete]).then(()=>super.updateComplete)}get t(){return{...dr,...this.translations}}render(){return this.connections?.setSuspended(!0),k`
            ${this.frame.event==`exception`?k`
                          <tc-exception-card>
                              <span slot="title">${this.t.exception_title}</span>
                              ${this.frame.exception_msg}
                          </tc-exception-card>
                      `:k``}
            <div class="canvas" ${E(e=>this.canvas=e)}>
                <tc-stack
                    role="group"
                    aria-label="${this.t.call_stack}"
                    .frame=${this.frame}
                    ${E(e=>this.stack=e)}
                    @add-reference="${e=>{this.trackReference(e.detail.from,e.detail.to),this.drawConnection(e.detail.from,e.detail.to,e.detail.highlight)}}"
                    @deep-update="${()=>this.scheduleRedraw()}"
                ></tc-stack>
                <tc-heap
                    role="group"
                    aria-label="${this.t.heap_objects}"
                    .layout=${this.layout}
                    ${E(e=>this.heap=e)}
                    @add-reference="${e=>{this.trackReference(e.detail.from,e.detail.to),this.drawConnection(e.detail.from,e.detail.to)}}"
                    @deep-update="${()=>this.scheduleRedraw()}"
                ></tc-heap>
            </div>
        `}};pr.styles=[z,T`
            .canvas {
                position: relative;
                width: 100%;
                display: flex;
                flex-direction: row;
            }
            tc-stack {
                margin-right: 64px;
            }

            svg path {
                stroke: ${L};
                stroke-width: 1px;
            }

            .arrowhead {
                fill: ${L};
                stroke-width: 1px;
            }

            svg circle {
                fill: ${L};
                stroke-width: 59;
                stroke-linecap: round;
            }

            .highlight path {
                stroke: ${R};
            }

            .highlight circle {
                fill: ${R};
            }

            .highlight .arrowhead {
                fill: ${R};
            }

            tc-exception-card {
                margin: 0 0 20px;
            }
        `],ur([O({type:Object})],pr.prototype,`frame`,void 0),ur([O({type:Object})],pr.prototype,`layout`,void 0),ur([O({type:Object})],pr.prototype,`translations`,void 0),pr=ur([w(`tc-frame`)],pr);var mr=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},hr={picker_label:`Execution steps`,slider_label:`Execution step`,step_of:`Step %{step} of %{total}`,first_step:`First step`,previous_step:`Previous step`,next_step:`Next step`,last_step:`Last step`,current_step:`Current step`},gr=class extends y{constructor(){super(...arguments),this.translations={},this.current=0}static get styles(){return[z,T`
                :host {
                    width: 400px;
                    display: block;
                }

                input {
                    --c: ${R}; /* active color */
                    --g: 1px; /* the gap */
                    --l: 4px; /* line thickness*/
                    --s: 20px; /* thumb size*/

                    width: 400px;
                    height: var(--s); /* needed for Firefox*/
                    --_c: color-mix(in srgb, var(--c), #000 var(--p, 0%));
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background: none;
                    cursor: pointer;
                    overflow: hidden;
                }
                input:focus-visible,
                input:hover {
                    --p: 15%;
                }
                input:active,
                input:focus-visible {
                    --_b: var(--s);
                }
                /* chromium */
                input[type="range" i]::-webkit-slider-thumb {
                    height: var(--s);
                    aspect-ratio: 1;
                    border-radius: 50%;
                    box-shadow: 0 0 0 var(--s) inset var(--_c);
                    border-image: linear-gradient(90deg, var(--_c) 50%, ${L} 0) 1/0 100vw/0
                        calc(100vw + var(--g));
                    clip-path: polygon(
                        0 calc(50% + var(--l) / 2),
                        -100vw calc(50% + var(--l) / 2),
                        -100vw calc(50% - var(--l) / 2),
                        0 calc(50% - var(--l) / 2),
                        0 0,
                        100% 0,
                        100% calc(50% - var(--l) / 2),
                        100vw calc(50% - var(--l) / 2),
                        100vw calc(50% + var(--l) / 2),
                        100% calc(50% + var(--l) / 2),
                        100% 100%,
                        0 100%
                    );
                    -webkit-appearance: none;
                    appearance: none;
                }
                /* Firefox */
                input[type="range"]::-moz-range-thumb {
                    height: var(--s);
                    width: var(--s);
                    background: none;
                    border-radius: 50%;
                    box-shadow: 0 0 0 var(--s) inset var(--_c);
                    border-image: linear-gradient(90deg, var(--_c) 50%, ${L} 0) 1/0 100vw/0
                        calc(100vw + var(--g));
                    clip-path: polygon(
                        0 calc(50% + var(--l) / 2),
                        -100vw calc(50% + var(--l) / 2),
                        -100vw calc(50% - var(--l) / 2),
                        0 calc(50% - var(--l) / 2),
                        0 0,
                        100% 0,
                        100% calc(50% - var(--l) / 2),
                        100vw calc(50% - var(--l) / 2),
                        100vw calc(50% + var(--l) / 2),
                        100% calc(50% + var(--l) / 2),
                        100% 100%,
                        0 100%
                    );
                    -moz-appearance: none;
                    appearance: none;
                }

                .btn-group {
                    position: relative;
                    display: flex;
                    vertical-align: middle;
                    border-radius: 20px;
                    background-color: ${R};
                    margin: 0 auto 12px auto;
                    width: fit-content;
                }

                button {
                    padding: 6px 12px;
                    border: 1px solid ${L};
                    border-right: 0;
                    position: relative;
                    flex: 1 1 auto;
                    color: ${R};
                    cursor: pointer;
                    background-color: ${Kt};
                    font: inherit;
                }

                button:hover,
                button:active {
                    opacity: 0.9;
                }

                button:disabled {
                    opacity: 1;
                    cursor: initial;
                    color: ${qt};
                }

                output {
                    padding: 6px 12px;
                    border: 1px solid ${L};
                    border-right: 0;
                    position: relative;
                    flex: 1 1 auto;
                    color: ${qt};
                    background-color: ${Kt};
                    text-align: center;
                    box-sizing: border-box;
                    /* the buttons beside it inherit as well, so the group keeps one font */
                    font: inherit;
                }

                .btn-group > button:last-of-type {
                    border-right: 1px solid ${L};
                    border-top-right-radius: 20px;
                    border-bottom-right-radius: 20px;
                }

                .btn-group > button:first-of-type {
                    border-top-left-radius: 20px;
                    border-bottom-left-radius: 20px;
                }
            `]}updated(e){e.has(`value`)&&(this.current=this.value)}get displayedCurrent(){return this.current+1}get max(){return this.length-1}get t(){return{...hr,...this.translations}}get stepOfText(){return sr(this.t.step_of,{step:`${this.displayedCurrent}`,total:`${this.length}`})}handleFrameChange(e){this.current=e,this.dispatchEvent(new CustomEvent(`frame-change`,{detail:{frame:e},bubbles:!0,composed:!0}))}render(){return k`
            <input
                type="range"
                min="0"
                max="${this.length-1}"
                .value="${this.current}"
                aria-label="${this.t.slider_label}"
                aria-valuetext="${this.stepOfText}"
                @input="${e=>this.handleFrameChange(e.target.valueAsNumber)}"
            />
            <div class="btn-group">
                <button
                    @click=${()=>this.handleFrameChange(0)}
                    .disabled=${this.current==0}
                    aria-label="${this.t.first_step}"
                >
                    &lt;&lt;
                </button>
                <button
                    @click=${()=>this.handleFrameChange(this.current-1)}
                    .disabled=${this.current==0}
                    aria-label="${this.t.previous_step}"
                >
                    &lt;
                </button>
                <output role="status" aria-label="${this.t.current_step}">
                    ${this.displayedCurrent} / ${this.length}
                </output>
                <button
                    @click=${()=>this.handleFrameChange(this.current+1)}
                    .disabled=${this.current==this.max}
                    aria-label="${this.t.next_step}"
                >
                    &gt;
                </button>
                <button
                    @click=${()=>this.handleFrameChange(this.max)}
                    .disabled=${this.current==this.max}
                    aria-label="${this.t.last_step}"
                >
                    &gt;&gt;
                </button>
            </div>
        `}};mr([O({type:Number})],gr.prototype,`length`,void 0),mr([O({type:Number})],gr.prototype,`value`,void 0),mr([O({type:Object})],gr.prototype,`translations`,void 0),mr([O({type:Number,state:!0})],gr.prototype,`current`,void 0),gr=mr([w(`tc-frame-picker`)],gr);var _r=class e{constructor(e){this.value=e,this.prev=null,this.next=null}insertAfter(t){let n=new e(t);return n.prev=this,n.next=this.next,this.next&&(this.next.prev=n),this.next=n,n}insertBefore(t){let n=new e(t);return n.prev=this.prev,n.next=this,this.prev&&(this.prev.next=n),this.prev=n,n}remove(){this.prev&&(this.prev.next=this.next),this.next&&(this.next.prev=this.prev),this.value=void 0}get start(){let e=this;for(;e.prev;)e=e.prev;return e}toArray(){let e=[],t=this.start;for(;t;)e.push(t.value),t=t.next;return e}},vr=class{constructor(e,t){this.heap={},this.layout=[],this.nodeById=new Map,this.seen=new Set,this.grids=new Map,this.referenceCounts=new Map,e.event!==`uncaught_exception`&&(this.heap=e.heap,this.referenceCounts=wr(e),this.grids=Er(e,this.referenceCounts),t&&t.layout.forEach(e=>{let t=e.toArray(),n=t[0];this.insertNode(n);for(let e=1;e<t.length;e++)this.insertAfterParent(t[e],n),n=t[e]}),e.ordered_globals.forEach(t=>{this.recurseSubEl(e.globals[t])}),e.stack_to_render.forEach(e=>{e.ordered_varnames.forEach(t=>{this.recurseSubEl(e.encoded_locals[t])})}),this.nodeById.forEach((e,t)=>{this.seen.has(t)||(this.nodeById.delete(t),e.remove())}),this.layout=this.layout.map(e=>{let t=e;for(;t!==null&&t.value===void 0;)t=t.next;return t}).filter(e=>e!==null))}insertBeforeChild(e,t){let n=this.nodeById.get(e).insertBefore(t);this.nodeById.set(t,n)}insertAfterParent(e,t){let n=this.nodeById.get(t).insertAfter(e);this.nodeById.set(e,n)}insertNode(e){let t=new _r(e);this.layout.push(t),this.nodeById.set(e,t)}recurseSubEl(e,t){if(Sr(e)){let n=e[1],r=this.heap[n];t&&xr(r,this.heap[t])?(!this.nodeById.has(n)&&this.nodeById.has(t)&&this.insertAfterParent(n,t),this.recurseHeapEl(n),!this.nodeById.has(t)&&this.nodeById.has(n)&&this.insertBeforeChild(n,t)):this.shouldNestEl(r,n)&&t||this.recurseHeapEl(n)}}shouldNestEl(e,t){return br(e)?!0:this.referenceCounts.get(t)===1&&Tr(e)}recurseHeapEl(e){if(this.seen.has(e))return;this.seen.add(e);let t=this.heap[e];if(!this.grids.has(e)){if(t[0]==`LIST`||t[0]==`TUPLE`||t[0]==`SET`)t.slice(1).forEach(t=>this.recurseSubEl(t,e));else if(t[0]==`DICT`)t.slice(1).forEach(t=>{let n=t[0],r=t[1];if(Sr(n)){let e=n[1];this.shouldNestEl(this.heap[e],e)||this.recurseHeapEl(e)}this.recurseSubEl(r,e)});else if(t[0]==`INSTANCE`||t[0]==`INSTANCE_PPRINT`||t[0]==`CLASS`){let n=t[0]==`INSTANCE`?2:3;t.slice(n).forEach(t=>this.recurseSubEl(t[1],e))}else t[0]==`FUNCTION`&&t.length==4&&t[3].forEach(t=>this.recurseSubEl(t[1],e))}this.nodeById.has(e)||this.insertNode(e)}},yr=new Set([`FUNCTION`,`property`,`classmethod`,`staticmethod`,`builtin_function_or_method`,`member_descriptor`,`getset_descriptor`,`method_descriptor`,`wrapper_descriptor`]);function br(e){return yr.has(e[0])?!0:e[0]===`INSTANCE`||e[0]===`INSTANCE_PPRINT`?yr.has(e[1]):!1}function xr(e,t){if(e[0]!==t[0]||e.length!==t.length)return!1;if(e[0]===`LIST`||e[0]===`TUPLE`)return!0;let n;if(e[0]==`DICT`)n=1;else if(e[0]==`INSTANCE`)n=2;else if(e[0]==`INSTANCE_PPRINT`)n=3;else return!1;let r=new Set;for(let t=n;t<e.length;t++)r.add(JSON.stringify(e[t][0]));for(let e=n;e<t.length;e++)if(!r.has(JSON.stringify(t[e][0])))return!1;return!0}function Sr(e){return e instanceof Array&&e[0]===`REF`}function Cr(e){return e[0]===`LIST`||e[0]===`TUPLE`||e[0]===`SET`?e.slice(1):e[0]===`DICT`?e.slice(1).flat():e[0]===`INSTANCE`?e.slice(2).map(e=>e[1]):e[0]===`INSTANCE_PPRINT`||e[0]===`CLASS`?e.slice(3).map(e=>e[1]):e[0]===`FUNCTION`&&e.length===4?e[3].map(e=>e[1]):[]}function wr(e){let t=new Map,n=e=>{if(Sr(e)){let n=e[1];t.set(n,(t.get(n)||0)+1)}};return Object.values(e.globals).forEach(n),e.stack_to_render.forEach(e=>Object.values(e.encoded_locals).forEach(n)),Object.values(e.heap).forEach(e=>Cr(e).forEach(n)),t}function Tr(e){return e[0]!==`LIST`&&e[0]!==`TUPLE`&&e[0]!==`SET`&&e[0]!==`DICT`?!1:!Cr(e).some(Sr)}function Er(e,t){let n=new Map;return Object.entries(e.heap).forEach(([r,i])=>{let a=Dr(i,e.heap,t);a&&n.set(parseInt(r),a)}),n}function Dr(e,t,n){if(e[0]!==`LIST`&&e[0]!==`TUPLE`)return null;let r=e.slice(1);if(r.length<2||!r.every(Sr))return null;let i=r.map(e=>e[1]);if(new Set(i).size!==i.length||i.some(e=>n.get(e)!==1))return null;let a=[];for(let e of i){let n=t[e];if(n===void 0||n[0]!==`LIST`&&n[0]!==`TUPLE`)return null;let r=n.slice(1);if(r.some(Sr))return null;a.push({kind:n[0]===`LIST`?`list`:`tuple`,values:r})}return{kind:e[0]===`LIST`?`list`:`tuple`,rows:a}}var Or=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},kr=class extends y{connectedCallback(){super.connectedCallback(),this.setAttribute(`role`,`alert`)}render(){return k`
            <h3>
                <slot name="title"></slot>
            </h3>
            <p>
                <slot></slot>
            </p>
        `}};kr.styles=[z,T`
            :host {
                display: block;
                padding: 20px;
                border-radius: 10px;
                background-color: ${Qt};
                color: ${Zt};
                font-size: 14px;
                width: 400px;
                max-width: calc(100% - 80px);
                margin: 20px auto;
            }

            h3 {
                margin-top: 0;
            }
        `],kr=Or([w(`tc-exception-card`)],kr);var Ar=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},jr={trace_label:`Execution trace`},Mr=class extends y{reComputeLayouts(){if(this.layouts=[],!this._trace||this._trace.length===0)return;let e=null;for(let t=0;t<this._trace.length;t++){let n=this._trace[t];e=new vr(n,e),this.layouts.push(e)}}constructor(){super(),this.translations=or,this.selectedFrame=0,this.layouts=[],this._trace=[],this.reComputeLayouts()}update(e){if(e.has(`trace`)){let e=this.trace||[];if(this.isExtensionOf(e,this._trace)){let t=this.layouts[this.layouts.length-1]??null;for(let n=this._trace.length;n<e.length;n++)t=new vr(e[n],t),this.layouts.push(t);this._trace=e}else this._trace=e,this.reComputeLayouts()}super.update(e)}isExtensionOf(e,t){return e.length>=t.length&&t.every((t,n)=>e[n]===t)}addFrame(e){this._trace.push(e);let t=this.layouts[this.layouts.length-1];this.layouts.push(new vr(e,t)),this.requestUpdate()}render(){return!this._trace||this._trace.length===0||!this.layouts||this.layouts.length===0||!this.layouts[this.selectedFrame]?k``:this._trace.length===1&&this._trace[0].event===`uncaught_exception`?k`
                <tc-exception-card>
                    <span slot="title">${this.translations.exception_title??dr.exception_title}</span>
                    ${this._trace[0].exception_msg}
                </tc-exception-card>
            `:k`
            <slot name="picker">
                <tc-frame-picker
                    role="group"
                    aria-label="${this.translations.picker_label??hr.picker_label}"
                    .length=${this._trace.length}
                    .value=${this.selectedFrame}
                    .translations=${this.translations}
                    @frame-change=${e=>this.selectedFrame=e.detail.frame}
                ></tc-frame-picker>
            </slot>
            <div
                class="content"
                role="region"
                tabindex="0"
                aria-label="${this.translations.trace_label??jr.trace_label}"
            >
                ${this.selectedFrame>0?this._trace[this.selectedFrame].event==`uncaught_exception`?k`
                                  <tc-exception-card>
                                      <span slot="title"
                                          >${this.translations.exception_title??dr.exception_title}</span
                                      >
                                      ${this._trace[this.selectedFrame].exception_msg}
                                  </tc-exception-card>
                              `:k`
                                  <tc-frame
                                      .frame=${this._trace[this.selectedFrame]}
                                      .layout=${this.layouts[this.selectedFrame]}
                                      .translations=${this.translations}
                                  ></tc-frame>
                              `:k` <tc-help-card .translations=${this.translations}></tc-help-card> `}
            </div>
        `}};Mr.styles=T`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
        }

        .content {
            flex: 1;
            overflow: auto;
            min-height: 0;
        }

        .content:focus-visible {
            outline: 2px solid ${R};
            outline-offset: -2px;
        }
    `,Ar([O({type:Array})],Mr.prototype,`trace`,void 0),Ar([O({type:Object})],Mr.prototype,`translations`,void 0),Ar([O({type:Number})],Mr.prototype,`selectedFrame`,void 0),Mr=Ar([w(`tc-trace`)],Mr);var Nr=T`:host{--_disabled-icon-color: var(--md-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-icon-button-disabled-icon-opacity, 0.38);--_icon-size: var(--md-icon-button-icon-size, 24px);--_selected-focus-icon-color: var(--md-icon-button-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-icon-color: var(--md-icon-button-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-color: var(--md-icon-button-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-opacity: var(--md-icon-button-selected-hover-state-layer-opacity, 0.08);--_selected-icon-color: var(--md-icon-button-selected-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-icon-color: var(--md-icon-button-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-color: var(--md-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-opacity: var(--md-icon-button-selected-pressed-state-layer-opacity, 0.12);--_state-layer-height: var(--md-icon-button-state-layer-height, 40px);--_state-layer-shape: var(--md-icon-button-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));--_state-layer-width: var(--md-icon-button-state-layer-width, 40px);--_focus-icon-color: var(--md-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-icon-button-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-icon-button-pressed-state-layer-opacity, 0.12);--_container-shape-start-start: 0;--_container-shape-start-end: 0;--_container-shape-end-end: 0;--_container-shape-end-start: 0;--_container-height: 0;--_container-width: 0;height:var(--_state-layer-height);width:var(--_state-layer-width)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_state-layer-height))/2) max(0px,(48px - var(--_state-layer-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_state-layer-shape);--md-focus-ring-shape-start-end: var(--_state-layer-shape);--md-focus-ring-shape-end-end: var(--_state-layer-shape);--md-focus-ring-shape-end-start: var(--_state-layer-shape)}.standard{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.standard:hover{color:var(--_hover-icon-color)}.standard:focus{color:var(--_focus-icon-color)}.standard:active{color:var(--_pressed-icon-color)}.standard:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}md-ripple{border-radius:var(--_state-layer-shape)}.standard:is(:disabled,[aria-disabled=true]){opacity:var(--_disabled-icon-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}
`;Nr.styleSheet;var Pr=class extends I{getRenderClasses(){return{...super.getRenderClasses(),standard:!0}}};Pr.styles=[Lt,Nr],Pr=A([w(`md-icon-button`)],Pr);var Fr=class extends oe{constructor(){super(...arguments),this.buffer=0}renderIndicator(){let e={transform:`scaleX(${(this.indeterminate?1:this.value/this.max)*100}%)`},t=this.buffer??0,n=t>0,r={transform:`scaleX(${(this.indeterminate||!n?1:t/this.max)*100}%)`},i=this.indeterminate||!n||t>=this.max||this.value>=this.max;return k`
      <div class="dots" ?hidden=${i}></div>
      <div class="inactive-track" style=${b(r)}></div>
      <div class="bar primary-bar" style=${b(e)}>
        <div class="bar-inner"></div>
      </div>
      <div class="bar secondary-bar">
        <div class="bar-inner"></div>
      </div>
    `}};A([O({type:Number})],Fr.prototype,`buffer`,void 0);var Ir=T`:host{--_active-indicator-color: var(--md-linear-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-height: var(--md-linear-progress-active-indicator-height, 4px);--_four-color-active-indicator-four-color: var(--md-linear-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-linear-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-linear-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-linear-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_track-color: var(--md-linear-progress-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_track-height: var(--md-linear-progress-track-height, 4px);--_track-shape: var(--md-linear-progress-track-shape, var(--md-sys-shape-corner-none, 0px));border-radius:var(--_track-shape);display:flex;position:relative;min-width:80px;height:var(--_track-height);content-visibility:auto;contain:strict}.progress,.dots,.inactive-track,.bar,.bar-inner{position:absolute}.progress{direction:ltr;inset:0;border-radius:inherit;overflow:hidden;display:flex;align-items:center}.bar{animation:none;width:100%;height:var(--_active-indicator-height);transform-origin:left center;transition:transform 250ms cubic-bezier(0.4, 0, 0.6, 1)}.secondary-bar{display:none}.bar-inner{inset:0;animation:none;background:var(--_active-indicator-color)}.inactive-track{background:var(--_track-color);inset:0;transition:transform 250ms cubic-bezier(0.4, 0, 0.6, 1);transform-origin:left center}.dots{inset:0;animation:linear infinite 250ms;animation-name:buffering;background-color:var(--_track-color);background-repeat:repeat-x;-webkit-mask-image:url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 2' preserveAspectRatio='xMinYMin slice'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 2' preserveAspectRatio='xMinYMin slice'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/svg%3E");z-index:-1}.dots[hidden]{display:none}.indeterminate .bar{transition:none}.indeterminate .primary-bar{inset-inline-start:-145.167%}.indeterminate .secondary-bar{inset-inline-start:-54.8889%;display:block}.indeterminate .primary-bar{animation:linear infinite 2s;animation-name:primary-indeterminate-translate}.indeterminate .primary-bar>.bar-inner{animation:linear infinite 2s primary-indeterminate-scale}.indeterminate.four-color .primary-bar>.bar-inner{animation-name:primary-indeterminate-scale,four-color;animation-duration:2s,4s}.indeterminate .secondary-bar{animation:linear infinite 2s;animation-name:secondary-indeterminate-translate}.indeterminate .secondary-bar>.bar-inner{animation:linear infinite 2s secondary-indeterminate-scale}.indeterminate.four-color .secondary-bar>.bar-inner{animation-name:secondary-indeterminate-scale,four-color;animation-duration:2s,4s}:host(:dir(rtl)){transform:scale(-1)}@keyframes primary-indeterminate-scale{0%{transform:scaleX(0.08)}36.65%{animation-timing-function:cubic-bezier(0.334731, 0.12482, 0.785844, 1);transform:scaleX(0.08)}69.15%{animation-timing-function:cubic-bezier(0.06, 0.11, 0.6, 1);transform:scaleX(0.661479)}100%{transform:scaleX(0.08)}}@keyframes secondary-indeterminate-scale{0%{animation-timing-function:cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971);transform:scaleX(0.08)}19.15%{animation-timing-function:cubic-bezier(0.152313, 0.196432, 0.648374, 1.00432);transform:scaleX(0.457104)}44.15%{animation-timing-function:cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179);transform:scaleX(0.72796)}100%{transform:scaleX(0.08)}}@keyframes buffering{0%{transform:translateX(calc(var(--_track-height) / 2 * 5))}}@keyframes primary-indeterminate-translate{0%{transform:translateX(0px)}20%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(0px)}59.15%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(83.6714%)}100%{transform:translateX(200.611%)}}@keyframes secondary-indeterminate-translate{0%{animation-timing-function:cubic-bezier(0.15, 0, 0.515058, 0.409685);transform:translateX(0px)}25%{animation-timing-function:cubic-bezier(0.31033, 0.284058, 0.8, 0.733712);transform:translateX(37.6519%)}48.35%{animation-timing-function:cubic-bezier(0.4, 0.627035, 0.6, 0.902026);transform:translateX(84.3862%)}100%{transform:translateX(160.278%)}}@keyframes four-color{0%{background:var(--_four-color-active-indicator-one-color)}15%{background:var(--_four-color-active-indicator-one-color)}25%{background:var(--_four-color-active-indicator-two-color)}40%{background:var(--_four-color-active-indicator-two-color)}50%{background:var(--_four-color-active-indicator-three-color)}65%{background:var(--_four-color-active-indicator-three-color)}75%{background:var(--_four-color-active-indicator-four-color)}90%{background:var(--_four-color-active-indicator-four-color)}100%{background:var(--_four-color-active-indicator-one-color)}}@media(forced-colors: active){:host{outline:1px solid CanvasText}.bar-inner,.dots{background-color:CanvasText}}
`;Ir.styleSheet;var Lr=class extends Fr{};Lr.styles=[Ir],Lr=A([w(`md-linear-progress`)],Lr);var Rr=T`@media(forced-colors: active){:host{--md-slider-active-track-color: CanvasText;--md-slider-disabled-active-track-color: GrayText;--md-slider-disabled-active-track-opacity: 1;--md-slider-disabled-handle-color: GrayText;--md-slider-disabled-inactive-track-color: GrayText;--md-slider-disabled-inactive-track-opacity: 1;--md-slider-focus-handle-color: CanvasText;--md-slider-handle-color: CanvasText;--md-slider-handle-shadow-color: Canvas;--md-slider-hover-handle-color: CanvasText;--md-slider-hover-state-layer-color: Canvas;--md-slider-hover-state-layer-opacity: 1;--md-slider-inactive-track-color: Canvas;--md-slider-label-container-color: Canvas;--md-slider-label-text-color: CanvasText;--md-slider-pressed-handle-color: CanvasText;--md-slider-pressed-state-layer-color: Canvas;--md-slider-pressed-state-layer-opacity: 1;--md-slider-with-overlap-handle-outline-color: CanvasText}.label,.label::before{border:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}:host(:not([disabled])) .track::before{border:1px solid var(--_active-track-color)}.tickmarks::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='CanvasText'%3E%3Ccircle cx='2' cy='2'  r='1'/%3E%3C/svg%3E")}.tickmarks::after{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='Canvas'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/svg%3E")}:host([disabled]) .tickmarks::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='Canvas'%3E%3Ccircle cx='2' cy='2'  r='1'/%3E%3C/svg%3E")}}
`;Rr.styleSheet;function zr(e,t,n){return e?t(e):n?.(e)}function Br(e,t){t.bubbles&&(!e.shadowRoot||t.composed)&&t.stopPropagation();let n=Reflect.construct(t.constructor,[t.type,t]),r=e.dispatchEvent(n);return r||t.preventDefault(),r}var Vr=C(mt(dt(y))),U=class extends Vr{get nameStart(){return this.getAttribute(`name-start`)??this.name}set nameStart(e){this.setAttribute(`name-start`,e)}get nameEnd(){return this.getAttribute(`name-end`)??this.nameStart}set nameEnd(e){this.setAttribute(`name-end`,e)}get renderAriaLabelStart(){let{ariaLabel:e}=this;return this.ariaLabelStart||e&&`${e} start`||this.valueLabelStart||String(this.valueStart)}get renderAriaValueTextStart(){return this.ariaValueTextStart||this.valueLabelStart||String(this.valueStart)}get renderAriaLabelEnd(){let{ariaLabel:e}=this;return this.range?this.ariaLabelEnd||e&&`${e} end`||this.valueLabelEnd||String(this.valueEnd):e||this.valueLabel||String(this.value)}get renderAriaValueTextEnd(){if(this.range)return this.ariaValueTextEnd||this.valueLabelEnd||String(this.valueEnd);let{ariaValueText:e}=this;return e||this.valueLabel||String(this.value)}constructor(){super(),this.min=0,this.max=100,this.valueLabel=``,this.valueLabelStart=``,this.valueLabelEnd=``,this.ariaLabelStart=``,this.ariaValueTextStart=``,this.ariaLabelEnd=``,this.ariaValueTextEnd=``,this.step=1,this.ticks=!1,this.labeled=!1,this.range=!1,this.handleStartHover=!1,this.handleEndHover=!1,this.startOnTop=!1,this.handlesOverlapping=!1,this.ripplePointerId=1,this.isRedispatchingEvent=!1,this.addEventListener(`click`,e=>{ot(e)&&this.inputEnd&&(this.focus(),at(this.inputEnd))})}focus(){this.inputEnd?.focus()}willUpdate(e){this.renderValueStart=e.has(`valueStart`)?this.valueStart:this.inputStart?.valueAsNumber;let t=e.has(`valueEnd`)&&this.range||e.has(`value`);this.renderValueEnd=t?this.range?this.valueEnd:this.value:this.inputEnd?.valueAsNumber,e.get(`handleStartHover`)===void 0?e.get(`handleEndHover`)!==void 0&&this.toggleRippleHover(this.rippleEnd,this.handleEndHover):this.toggleRippleHover(this.rippleStart,this.handleStartHover)}updated(e){if(this.range&&(this.renderValueStart=this.inputStart.valueAsNumber),this.renderValueEnd=this.inputEnd.valueAsNumber,this.range){let e=(this.max-this.min)/3;if(this.valueStart===void 0){this.inputStart.valueAsNumber=this.min+e;let t=this.inputStart.valueAsNumber;this.valueStart=this.renderValueStart=t}if(this.valueEnd===void 0){this.inputEnd.valueAsNumber=this.min+2*e;let t=this.inputEnd.valueAsNumber;this.valueEnd=this.renderValueEnd=t}}else this.value??=this.renderValueEnd;if(e.has(`range`)||e.has(`renderValueStart`)||e.has(`renderValueEnd`)||this.isUpdatePending){let e=this.handleStart?.querySelector(`.handleNub`),t=this.handleEnd?.querySelector(`.handleNub`);this.handlesOverlapping=Ur(e,t)}this.performUpdate()}render(){let e=this.step===0?1:this.step,t=Math.max(this.max-this.min,e),n=this.range?((this.renderValueStart??this.min)-this.min)/t:0,r=((this.renderValueEnd??this.min)-this.min)/t,i={"--_start-fraction":String(n),"--_end-fraction":String(r),"--_tick-count":String(t/e)},a={ranged:this.range},o=this.valueLabelStart||String(this.renderValueStart),s=(this.range?this.valueLabelEnd:this.valueLabel)||String(this.renderValueEnd),c={start:!0,value:this.renderValueStart,ariaLabel:this.renderAriaLabelStart,ariaValueText:this.renderAriaValueTextStart,ariaMin:this.min,ariaMax:this.valueEnd??this.max},l={start:!1,value:this.renderValueEnd,ariaLabel:this.renderAriaLabelEnd,ariaValueText:this.renderAriaValueTextEnd,ariaMin:this.range?this.valueStart??this.min:this.min,ariaMax:this.max},u={start:!0,hover:this.handleStartHover,label:o},d={start:!1,hover:this.handleEndHover,label:s},f={hover:this.handleStartHover||this.handleEndHover};return k` <div
      class="container ${v(a)}"
      style=${b(i)}>
      ${zr(this.range,()=>this.renderInput(c))}
      ${this.renderInput(l)} ${this.renderTrack()}
      <div class="handleContainerPadded">
        <div class="handleContainerBlock">
          <div class="handleContainer ${v(f)}">
            ${zr(this.range,()=>this.renderHandle(u))}
            ${this.renderHandle(d)}
          </div>
        </div>
      </div>
    </div>`}renderTrack(){return k`
      <div class="track"></div>
      ${this.ticks?k`<div class="tickmarks"></div>`:D}
    `}renderLabel(e){return k`<div class="label" aria-hidden="true">
      <span class="labelContent" part="label">${e}</span>
    </div>`}renderHandle({start:e,hover:t,label:n}){let r=!this.disabled&&e===this.startOnTop,i=!this.disabled&&this.handlesOverlapping,a=e?`start`:`end`;return k`<div
      class="handle ${v({[a]:!0,hover:t,onTop:r,isOverlapping:i})}">
      <md-focus-ring part="focus-ring" for=${a}></md-focus-ring>
      <md-ripple
        for=${a}
        class=${a}
        ?disabled=${this.disabled}></md-ripple>
      <div class="handleNub">
        <md-elevation part="elevation"></md-elevation>
      </div>
      ${zr(this.labeled,()=>this.renderLabel(n))}
    </div>`}renderInput({start:e,value:t,ariaLabel:n,ariaValueText:r,ariaMin:i,ariaMax:a}){let o=e?`start`:`end`;return k`<input
      type="range"
      class="${v({start:e,end:!e})}"
      @focus=${this.handleFocus}
      @pointerdown=${this.handleDown}
      @pointerup=${this.handleUp}
      @pointerenter=${this.handleEnter}
      @pointermove=${this.handleMove}
      @pointerleave=${this.handleLeave}
      @keydown=${this.handleKeydown}
      @keyup=${this.handleKeyup}
      @input=${this.handleInput}
      @change=${this.handleChange}
      id=${o}
      .disabled=${this.disabled}
      .min=${String(this.min)}
      aria-valuemin=${i}
      .max=${String(this.max)}
      aria-valuemax=${a}
      .step=${String(this.step)}
      .value=${String(t)}
      .tabIndex=${+!!e}
      aria-label=${n||D}
      aria-valuetext=${r} />`}async toggleRippleHover(e,t){let n=await e;n&&(t?n.handlePointerenter(new PointerEvent(`pointerenter`,{isPrimary:!0,pointerId:this.ripplePointerId})):n.handlePointerleave(new PointerEvent(`pointerleave`,{isPrimary:!0,pointerId:this.ripplePointerId})))}handleFocus(e){this.updateOnTop(e.target)}startAction(e){let t=e.target,n=t===this.inputStart?this.inputEnd:this.inputStart;this.action={canFlip:e.type===`pointerdown`,flipped:!1,target:t,fixed:n,values:new Map([[t,t.valueAsNumber],[n,n?.valueAsNumber]])}}finishAction(e){this.action=void 0}handleKeydown(e){this.startAction(e)}handleKeyup(e){this.finishAction(e)}handleDown(e){this.startAction(e),this.ripplePointerId=e.pointerId;let t=e.target===this.inputStart;this.handleStartHover=!this.disabled&&t&&!!this.handleStart,this.handleEndHover=!this.disabled&&!t&&!!this.handleEnd}async handleUp(e){if(!this.action)return;let{target:t,values:n,flipped:r}=this.action;await new Promise(requestAnimationFrame),t!==void 0&&(t.focus(),r&&t.valueAsNumber!==n.get(t)&&t.dispatchEvent(new Event(`change`,{bubbles:!0}))),this.finishAction(e)}handleMove(e){this.handleStartHover=!this.disabled&&Hr(e,this.handleStart),this.handleEndHover=!this.disabled&&Hr(e,this.handleEnd)}handleEnter(e){this.handleMove(e)}handleLeave(){this.handleStartHover=!1,this.handleEndHover=!1}updateOnTop(e){this.startOnTop=e.classList.contains(`start`)}needsClamping(){if(!this.action)return!1;let{target:e,fixed:t}=this.action;return e===this.inputStart?e.valueAsNumber>t.valueAsNumber:e.valueAsNumber<t.valueAsNumber}isActionFlipped(){let{action:e}=this;if(!e)return!1;let{target:t,fixed:n,values:r}=e;return e.canFlip&&r.get(t)===r.get(n)&&this.needsClamping()&&(e.canFlip=!1,e.flipped=!0,e.target=n,e.fixed=t),e.flipped}flipAction(){if(!this.action)return!1;let{target:e,fixed:t,values:n}=this.action,r=e.valueAsNumber!==t.valueAsNumber;return e.valueAsNumber=t.valueAsNumber,t.valueAsNumber=n.get(t),r}clampAction(){if(!this.needsClamping()||!this.action)return!1;let{target:e,fixed:t}=this.action;return e.valueAsNumber=t.valueAsNumber,!0}handleInput(e){if(this.isRedispatchingEvent)return;let t=!1,n=!1;this.range&&(this.isActionFlipped()&&(t=!0,n=this.flipAction()),this.clampAction()&&(t=!0,n=!1));let r=e.target;this.updateOnTop(r),this.range?(this.valueStart=this.inputStart.valueAsNumber,this.valueEnd=this.inputEnd.valueAsNumber):this.value=this.inputEnd.valueAsNumber,t&&e.stopPropagation(),n&&(this.isRedispatchingEvent=!0,Br(r,e),this.isRedispatchingEvent=!1)}handleChange(e){let t=e.target,{target:n,values:r}=this.action??{};n&&n.valueAsNumber===r.get(t)||Br(this,e),this.finishAction(e)}[ft](){if(this.range){let e=new FormData;return e.append(this.nameStart,String(this.valueStart)),e.append(this.nameEnd,String(this.valueEnd)),e}return String(this.value)}formResetCallback(){if(this.range){let e=this.getAttribute(`value-start`);this.valueStart=e===null?void 0:Number(e);let t=this.getAttribute(`value-end`);this.valueEnd=t===null?void 0:Number(t);return}let e=this.getAttribute(`value`);this.value=e===null?void 0:Number(e)}formStateRestoreCallback(e){if(Array.isArray(e)){let[[,t],[,n]]=e;this.valueStart=Number(t),this.valueEnd=Number(n),this.range=!0}else this.value=Number(e),this.range=!1}};U.shadowRootOptions={...y.shadowRootOptions,delegatesFocus:!0},A([O({type:Number})],U.prototype,`min`,void 0),A([O({type:Number})],U.prototype,`max`,void 0),A([O({type:Number})],U.prototype,`value`,void 0),A([O({type:Number,attribute:`value-start`})],U.prototype,`valueStart`,void 0),A([O({type:Number,attribute:`value-end`})],U.prototype,`valueEnd`,void 0),A([O({attribute:`value-label`})],U.prototype,`valueLabel`,void 0),A([O({attribute:`value-label-start`})],U.prototype,`valueLabelStart`,void 0),A([O({attribute:`value-label-end`})],U.prototype,`valueLabelEnd`,void 0),A([O({attribute:`aria-label-start`})],U.prototype,`ariaLabelStart`,void 0),A([O({attribute:`aria-valuetext-start`})],U.prototype,`ariaValueTextStart`,void 0),A([O({attribute:`aria-label-end`})],U.prototype,`ariaLabelEnd`,void 0),A([O({attribute:`aria-valuetext-end`})],U.prototype,`ariaValueTextEnd`,void 0),A([O({type:Number})],U.prototype,`step`,void 0),A([O({type:Boolean})],U.prototype,`ticks`,void 0),A([O({type:Boolean})],U.prototype,`labeled`,void 0),A([O({type:Boolean})],U.prototype,`range`,void 0),A([j(`input.start`)],U.prototype,`inputStart`,void 0),A([j(`.handle.start`)],U.prototype,`handleStart`,void 0),A([ke(`md-ripple.start`)],U.prototype,`rippleStart`,void 0),A([j(`input.end`)],U.prototype,`inputEnd`,void 0),A([j(`.handle.end`)],U.prototype,`handleEnd`,void 0),A([ke(`md-ripple.end`)],U.prototype,`rippleEnd`,void 0),A([S()],U.prototype,`handleStartHover`,void 0),A([S()],U.prototype,`handleEndHover`,void 0),A([S()],U.prototype,`startOnTop`,void 0),A([S()],U.prototype,`handlesOverlapping`,void 0),A([S()],U.prototype,`renderValueStart`,void 0),A([S()],U.prototype,`renderValueEnd`,void 0);function Hr({x:e,y:t},n){if(!n)return!1;let{top:r,left:i,bottom:a,right:o}=n.getBoundingClientRect();return e>=i&&e<=o&&t>=r&&t<=a}function Ur(e,t){if(!(e&&t))return!1;let n=e.getBoundingClientRect(),r=t.getBoundingClientRect();return!(n.top>r.bottom||n.right<r.left||n.bottom<r.top||n.left>r.right)}var Wr=T`:host{--_active-track-color: var(--md-slider-active-track-color, var(--md-sys-color-primary, #6750a4));--_active-track-height: var(--md-slider-active-track-height, 4px);--_active-track-shape: var(--md-slider-active-track-shape, var(--md-sys-shape-corner-full, 9999px));--_disabled-active-track-color: var(--md-slider-disabled-active-track-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-track-opacity: var(--md-slider-disabled-active-track-opacity, 0.38);--_disabled-handle-color: var(--md-slider-disabled-handle-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-handle-elevation: var(--md-slider-disabled-handle-elevation, 0);--_disabled-inactive-track-color: var(--md-slider-disabled-inactive-track-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-inactive-track-opacity: var(--md-slider-disabled-inactive-track-opacity, 0.12);--_focus-handle-color: var(--md-slider-focus-handle-color, var(--md-sys-color-primary, #6750a4));--_handle-color: var(--md-slider-handle-color, var(--md-sys-color-primary, #6750a4));--_handle-elevation: var(--md-slider-handle-elevation, 1);--_handle-height: var(--md-slider-handle-height, 20px);--_handle-shadow-color: var(--md-slider-handle-shadow-color, var(--md-sys-color-shadow, #000));--_handle-shape: var(--md-slider-handle-shape, var(--md-sys-shape-corner-full, 9999px));--_handle-width: var(--md-slider-handle-width, 20px);--_hover-handle-color: var(--md-slider-hover-handle-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-slider-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-slider-hover-state-layer-opacity, 0.08);--_inactive-track-color: var(--md-slider-inactive-track-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_inactive-track-height: var(--md-slider-inactive-track-height, 4px);--_inactive-track-shape: var(--md-slider-inactive-track-shape, var(--md-sys-shape-corner-full, 9999px));--_label-container-color: var(--md-slider-label-container-color, var(--md-sys-color-primary, #6750a4));--_label-container-height: var(--md-slider-label-container-height, 28px);--_pressed-handle-color: var(--md-slider-pressed-handle-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-slider-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-slider-pressed-state-layer-opacity, 0.12);--_state-layer-size: var(--md-slider-state-layer-size, 40px);--_with-overlap-handle-outline-color: var(--md-slider-with-overlap-handle-outline-color, var(--md-sys-color-on-primary, #fff));--_with-overlap-handle-outline-width: var(--md-slider-with-overlap-handle-outline-width, 1px);--_with-tick-marks-active-container-color: var(--md-slider-with-tick-marks-active-container-color, var(--md-sys-color-on-primary, #fff));--_with-tick-marks-container-size: var(--md-slider-with-tick-marks-container-size, 2px);--_with-tick-marks-disabled-container-color: var(--md-slider-with-tick-marks-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_with-tick-marks-inactive-container-color: var(--md-slider-with-tick-marks-inactive-container-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-slider-label-text-color, var(--md-sys-color-on-primary, #fff));--_label-text-font: var(--md-slider-label-text-font, var(--md-sys-typescale-label-medium-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-slider-label-text-line-height, var(--md-sys-typescale-label-medium-line-height, 1rem));--_label-text-size: var(--md-slider-label-text-size, var(--md-sys-typescale-label-medium-size, 0.75rem));--_label-text-weight: var(--md-slider-label-text-weight, var(--md-sys-typescale-label-medium-weight, var(--md-ref-typeface-weight-medium, 500)));--_start-fraction: 0;--_end-fraction: 0;--_tick-count: 0;display:inline-flex;vertical-align:middle;min-inline-size:200px;--md-elevation-level: var(--_handle-elevation);--md-elevation-shadow-color: var(--_handle-shadow-color)}md-focus-ring{height:48px;inset:unset;width:48px}md-elevation{transition-duration:250ms}@media(prefers-reduced-motion){.label{transition-duration:0}}:host([disabled]){opacity:var(--_disabled-active-track-opacity);--md-elevation-level: var(--_disabled-handle-elevation)}.container{flex:1;display:flex;align-items:center;position:relative;block-size:var(--_state-layer-size);pointer-events:none;touch-action:none;user-select:none}.track,.tickmarks{position:absolute;inset:0;display:flex;align-items:center}.track::before,.tickmarks::before,.track::after,.tickmarks::after{position:absolute;content:"";inset-inline-start:calc(var(--_state-layer-size)/2 - var(--_with-tick-marks-container-size));inset-inline-end:calc(var(--_state-layer-size)/2 - var(--_with-tick-marks-container-size));background-size:calc((100% - var(--_with-tick-marks-container-size)*2)/var(--_tick-count)) 100%}.track::before,.tickmarks::before{block-size:var(--_inactive-track-height);border-radius:var(--_inactive-track-shape)}.track::before{background:var(--_inactive-track-color)}.tickmarks::before{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-inactive-container-color) 0, var(--_with-tick-marks-inactive-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}:host([disabled]) .track::before{opacity:calc(1/var(--_disabled-active-track-opacity)*var(--_disabled-inactive-track-opacity));background:var(--_disabled-inactive-track-color)}.track::after,.tickmarks::after{block-size:var(--_active-track-height);border-radius:var(--_active-track-shape);clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))) 0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)))}.track::after{background:var(--_active-track-color)}.tickmarks::after{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-active-container-color) 0, var(--_with-tick-marks-active-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}.track:dir(rtl)::after{clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)) 0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))))}.tickmarks:dir(rtl)::after{clip-path:inset(0 calc(var(--_with-tick-marks-container-size) * min(var(--_start-fraction) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * var(--_start-fraction)) 0 calc(var(--_with-tick-marks-container-size) * min((1 - var(--_end-fraction)) * 1000000000, 1) + (100% - var(--_with-tick-marks-container-size) * 2) * (1 - var(--_end-fraction))))}:host([disabled]) .track::after{background:var(--_disabled-active-track-color)}:host([disabled]) .tickmarks::before{background-image:radial-gradient(circle at var(--_with-tick-marks-container-size) center, var(--_with-tick-marks-disabled-container-color) 0, var(--_with-tick-marks-disabled-container-color) calc(var(--_with-tick-marks-container-size) / 2), transparent calc(var(--_with-tick-marks-container-size) / 2))}.handleContainerPadded{position:relative;block-size:100%;inline-size:100%;padding-inline:calc(var(--_state-layer-size)/2)}.handleContainerBlock{position:relative;block-size:100%;inline-size:100%}.handleContainer{position:absolute;inset-block-start:0;inset-block-end:0;inset-inline-start:calc(100%*var(--_start-fraction));inline-size:calc(100%*(var(--_end-fraction) - var(--_start-fraction)))}.handle{position:absolute;block-size:var(--_state-layer-size);inline-size:var(--_state-layer-size);border-radius:var(--_handle-shape);display:flex;place-content:center;place-items:center}.handleNub{position:absolute;height:var(--_handle-height);width:var(--_handle-width);border-radius:var(--_handle-shape);background:var(--_handle-color)}:host([disabled]) .handleNub{background:var(--_disabled-handle-color)}input.end:focus~.handleContainerPadded .handle.end>.handleNub,input.start:focus~.handleContainerPadded .handle.start>.handleNub{background:var(--_focus-handle-color)}.container>.handleContainerPadded .handle.hover>.handleNub{background:var(--_hover-handle-color)}:host(:not([disabled])) input.end:active~.handleContainerPadded .handle.end>.handleNub,:host(:not([disabled])) input.start:active~.handleContainerPadded .handle.start>.handleNub{background:var(--_pressed-handle-color)}.onTop.isOverlapping .label,.onTop.isOverlapping .label::before{outline:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}.onTop.isOverlapping .handleNub{border:var(--_with-overlap-handle-outline-color) solid var(--_with-overlap-handle-outline-width)}.handle.start{inset-inline-start:calc(0px - var(--_state-layer-size)/2)}.handle.end{inset-inline-end:calc(0px - var(--_state-layer-size)/2)}.label{position:absolute;box-sizing:border-box;display:flex;padding:4px;place-content:center;place-items:center;border-radius:var(--md-sys-shape-corner-full, 9999px);color:var(--_label-text-color);font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);inset-block-end:100%;min-inline-size:var(--_label-container-height);min-block-size:var(--_label-container-height);background:var(--_label-container-color);transition:transform 100ms cubic-bezier(0.2, 0, 0, 1);transform-origin:center bottom;transform:scale(0)}:host(:focus-within) .label,.handleContainer.hover .label,:where(:has(input:active)) .label{transform:scale(1)}.label::before,.label::after{position:absolute;display:block;content:"";background:inherit}.label::before{inline-size:calc(var(--_label-container-height)/2);block-size:calc(var(--_label-container-height)/2);bottom:calc(var(--_label-container-height)/-10);transform:rotate(45deg)}.label::after{inset:0px;border-radius:inherit}.labelContent{z-index:1}input[type=range]{opacity:0;-webkit-tap-highlight-color:rgba(0,0,0,0);position:absolute;box-sizing:border-box;height:100%;width:100%;margin:0;background:rgba(0,0,0,0);cursor:pointer;pointer-events:auto;appearance:none}input[type=range]:focus{outline:none}::-webkit-slider-runnable-track{-webkit-appearance:none}::-moz-range-track{appearance:none}::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;block-size:var(--_handle-height);inline-size:var(--_handle-width);opacity:0;z-index:2}input.end::-webkit-slider-thumb{--_track-and-knob-padding: calc( (var(--_state-layer-size) - var(--_handle-width)) / 2 );--_x-translate: calc( var(--_track-and-knob-padding) - 2 * var(--_end-fraction) * var(--_track-and-knob-padding) );transform:translateX(var(--_x-translate))}input.end:dir(rtl)::-webkit-slider-thumb{transform:translateX(calc(-1 * var(--_x-translate)))}input.start::-webkit-slider-thumb{--_track-and-knob-padding: calc( (var(--_state-layer-size) - var(--_handle-width)) / 2 );--_x-translate: calc( var(--_track-and-knob-padding) - 2 * var(--_start-fraction) * var(--_track-and-knob-padding) );transform:translateX(var(--_x-translate))}input.start:dir(rtl)::-webkit-slider-thumb{transform:translateX(calc(-1 * var(--_x-translate)))}::-moz-range-thumb{appearance:none;block-size:var(--_state-layer-size);inline-size:var(--_state-layer-size);transform:scaleX(0);opacity:0;z-index:2}.ranged input.start{clip-path:inset(0 calc(100% - (var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2))) 0 0)}.ranged input.start:dir(rtl){clip-path:inset(0 0 0 calc(100% - (var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2))))}.ranged input.end{clip-path:inset(0 0 0 calc(var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2)))}.ranged input.end:dir(rtl){clip-path:inset(0 calc(var(--_state-layer-size) / 2 + (100% - var(--_state-layer-size)) * (var(--_start-fraction) + (var(--_end-fraction) - var(--_start-fraction)) / 2)) 0 0)}.onTop{z-index:1}.handle{--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}md-ripple{border-radius:50%;height:var(--_state-layer-size);width:var(--_state-layer-size)}
`;Wr.styleSheet;var Gr=class extends U{};Gr.styles=[Wr,Rr],Gr=A([w(`md-slider`)],Gr);var Kr=class extends i{constructor(...e){super(...e),this.reducedMotion=new ne(this),this.renderedView=void 0,this.shouldRefocus=!1}static get styles(){return T`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 0;
                container-type: inline-size;

                /* Base / surface */
                --tc-surface-color: var(--md-sys-color-surface-container);
                --tc-on-surface-color: var(--md-sys-color-on-surface);
                --tc-surface-container-color: var(--md-sys-color-surface-container-highest);
                --tc-outline-color: var(--md-sys-color-outline);
                --tc-outline-variant-color: var(--md-sys-color-outline-variant);
                --tc-primary-color: var(--md-sys-color-primary);

                /* Secondary */
                --tc-secondary-surface-color: var(
                    --md-sys-color-secondary-surface,
                    var(--md-sys-color-secondary-container)
                );
                --tc-secondary-on-surface-color: var(
                    --md-sys-color-on-secondary-surface,
                    var(--md-sys-color-on-secondary-container)
                );
                --tc-secondary-surface-container-color: var(--md-sys-color-secondary-container);
                --tc-secondary-outline-color: var(--md-sys-color-secondary-outline, var(--md-sys-color-outline));
                --tc-secondary-color: var(--md-sys-color-secondary);

                /* Tertiary */
                --tc-tertiary-surface-color: var(
                    --md-sys-color-tertiary-surface,
                    var(--md-sys-color-tertiary-container)
                );
                --tc-tertiary-on-surface-color: var(
                    --md-sys-color-on-tertiary-surface,
                    var(--md-sys-color-on-tertiary-container)
                );
                --tc-tertiary-surface-container-color: var(--md-sys-color-tertiary-container);
                --tc-tertiary-outline-color: var(--md-sys-color-tertiary-outline, var(--md-sys-color-outline));
                --tc-tertiary-color: var(--md-sys-color-tertiary);
            }

            .body {
                flex: 1;
                min-height: 0;
                display: flex;
                flex-direction: column;
            }

            tc-trace {
                flex: 1;
            }

            /* Centred with auto margins rather than justify-content, so a pane shorter than
               the message scrolls it instead of cutting off its top. */
            .message {
                flex: 1;
                min-height: 0;
                overflow: auto;
                display: flex;
            }

            .message-content {
                margin: auto;
                padding: 0.5rem 1rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .message-content md-icon {
                --md-icon-size: 3rem;
                margin-bottom: 0.5rem;
                color: var(--md-sys-color-outline);
            }

            .message-title {
                margin: 0;
                font-size: 1rem;
                font-weight: 500;
                color: var(--md-sys-color-on-surface);
            }

            .message-text {
                margin: 0.25rem 0 0;
                font-size: 0.875rem;
                color: var(--md-sys-color-on-surface-variant);
            }

            /* The same button as Debug in the code bar. */
            .message-content md-outlined-button {
                margin-top: 1rem;
                --md-outlined-button-container-height: 2rem;
                --md-outlined-button-with-leading-icon-leading-space: 0.75rem;
                --md-outlined-button-with-leading-icon-trailing-space: 1rem;
                --md-outlined-button-outline-color: var(--md-sys-color-outline-variant);
            }

            md-linear-progress {
                flex-shrink: 0;
                width: 100%;
            }

            /* The step controls form the header bar of the panel; the memory view below it scrolls. */
            .stepper {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.375rem;
                flex-shrink: 0;
                min-height: 2.75rem;
                padding: 0.25rem 0.625rem;
                box-sizing: border-box;
                border-bottom: 1px solid var(--md-sys-color-outline-variant);
                background-color: var(--md-sys-color-surface);
                color: var(--md-sys-color-on-surface);
                font-size: 0.875rem;
            }

            .stepper-label {
                margin-inline-end: 0.25rem;
                font-weight: 500;
            }

            .stepper md-icon-button {
                --md-icon-button-state-layer-width: 2rem;
                --md-icon-button-state-layer-height: 2rem;
                --md-icon-button-icon-size: 1.25rem;
                --md-icon-button-icon-color: var(--md-sys-color-primary);
                --md-icon-button-hover-icon-color: var(--md-sys-color-primary);
                --md-icon-button-focus-icon-color: var(--md-sys-color-primary);
                --md-icon-button-pressed-icon-color: var(--md-sys-color-primary);
            }

            .step-count {
                min-width: 4rem;
                text-align: center;
                font-variant-numeric: tabular-nums;
            }

            .stepper md-slider {
                flex: 1 1 5rem;
                min-inline-size: 5rem;
            }

            /* A phone sheet has no room for the label next to the slider. */
            @container (max-width: 24rem) {
                .stepper-label {
                    display: none;
                }
            }
        `}willUpdate(e){super.willUpdate(e);let t=this.shadowRoot?.activeElement!=null;this.shouldRefocus=t&&this.view!==this.renderedView}updated(e){super.updated(e);let t=this.view;if(this.renderedView!==void 0&&this.renderedView!==t){let e=this.renderRoot.querySelector(`.body`);e&&we(e)}this.renderedView=t,this.shouldRefocus&&requestAnimationFrame(()=>this.focusView())}focusView(){(this.renderRoot.querySelector(`.stepper md-icon-button, md-outlined-button`)??this.renderRoot.querySelector(`.body`))?.focus()}get view(){let{active:e,trace:t}=this.papyros.debugger;return e&&t.length>0?`trace`:e&&this.papyros.runtime.isRunning(this.papyros)?`starting`:`empty`}selectFrame(e){this.papyros.debugger.activeFrame=e}renderStepper(e){let t=this.papyros.debugger.trace.length,n=t-1,r=this.papyros.constants.icons,i=this.t(`Papyros.debugger_step`);return k`
            <div slot="picker" class="stepper" role="group" aria-labelledby="stepper-label">
                <!-- Names the group, and is hidden itself so it is not read a second time. -->
                <span class="stepper-label" id="stepper-label" aria-hidden="true">${i}</span>
                <md-icon-button
                    aria-label=${this.t(`Papyros.debugger.first_step`)}
                    ?soft-disabled=${e===0}
                    @click=${()=>this.selectFrame(0)}
                >
                    <md-icon>${r.firstStep}</md-icon>
                </md-icon-button>
                <md-icon-button
                    aria-label=${this.t(`Papyros.debugger.previous_step`)}
                    ?soft-disabled=${e===0}
                    @click=${()=>this.selectFrame(e-1)}
                >
                    <md-icon>${r.previousStep}</md-icon>
                </md-icon-button>
                <output class="step-count" role="status" aria-label=${this.t(`Papyros.debugger.current_step`)}>
                    ${e+1} / ${t}
                </output>
                <md-icon-button
                    aria-label=${this.t(`Papyros.debugger.next_step`)}
                    ?soft-disabled=${e===n}
                    @click=${()=>this.selectFrame(e+1)}
                >
                    <md-icon>${r.nextStep}</md-icon>
                </md-icon-button>
                <md-icon-button
                    aria-label=${this.t(`Papyros.debugger.last_step`)}
                    ?soft-disabled=${e===n}
                    @click=${()=>this.selectFrame(n)}
                >
                    <md-icon>${r.lastStep}</md-icon>
                </md-icon-button>
                <md-slider
                    min="0"
                    max=${n}
                    .value=${e}
                    aria-label=${this.t(`Papyros.debugger.slider_label`)}
                    aria-valuetext=${this.t(`Papyros.debugger.step_of`,{step:e+1,total:t})}
                    @input=${e=>this.selectFrame(e.target.value??0)}
                ></md-slider>
            </div>
        `}renderEmpty(){let e=this.papyros.constants.icons,t=this.papyros.runner,n=this.papyros.debugger.hasDebugged;return k`
            <div class="message">
                <div class="message-content">
                    <md-icon aria-hidden="true">${e.bug}</md-icon>
                    <p class="message-title">
                        ${n?this.t(`Papyros.debugger_stopped_title`):this.t(`Papyros.debugger_empty_title`)}
                    </p>
                    <p class="message-text">
                        ${n?this.t(`Papyros.debugger_stopped_text`):this.t(`Papyros.debugger_empty_text`)}
                    </p>
                    ${t.runModes.includes(xe.Debug)?k`<md-outlined-button
                                  ?disabled=${!t.canStart}
                                  @click=${()=>void t.start(xe.Debug)}
                              >
                                  <span slot="icon">${e[xe.Debug]}</span>${this.t(`Papyros.run_modes.debug`)}
                              </md-outlined-button>`:D}
                </div>
            </div>
        `}renderStarting(){let e=this.t(`Papyros.debugger_preparing`),t=!p();return k`
            ${t?k`<md-linear-progress indeterminate aria-label=${e}></md-linear-progress>`:D}
            <div class="message">
                <div class="message-content">
                    <!-- A progress bar is named after this text, so it is not read a second time. -->
                    <p class="message-text" aria-hidden=${t?`true`:D}>${e}</p>
                </div>
            </div>
        `}renderTrace(){let e=this.papyros.debugger.activeFrame??0;return k`<tc-trace
            .trace=${this.papyros.debugger.trace}
            .translations=${this.papyros.i18n.getTranslations(`Papyros.debugger`)}
            .selectedFrame=${e}
            @frame-change=${e=>this.selectFrame(e.detail.frame)}
        >
            ${this.renderStepper(e)}
        </tc-trace>`}render(){let e=this.view;return k`
            <!-- Out of the tab order: it only holds focus while a view has no controls of its own. -->
            <div class="body" tabindex="-1">
                ${e===`trace`?this.renderTrace():e===`starting`?this.renderStarting():this.renderEmpty()}
            </div>
        `}};Kr=g([w(`p-debugger`)],Kr);var qr=class{constructor(){this.fragments=[],this.order=void 0,this.open=``,this.close=``,this.applied=0,this.lastApplied=void 0}build(e){this.canExtend(e)||this.reset();for(let t=this.applied;t<e.length;t++)this.apply(e[t]);if(this.applied=e.length,this.lastApplied=e[e.length-1],!this.open)return;let t=this.order??this.fragments.map((e,t)=>t);return this.open+t.map(e=>this.fragments[e]??``).join(``)+this.close}canExtend(e){return this.applied<=e.length&&(this.applied===0||e[this.applied-1]===this.lastApplied)}reset(){this.fragments=[],this.order=void 0,this.open=``,this.close=``,this.applied=0,this.lastApplied=void 0}apply(e){e.clear&&(this.fragments=[],this.order=void 0),e.open!==void 0&&(this.open=e.open,this.close=e.close??``);for(let[t,n]of e.set??[])this.fragments[t]=n;e.order!==void 0&&(this.order=e.order)}},Jr=[c,s],Yr=class extends i{constructor(...e){super(...e),this.heightTransition=new Te(this),this.renderedTab=void 0,this.turtleSvg=new qr,this.followEnd=new be(this,()=>this.renderRoot.querySelector(`.content`)),this.turtleSvgSource=void 0,this.turtleSvgUrl=``}static get styles(){return T`
            /* The panel takes the height of its output, up to a maximum that the host can set. */
            :host {
                width: 100%;
                max-height: var(--papyros-output-max-height, 10rem);
                min-height: 0;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: 0.625rem;
                background-color: var(--md-sys-color-surface);
                overflow: hidden;
                box-sizing: border-box;
            }

            /* A drawing needs a fixed height to scale into, whatever it holds. */
            :host([active-tab="turtle"]) {
                height: var(--papyros-output-turtle-height, 23.75rem);
                max-height: none;
            }

            ${me}
            ${Se}

            .content {
                flex: 1 1 auto;
                min-height: 0;
                overflow: auto;
                /* Scroll anchoring would move the view away from the end that it follows. */
                overflow-anchor: none;
                padding: 0.5rem 0.875rem;
                background-color: var(--md-sys-color-surface-container-highest);
            }

            .content:focus-visible {
                outline: 2px solid var(--md-sys-color-primary);
                outline-offset: -2px;
            }

            .content.turtle {
                container-type: size;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
            }

            .output-img {
                max-height: 300px;
                margin: 0.5rem 0;
            }

            img.turtle,
            .turtle-placeholder {
                max-width: 100cqw;
                max-height: 100cqh;
                box-sizing: border-box;
                background-color: var(--md-sys-color-surface);
                border: 1px solid var(--md-sys-color-outline-variant);
            }

            .turtle-placeholder {
                width: 400px;
                height: 400px;
            }

            pre {
                font-family: monospace;
                font-size: 0.875rem;
                line-height: 1.4;
                margin: 0;
            }

            .error {
                color: var(--md-sys-color-error);
            }

            ${ae}

            .place-holder {
                white-space: pre-wrap;
            }

            ${le}
            ${de}
        `}disconnectedCallback(){super.disconnectedCallback(),this.heightTransition.cancel()}willUpdate(e){super.willUpdate(e),this.papyros.io.output.length===0&&this.followEnd.restart();let t=this.papyros.io.activeOutputTab;this.renderedTab!==void 0&&this.renderedTab!==t&&this.heightTransition.capture(),this.renderedTab=t}update(e){this.setAttribute(`active-tab`,this.papyros.io.activeOutputTab),super.update(e)}updated(e){super.updated(e),this.heightTransition.play()}get maxOutputLength(){return this.papyros.debugger.active&&this.papyros.debugger.debugOutputs!==void 0?this.papyros.debugger.debugOutputs:this.papyros.constants.maxOutputLength}turtleUrl(e){return e!==this.turtleSvgSource&&(this.turtleSvgSource=e,this.turtleSvgUrl=`data:image/svg+xml,${encodeURIComponent(e)}`),this.turtleSvgUrl}renderOutputs(e){if(this.papyros.io.activeOutputTab===`turtle`){let t=e.filter(e=>e.type===he.turtle).map(e=>e.content),n=this.turtleSvg.build(t);return n===void 0?[]:[k`<img class="turtle" src=${this.turtleUrl(n)} alt=${this.t(`Papyros.turtle_alt`)} />`]}return e.filter(e=>e.type!==he.turtle).map(e=>ge(e,this.papyros))}get showTurtleTab(){return this.papyros.io.hasTurtleOutput||this.papyros.io.activeOutputTab===`turtle`}handleTabsKeydown(e){let t=Jr,n=ce(e.key,t.indexOf(this.papyros.io.activeOutputTab),t.length);if(n===void 0)return;e.preventDefault();let r=t[n];this.papyros.io.selectOutputTab(r),this.updateComplete.then(()=>{this.renderRoot.querySelector(`#tab-${r}`)?.focus()})}renderTab(e){let t=this.papyros.io.activeOutputTab===e;return k`
            <button
                id="tab-${e}"
                role="tab"
                aria-selected=${t}
                aria-controls="output-panel"
                tabindex=${t?0:-1}
                class=${t?`active`:``}
                @click=${()=>this.papyros.io.selectOutputTab(e)}
            >
                ${e===`turtle`?this.t(`Papyros.output_tab_turtle`):this.t(`Papyros.output_tab_text`)}
            </button>
        `}renderTabs(){return k`
            <div
                class="tablist"
                role="tablist"
                aria-label=${this.t(`Papyros.output_tabs`)}
                @keydown=${this.handleTabsKeydown}
            >
                ${Jr.map(e=>this.renderTab(e))}
            </div>
        `}render(){let e=this.papyros.io.activeOutputTab,{shown:t,truncated:n}=ve(this.papyros.io.output,this.maxOutputLength),r=this.renderOutputs(t),i=e===`output`&&r.length===0,a=e===`turtle`&&r.length===0,o=e===`output`&&n&&!this.papyros.debugger.active,s=this.showTurtleTab,c=this.papyros.debugger.active?this.t(`Papyros.debug_output_placeholder`):this.t(`Papyros.output_placeholder`);return k`
            <div class="tab-bar">
                <span class="pane-label" id="output-title">${this.t(`Papyros.output`)}</span>
                <!-- A tablist may only contain tabs, so the pane label sits outside it. -->
                ${s?this.renderTabs():D}
            </div>
            <div
                class="content ${e===`turtle`?`turtle`:``}"
                id="output-panel"
                role=${s?`tabpanel`:`region`}
                aria-labelledby=${s?`tab-${e}`:`output-title`}
                tabindex="0"
                @scroll=${this.followEnd.onScroll}
            >
                ${e===`output`?k`
                              ${i?k`<pre class="place-holder">${c}</pre>`:D}
                              <!-- Screen readers only announce changes to a live region that is already in the page. -->
                              <pre role="log" aria-live="polite" aria-relevant="additions text">${r}</pre>
                          `:a?k`<div class="turtle-placeholder"></div>`:r}
                ${o?pe(this.papyros,this.maxOutputLength):k``}
            </div>
        `}};Yr=g([w(`p-output`)],Yr);var Xr=class extends r{static get styles(){return T`
            :host {
                width: 100%;
                height: 100%;
            }
        `}set usedLines(e){let n=Array.from({length:e},(e,t)=>t+1);this.view?.dispatch({effects:t.of(n)})}set readOnly(e){this.configure({debugging:e?o.readOnly.of(!0):[]})}constructor(){super(),this.configure({default:[Ce,ee.of(m)]})}};g([O({type:Number})],Xr.prototype,`usedLines`,null),g([O({type:Boolean})],Xr.prototype,`readOnly`,null),Xr=g([w(`p-batch-input-editor`)],Xr);var Zr=class extends i{static get styles(){return T`
            :host {
                width: 100%;
                height: 100%;
                overflow: auto;
                display: block;
            }
        `}get usedLines(){return this.papyros.debugger.active&&this.papyros.debugger.debugUsedInputs!==void 0?this.papyros.debugger.debugUsedInputs:this.papyros.io.inputs.length}get placeholder(){return this.papyros.io.prompt?this.papyros.io.prompt:this.t(`Papyros.input_placeholder.batch`)}render(){return k`
            <p-batch-input-editor
                .value=${this.papyros.io.inputBuffer}
                .usedLines=${this.usedLines}
                .readOnly=${this.papyros.debugger.active&&this.papyros.runner.state===_.Ready}
                .placeholder=${this.placeholder}
                .translations=${this.papyros.i18n.getTranslations(`CodeMirror`)}
                .theme=${this.papyros.constants.CodeMirrorTheme}
                .accessibleName=${this.t(`Papyros.editor.input_label`)}
                @change=${e=>this.papyros.io.inputBuffer=e.detail}
            ></p-batch-input-editor>
        `}};Zr=g([w(`p-batch-input`)],Zr);var W=class extends y{constructor(){super(...arguments),this.disabled=!1,this.error=!1,this.focused=!1,this.label=``,this.noAsterisk=!1,this.populated=!1,this.required=!1,this.resizable=!1,this.supportingText=``,this.errorText=``,this.count=-1,this.max=-1,this.hasStart=!1,this.hasEnd=!1,this.isAnimating=!1,this.refreshErrorAlert=!1,this.disableTransitions=!1}get counterText(){let e=this.count??-1,t=this.max??-1;return e<0||t<=0?``:`${e} / ${t}`}get supportingOrErrorText(){return this.error&&this.errorText?this.errorText:this.supportingText}reannounceError(){this.refreshErrorAlert=!0}update(e){e.has(`disabled`)&&e.get(`disabled`)!==void 0&&(this.disableTransitions=!0),this.disabled&&this.focused&&(e.set(`focused`,!0),this.focused=!1),this.animateLabelIfNeeded({wasFocused:e.get(`focused`),wasPopulated:e.get(`populated`)}),super.update(e)}render(){let e=this.renderLabel(!0),t=this.renderLabel(!1),n=this.renderOutline?.(e),r={disabled:this.disabled,"disable-transitions":this.disableTransitions,error:this.error&&!this.disabled,focused:this.focused,"with-start":this.hasStart,"with-end":this.hasEnd,populated:this.populated,resizable:this.resizable,required:this.required,"no-label":!this.label};return k`
      <div class="field ${v(r)}">
        <div class="container-overflow">
          ${this.renderBackground?.()}
          <slot name="container"></slot>
          ${this.renderStateLayer?.()} ${this.renderIndicator?.()} ${n}
          <div class="container">
            <div class="start">
              <slot name="start"></slot>
            </div>
            <div class="middle">
              <div class="label-wrapper">
                ${t} ${n?D:e}
              </div>
              <div class="content">
                <slot></slot>
              </div>
            </div>
            <div class="end">
              <slot name="end"></slot>
            </div>
          </div>
        </div>
        ${this.renderSupportingText()}
      </div>
    `}updated(e){(e.has(`supportingText`)||e.has(`errorText`)||e.has(`count`)||e.has(`max`))&&this.updateSlottedAriaDescribedBy(),this.refreshErrorAlert&&requestAnimationFrame(()=>{this.refreshErrorAlert=!1}),this.disableTransitions&&requestAnimationFrame(()=>{this.disableTransitions=!1})}renderSupportingText(){let{supportingOrErrorText:e,counterText:t}=this;if(!e&&!t)return D;let n=k`<span>${e}</span>`,r=t?k`<span class="counter">${t}</span>`:D,i=this.error&&this.errorText&&!this.refreshErrorAlert?`alert`:D;return k`
      <div class="supporting-text" role=${i}>${n}${r}</div>
      <slot
        name="aria-describedby"
        @slotchange=${this.updateSlottedAriaDescribedBy}></slot>
    `}updateSlottedAriaDescribedBy(){for(let e of this.slottedAriaDescribedBy)ye(k`${this.supportingOrErrorText} ${this.counterText}`,e),e.setAttribute(`hidden`,``)}renderLabel(e){if(!this.label)return D;let t;t=e?this.focused||this.populated||this.isAnimating:!this.focused&&!this.populated&&!this.isAnimating;let n={hidden:!t,floating:e,resting:!e},r=`${this.label}${this.required&&!this.noAsterisk?`*`:``}`;return k`
      <span class="label ${v(n)}" aria-hidden=${!t}
        >${r}</span
      >
    `}animateLabelIfNeeded({wasFocused:e,wasPopulated:t}){if(!this.label||(e??=this.focused,t??=this.populated,(e||t)===(this.focused||this.populated)))return;let n=this.getLabelKeyframes();n.length&&(this.isAnimating=!0,this.labelAnimation?.cancel(),this.labelAnimation=this.floatingLabelEl?.animate(n,{duration:150,easing:Ue.STANDARD}),this.labelAnimation?.addEventListener(`finish`,()=>{this.isAnimating=!1}))}getLabelKeyframes(){let{floatingLabelEl:e,restingLabelEl:t}=this;if(!e||!t)return[];let{x:n,y:r,height:i}=e.getBoundingClientRect(),{x:a,y:o,height:s}=t.getBoundingClientRect(),c=e.scrollWidth,l=t.scrollWidth;if(c===0||l===0)return[];let u=l/c,d=`translateX(${a-n}px) translateY(${o-r+Math.round((s-i*u)/2)}px) scale(${u})`,f=`translateX(0) translateY(0) scale(1)`,p=t.clientWidth,m=l>p?`${p/u}px`:``;return this.focused||this.populated?[{transform:d,width:m},{transform:f,width:m}]:[{transform:f,width:m},{transform:d,width:m}]}getSurfacePositionClientRect(){return this.containerEl.getBoundingClientRect()}};A([O({type:Boolean})],W.prototype,`disabled`,void 0),A([O({type:Boolean})],W.prototype,`error`,void 0),A([O({type:Boolean})],W.prototype,`focused`,void 0),A([O()],W.prototype,`label`,void 0),A([O({type:Boolean,attribute:`no-asterisk`})],W.prototype,`noAsterisk`,void 0),A([O({type:Boolean})],W.prototype,`populated`,void 0),A([O({type:Boolean})],W.prototype,`required`,void 0),A([O({type:Boolean})],W.prototype,`resizable`,void 0),A([O({attribute:`supporting-text`})],W.prototype,`supportingText`,void 0),A([O({attribute:`error-text`})],W.prototype,`errorText`,void 0),A([O({type:Number})],W.prototype,`count`,void 0),A([O({type:Number})],W.prototype,`max`,void 0),A([O({type:Boolean,attribute:`has-start`})],W.prototype,`hasStart`,void 0),A([O({type:Boolean,attribute:`has-end`})],W.prototype,`hasEnd`,void 0),A([M({slot:`aria-describedby`})],W.prototype,`slottedAriaDescribedBy`,void 0),A([S()],W.prototype,`isAnimating`,void 0),A([S()],W.prototype,`refreshErrorAlert`,void 0),A([S()],W.prototype,`disableTransitions`,void 0),A([j(`.label.floating`)],W.prototype,`floatingLabelEl`,void 0),A([j(`.label.resting`)],W.prototype,`restingLabelEl`,void 0),A([j(`.container`)],W.prototype,`containerEl`,void 0);var Qr=class extends W{renderOutline(e){return k`
      <div class="outline">
        <div class="outline-start"></div>
        <div class="outline-notch">
          <div class="outline-panel-inactive"></div>
          <div class="outline-panel-active"></div>
          <div class="outline-label">${e}</div>
        </div>
        <div class="outline-end"></div>
      </div>
    `}},$r=T`@layer styles{:host{--_bottom-space: var(--md-outlined-field-bottom-space, 16px);--_content-color: var(--md-outlined-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-outlined-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-outlined-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-outlined-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-outlined-field-content-space, 16px);--_content-weight: var(--md-outlined-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-content-color: var(--md-outlined-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-outlined-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-outlined-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-outlined-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-outlined-field-disabled-leading-content-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-field-disabled-outline-opacity, 0.12);--_disabled-outline-width: var(--md-outlined-field-disabled-outline-width, 1px);--_disabled-supporting-text-color: var(--md-outlined-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-outlined-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-outlined-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-outlined-field-disabled-trailing-content-opacity, 0.38);--_error-content-color: var(--md-outlined-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-content-color: var(--md-outlined-field-error-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-outlined-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-outlined-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-outline-color: var(--md-outlined-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_error-focus-supporting-text-color: var(--md-outlined-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-outlined-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-content-color: var(--md-outlined-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-outlined-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-outlined-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-outline-color: var(--md-outlined-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-supporting-text-color: var(--md-outlined-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-outlined-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-outlined-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-outlined-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-outline-color: var(--md-outlined-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_error-supporting-text-color: var(--md-outlined-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-outlined-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-content-color: var(--md-outlined-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-outlined-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-outlined-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-outline-color: var(--md-outlined-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_focus-outline-width: var(--md-outlined-field-focus-outline-width, 3px);--_focus-supporting-text-color: var(--md-outlined-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-outlined-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-content-color: var(--md-outlined-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-outlined-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-leading-content-color: var(--md-outlined-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-outline-color: var(--md-outlined-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-outline-width: var(--md-outlined-field-hover-outline-width, 1px);--_hover-supporting-text-color: var(--md-outlined-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-outlined-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-outlined-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-outlined-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-padding-bottom: var(--md-outlined-field-label-text-padding-bottom, 8px);--_label-text-populated-line-height: var(--md-outlined-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-outlined-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-outlined-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-outlined-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-outlined-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-outlined-field-leading-space, 16px);--_outline-color: var(--md-outlined-field-outline-color, var(--md-sys-color-outline, #79747e));--_outline-label-padding: var(--md-outlined-field-outline-label-padding, 4px);--_outline-width: var(--md-outlined-field-outline-width, 1px);--_supporting-text-color: var(--md-outlined-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-outlined-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-outlined-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-outlined-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-outlined-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-outlined-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-outlined-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-outlined-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-outlined-field-top-space, 16px);--_trailing-content-color: var(--md-outlined-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-outlined-field-trailing-space, 16px);--_with-leading-content-leading-space: var(--md-outlined-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-outlined-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-outlined-field-container-shape-start-start, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-outlined-field-container-shape-start-end, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-outlined-field-container-shape-end-end, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-start: var(--md-outlined-field-container-shape-end-start, var(--md-outlined-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)))}.outline{border-color:var(--_outline-color);border-radius:inherit;display:flex;pointer-events:none;height:100%;position:absolute;width:100%;z-index:1}.outline-start::before,.outline-start::after,.outline-panel-inactive::before,.outline-panel-inactive::after,.outline-panel-active::before,.outline-panel-active::after,.outline-end::before,.outline-end::after{border:inherit;content:"";inset:0;position:absolute}.outline-start,.outline-end{border:inherit;border-radius:inherit;box-sizing:border-box;position:relative}.outline-start::before,.outline-start::after,.outline-end::before,.outline-end::after{border-bottom-style:solid;border-top-style:solid}.outline-start::after,.outline-end::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .outline-start::after,.focused .outline-end::after{opacity:1}.outline-start::before,.outline-start::after{border-inline-start-style:solid;border-inline-end-style:none;border-start-start-radius:inherit;border-start-end-radius:0;border-end-start-radius:inherit;border-end-end-radius:0;margin-inline-end:var(--_outline-label-padding)}.outline-end{flex-grow:1;margin-inline-start:calc(-1*var(--_outline-label-padding))}.outline-end::before,.outline-end::after{border-inline-start-style:none;border-inline-end-style:solid;border-start-start-radius:0;border-start-end-radius:inherit;border-end-start-radius:0;border-end-end-radius:inherit}.outline-notch{align-items:flex-start;border:inherit;display:flex;margin-inline-start:calc(-1*var(--_outline-label-padding));margin-inline-end:var(--_outline-label-padding);max-width:calc(100% - var(--_leading-space) - var(--_trailing-space));padding:0 var(--_outline-label-padding);position:relative}.no-label .outline-notch{display:none}.outline-panel-inactive,.outline-panel-active{border:inherit;border-bottom-style:solid;inset:0;position:absolute}.outline-panel-inactive::before,.outline-panel-inactive::after,.outline-panel-active::before,.outline-panel-active::after{border-top-style:solid;border-bottom:none;bottom:auto;transform:scaleX(1);transition:transform 150ms cubic-bezier(0.2, 0, 0, 1)}.outline-panel-inactive::before,.outline-panel-active::before{right:50%;transform-origin:top left}.outline-panel-inactive::after,.outline-panel-active::after{left:50%;transform-origin:top right}.populated .outline-panel-inactive::before,.populated .outline-panel-inactive::after,.populated .outline-panel-active::before,.populated .outline-panel-active::after,.focused .outline-panel-inactive::before,.focused .outline-panel-inactive::after,.focused .outline-panel-active::before,.focused .outline-panel-active::after{transform:scaleX(0)}.outline-panel-active{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .outline-panel-active{opacity:1}.outline-label{display:flex;max-width:100%;transform:translateY(calc(-100% + var(--_label-text-padding-bottom)))}.outline-start,.field:not(.with-start) .content ::slotted(*){padding-inline-start:max(var(--_leading-space),max(var(--_container-shape-start-start),var(--_container-shape-end-start)) + var(--_outline-label-padding))}.field:not(.with-start) .label-wrapper{margin-inline-start:max(var(--_leading-space),max(var(--_container-shape-start-start),var(--_container-shape-end-start)) + var(--_outline-label-padding))}.field:not(.with-end) .content ::slotted(*){padding-inline-end:max(var(--_trailing-space),max(var(--_container-shape-start-end),var(--_container-shape-end-end)))}.field:not(.with-end) .label-wrapper{margin-inline-end:max(var(--_trailing-space),max(var(--_container-shape-start-end),var(--_container-shape-end-end)))}.outline-start::before,.outline-end::before,.outline-panel-inactive,.outline-panel-inactive::before,.outline-panel-inactive::after{border-width:var(--_outline-width)}:hover .outline{border-color:var(--_hover-outline-color);color:var(--_hover-outline-color)}:hover .outline-start::before,:hover .outline-end::before,:hover .outline-panel-inactive,:hover .outline-panel-inactive::before,:hover .outline-panel-inactive::after{border-width:var(--_hover-outline-width)}.focused .outline{border-color:var(--_focus-outline-color);color:var(--_focus-outline-color)}.outline-start::after,.outline-end::after,.outline-panel-active,.outline-panel-active::before,.outline-panel-active::after{border-width:var(--_focus-outline-width)}.disabled .outline{border-color:var(--_disabled-outline-color);color:var(--_disabled-outline-color)}.disabled .outline-start,.disabled .outline-end,.disabled .outline-panel-inactive{opacity:var(--_disabled-outline-opacity)}.disabled .outline-start::before,.disabled .outline-end::before,.disabled .outline-panel-inactive,.disabled .outline-panel-inactive::before,.disabled .outline-panel-inactive::after{border-width:var(--_disabled-outline-width)}.error .outline{border-color:var(--_error-outline-color);color:var(--_error-outline-color)}.error:hover .outline{border-color:var(--_error-hover-outline-color);color:var(--_error-hover-outline-color)}.error.focused .outline{border-color:var(--_error-focus-outline-color);color:var(--_error-focus-outline-color)}.resizable .container{bottom:var(--_focus-outline-width);inset-inline-end:var(--_focus-outline-width);clip-path:inset(var(--_focus-outline-width) 0 0 var(--_focus-outline-width))}.resizable .container>*{top:var(--_focus-outline-width);inset-inline-start:var(--_focus-outline-width)}.resizable .container:dir(rtl){clip-path:inset(var(--_focus-outline-width) var(--_focus-outline-width) 0 0)}}@layer hcm{@media(forced-colors: active){.disabled .outline{border-color:GrayText;color:GrayText}.disabled :is(.outline-start,.outline-end,.outline-panel-inactive){opacity:1}}}
`;$r.styleSheet;var ei=T`:host{display:inline-flex;resize:both}.field{display:flex;flex:1;flex-direction:column;writing-mode:horizontal-tb;max-width:100%}.container-overflow{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start);display:flex;height:100%;position:relative}.container{align-items:center;border-radius:inherit;display:flex;flex:1;max-height:100%;min-height:100%;min-width:min-content;position:relative}.field,.container-overflow{resize:inherit}.resizable:not(.disabled) .container{resize:inherit;overflow:hidden}.disabled{pointer-events:none}slot[name=container]{border-radius:inherit}slot[name=container]::slotted(*){border-radius:inherit;inset:0;pointer-events:none;position:absolute}@layer styles{.start,.middle,.end{display:flex;box-sizing:border-box;height:100%;position:relative}.start{color:var(--_leading-content-color)}.end{color:var(--_trailing-content-color)}.start,.end{align-items:center;justify-content:center}.with-start .start{margin-inline:var(--_with-leading-content-leading-space) var(--_content-space)}.with-end .end{margin-inline:var(--_content-space) var(--_with-trailing-content-trailing-space)}.middle{align-items:stretch;align-self:baseline;flex:1}.content{color:var(--_content-color);display:flex;flex:1;opacity:0;transition:opacity 83ms cubic-bezier(0.2, 0, 0, 1)}.no-label .content,.focused .content,.populated .content{opacity:1;transition-delay:67ms}:is(.disabled,.disable-transitions) .content{transition:none}.content ::slotted(*){all:unset;color:currentColor;font-family:var(--_content-font);font-size:var(--_content-size);line-height:var(--_content-line-height);font-weight:var(--_content-weight);width:100%;overflow-wrap:revert;white-space:revert}.content ::slotted(:not(textarea)){padding-top:var(--_top-space);padding-bottom:var(--_bottom-space)}.content ::slotted(textarea){margin-top:var(--_top-space);margin-bottom:var(--_bottom-space)}:hover .content{color:var(--_hover-content-color)}:hover .start{color:var(--_hover-leading-content-color)}:hover .end{color:var(--_hover-trailing-content-color)}.focused .content{color:var(--_focus-content-color)}.focused .start{color:var(--_focus-leading-content-color)}.focused .end{color:var(--_focus-trailing-content-color)}.disabled .content{color:var(--_disabled-content-color)}.disabled.no-label .content,.disabled.focused .content,.disabled.populated .content{opacity:var(--_disabled-content-opacity)}.disabled .start{color:var(--_disabled-leading-content-color);opacity:var(--_disabled-leading-content-opacity)}.disabled .end{color:var(--_disabled-trailing-content-color);opacity:var(--_disabled-trailing-content-opacity)}.error .content{color:var(--_error-content-color)}.error .start{color:var(--_error-leading-content-color)}.error .end{color:var(--_error-trailing-content-color)}.error:hover .content{color:var(--_error-hover-content-color)}.error:hover .start{color:var(--_error-hover-leading-content-color)}.error:hover .end{color:var(--_error-hover-trailing-content-color)}.error.focused .content{color:var(--_error-focus-content-color)}.error.focused .start{color:var(--_error-focus-leading-content-color)}.error.focused .end{color:var(--_error-focus-trailing-content-color)}}@layer hcm{@media(forced-colors: active){.disabled :is(.start,.content,.end){color:GrayText;opacity:1}}}@layer styles{.label{box-sizing:border-box;color:var(--_label-text-color);overflow:hidden;max-width:100%;text-overflow:ellipsis;white-space:nowrap;z-index:1;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);width:min-content}.label-wrapper{inset:0;pointer-events:none;position:absolute}.label.resting{position:absolute;top:var(--_top-space)}.label.floating{font-size:var(--_label-text-populated-size);line-height:var(--_label-text-populated-line-height);transform-origin:top left}.label.hidden{opacity:0}.no-label .label{display:none}.label-wrapper{inset:0;position:absolute;text-align:initial}:hover .label{color:var(--_hover-label-text-color)}.focused .label{color:var(--_focus-label-text-color)}.disabled .label{color:var(--_disabled-label-text-color)}.disabled .label:not(.hidden){opacity:var(--_disabled-label-text-opacity)}.error .label{color:var(--_error-label-text-color)}.error:hover .label{color:var(--_error-hover-label-text-color)}.error.focused .label{color:var(--_error-focus-label-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .label:not(.hidden){color:GrayText;opacity:1}}}@layer styles{.supporting-text{color:var(--_supporting-text-color);display:flex;font-family:var(--_supporting-text-font);font-size:var(--_supporting-text-size);line-height:var(--_supporting-text-line-height);font-weight:var(--_supporting-text-weight);gap:16px;justify-content:space-between;padding-inline-start:var(--_supporting-text-leading-space);padding-inline-end:var(--_supporting-text-trailing-space);padding-top:var(--_supporting-text-top-space)}.supporting-text :nth-child(2){flex-shrink:0}:hover .supporting-text{color:var(--_hover-supporting-text-color)}.focus .supporting-text{color:var(--_focus-supporting-text-color)}.disabled .supporting-text{color:var(--_disabled-supporting-text-color);opacity:var(--_disabled-supporting-text-opacity)}.error .supporting-text{color:var(--_error-supporting-text-color)}.error:hover .supporting-text{color:var(--_error-hover-supporting-text-color)}.error.focus .supporting-text{color:var(--_error-focus-supporting-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .supporting-text{color:GrayText;opacity:1}}}
`;ei.styleSheet;var ti=class extends Qr{};ti.styles=[ei,$r],ti=A([w(`md-outlined-field`)],ti);var ni=T`:host{--_caret-color: var(--md-outlined-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_disabled-input-text-color: var(--md-outlined-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-outlined-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-outlined-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-outlined-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-outlined-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-outlined-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-outline-color: var(--md-outlined-text-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-outline-opacity: var(--md-outlined-text-field-disabled-outline-opacity, 0.12);--_disabled-outline-width: var(--md-outlined-text-field-disabled-outline-width, 1px);--_disabled-supporting-text-color: var(--md-outlined-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-outlined-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-outlined-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-outlined-text-field-disabled-trailing-icon-opacity, 0.38);--_error-focus-caret-color: var(--md-outlined-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-outlined-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-outlined-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-outlined-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-outline-color: var(--md-outlined-text-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_error-focus-supporting-text-color: var(--md-outlined-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-outlined-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-input-text-color: var(--md-outlined-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-outlined-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-outlined-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-outline-color: var(--md-outlined-text-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-supporting-text-color: var(--md-outlined-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-outlined-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-outlined-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-outlined-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-outlined-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-outline-color: var(--md-outlined-text-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_error-supporting-text-color: var(--md-outlined-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-outlined-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-input-text-color: var(--md-outlined-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-outlined-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-outlined-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-outline-color: var(--md-outlined-text-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_focus-outline-width: var(--md-outlined-text-field-focus-outline-width, 3px);--_focus-supporting-text-color: var(--md-outlined-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-outlined-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-input-text-color: var(--md-outlined-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-outlined-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-leading-icon-color: var(--md-outlined-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-outline-color: var(--md-outlined-text-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-outline-width: var(--md-outlined-text-field-hover-outline-width, 1px);--_hover-supporting-text-color: var(--md-outlined-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-outlined-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-outlined-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-outlined-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-outlined-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-outlined-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-outlined-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-outlined-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-outlined-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-outlined-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-outlined-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-outlined-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-outlined-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-outlined-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-outlined-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-outlined-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-outlined-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-outlined-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-outlined-text-field-leading-icon-size, 24px);--_outline-color: var(--md-outlined-text-field-outline-color, var(--md-sys-color-outline, #79747e));--_outline-width: var(--md-outlined-text-field-outline-width, 1px);--_supporting-text-color: var(--md-outlined-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-outlined-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-outlined-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-outlined-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-outlined-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-outlined-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-outlined-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-outlined-text-field-container-shape-start-start, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-outlined-text-field-container-shape-start-end, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-outlined-text-field-container-shape-end-end, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-start: var(--md-outlined-text-field-container-shape-end-start, var(--md-outlined-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_icon-input-space: var(--md-outlined-text-field-icon-input-space, 16px);--_leading-space: var(--md-outlined-text-field-leading-space, 16px);--_trailing-space: var(--md-outlined-text-field-trailing-space, 16px);--_top-space: var(--md-outlined-text-field-top-space, 16px);--_bottom-space: var(--md-outlined-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-outlined-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-outlined-text-field-input-text-suffix-leading-space, 2px);--_focus-caret-color: var(--md-outlined-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-outlined-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-outlined-text-field-with-trailing-icon-trailing-space, 12px);--md-outlined-field-bottom-space: var(--_bottom-space);--md-outlined-field-container-shape-end-end: var(--_container-shape-end-end);--md-outlined-field-container-shape-end-start: var(--_container-shape-end-start);--md-outlined-field-container-shape-start-end: var(--_container-shape-start-end);--md-outlined-field-container-shape-start-start: var(--_container-shape-start-start);--md-outlined-field-content-color: var(--_input-text-color);--md-outlined-field-content-font: var(--_input-text-font);--md-outlined-field-content-line-height: var(--_input-text-line-height);--md-outlined-field-content-size: var(--_input-text-size);--md-outlined-field-content-space: var(--_icon-input-space);--md-outlined-field-content-weight: var(--_input-text-weight);--md-outlined-field-disabled-content-color: var(--_disabled-input-text-color);--md-outlined-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-outlined-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-outlined-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-outlined-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-outlined-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-outlined-field-disabled-outline-color: var(--_disabled-outline-color);--md-outlined-field-disabled-outline-opacity: var(--_disabled-outline-opacity);--md-outlined-field-disabled-outline-width: var(--_disabled-outline-width);--md-outlined-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-outlined-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-outlined-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-outlined-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-outlined-field-error-content-color: var(--_error-input-text-color);--md-outlined-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-outlined-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-outlined-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-outlined-field-error-focus-outline-color: var(--_error-focus-outline-color);--md-outlined-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-outlined-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-outlined-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-outlined-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-outlined-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-outlined-field-error-hover-outline-color: var(--_error-hover-outline-color);--md-outlined-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-outlined-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-outlined-field-error-label-text-color: var(--_error-label-text-color);--md-outlined-field-error-leading-content-color: var(--_error-leading-icon-color);--md-outlined-field-error-outline-color: var(--_error-outline-color);--md-outlined-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-outlined-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-outlined-field-focus-content-color: var(--_focus-input-text-color);--md-outlined-field-focus-label-text-color: var(--_focus-label-text-color);--md-outlined-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-outlined-field-focus-outline-color: var(--_focus-outline-color);--md-outlined-field-focus-outline-width: var(--_focus-outline-width);--md-outlined-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-outlined-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-outlined-field-hover-content-color: var(--_hover-input-text-color);--md-outlined-field-hover-label-text-color: var(--_hover-label-text-color);--md-outlined-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-outlined-field-hover-outline-color: var(--_hover-outline-color);--md-outlined-field-hover-outline-width: var(--_hover-outline-width);--md-outlined-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-outlined-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-outlined-field-label-text-color: var(--_label-text-color);--md-outlined-field-label-text-font: var(--_label-text-font);--md-outlined-field-label-text-line-height: var(--_label-text-line-height);--md-outlined-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-outlined-field-label-text-populated-size: var(--_label-text-populated-size);--md-outlined-field-label-text-size: var(--_label-text-size);--md-outlined-field-label-text-weight: var(--_label-text-weight);--md-outlined-field-leading-content-color: var(--_leading-icon-color);--md-outlined-field-leading-space: var(--_leading-space);--md-outlined-field-outline-color: var(--_outline-color);--md-outlined-field-outline-width: var(--_outline-width);--md-outlined-field-supporting-text-color: var(--_supporting-text-color);--md-outlined-field-supporting-text-font: var(--_supporting-text-font);--md-outlined-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-outlined-field-supporting-text-size: var(--_supporting-text-size);--md-outlined-field-supporting-text-weight: var(--_supporting-text-weight);--md-outlined-field-top-space: var(--_top-space);--md-outlined-field-trailing-content-color: var(--_trailing-icon-color);--md-outlined-field-trailing-space: var(--_trailing-space);--md-outlined-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-outlined-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;ni.styleSheet;var ri=e(class extends se{constructor(e){if(super(e),e.type!==l.PROPERTY&&e.type!==l.ATTRIBUTE&&e.type!==l.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!f(e))throw Error("`live` bindings can only contain a single expression")}render(e){return e}update(e,[t]){if(t===re||t===D)return t;let n=e.element,r=e.name;if(e.type===l.PROPERTY){if(t===n[r])return re}else if(e.type===l.BOOLEAN_ATTRIBUTE){if(!!t===n.hasAttribute(r))return re}else if(e.type===l.ATTRIBUTE&&n.getAttribute(r)===t+``)return re;return u(e),t}}),ii={fromAttribute(e){return e??``},toAttribute(e){return e||null}},ai=Symbol(`createValidator`),oi=Symbol(`getValidityAnchor`),si=Symbol(`privateValidator`),G=Symbol(`privateSyncValidity`),ci=Symbol(`privateCustomValidationMessage`);function li(e){var t;class n extends e{constructor(){super(...arguments),this[t]=``}get validity(){return this[G](),this[P].validity}get validationMessage(){return this[G](),this[P].validationMessage}get willValidate(){return this[G](),this[P].willValidate}checkValidity(){return this[G](),this[P].checkValidity()}reportValidity(){return this[G](),this[P].reportValidity()}setCustomValidity(e){this[ci]=e,this[G]()}requestUpdate(e,t,n){super.requestUpdate(e,t,n),this[G]()}firstUpdated(e){super.firstUpdated(e),this[G]()}[(t=ci,G)](){this[si]||(this[si]=this[ai]());let{validity:e,validationMessage:t}=this[si].getValidity(),n=!!this[ci],r=this[ci]||t;this[P].setValidity({...e,customError:n},r,this[oi]()??void 0)}[ai](){throw Error(`Implement [createValidator]`)}[oi](){throw Error(`Implement [getValidityAnchor]`)}}return n}var ui=Symbol(`onReportValidity`),di=Symbol(`privateCleanupFormListeners`),fi=Symbol(`privateDoNotReportInvalid`),pi=Symbol(`privateIsSelfReportingValidity`),mi=Symbol(`privateCallOnReportValidity`);function hi(e){var t,n,r;class i extends e{constructor(...e){super(...e),this[t]=new AbortController,this[n]=!1,this[r]=!1,this.addEventListener(`invalid`,e=>{!this[fi]&&e.isTrusted&&this.addEventListener(`invalid`,()=>{this[mi](e)},{once:!0})},{capture:!0})}checkValidity(){this[fi]=!0;let e=super.checkValidity();return this[fi]=!1,e}reportValidity(){this[pi]=!0;let e=super.reportValidity();return e&&this[mi](null),this[pi]=!1,e}[(t=di,n=fi,r=pi,mi)](e){let t=e?.defaultPrevented;t||(this[ui](e),!t&&e?.defaultPrevented&&(this[pi]||yi(this[P].form,this))&&this.focus())}[ui](e){throw Error(`Implement [onReportValidity]`)}formAssociatedCallback(e){super.formAssociatedCallback&&super.formAssociatedCallback(e),this[di].abort(),e&&(this[di]=new AbortController,gi(this,e,()=>{this[mi](null)},this[di].signal))}}return i}function gi(e,t,n,r){let i=vi(t),a=!1,o,s=!1;i.addEventListener(`before`,()=>{s=!0,o=new AbortController,a=!1,e.addEventListener(`invalid`,()=>{a=!0},{signal:o.signal})},{signal:r}),i.addEventListener(`after`,()=>{s=!1,o?.abort(),!a&&n()},{signal:r}),t.addEventListener(`submit`,()=>{s||n()},{signal:r})}var _i=new WeakMap;function vi(e){if(!_i.has(e)){let t=new EventTarget;_i.set(e,t);for(let n of[`reportValidity`,`requestSubmit`]){let r=e[n];e[n]=function(){t.dispatchEvent(new Event(`before`));let e=Reflect.apply(r,this,arguments);return t.dispatchEvent(new Event(`after`)),e}}}return _i.get(e)}function yi(e,t){if(!e)return!0;let n;for(let t of e.elements)if(t.matches(`:invalid`)){n=t;break}return n===t}var bi=class{constructor(e){this.getCurrentState=e,this.currentValidity={validity:{},validationMessage:``}}getValidity(){let e=this.getCurrentState();if(this.prevState&&this.equals(this.prevState,e))return this.currentValidity;let{validity:t,validationMessage:n}=this.computeValidity(e);return this.prevState=this.copy(e),this.currentValidity={validationMessage:n,validity:{badInput:t.badInput,customError:t.customError,patternMismatch:t.patternMismatch,rangeOverflow:t.rangeOverflow,rangeUnderflow:t.rangeUnderflow,stepMismatch:t.stepMismatch,tooLong:t.tooLong,tooShort:t.tooShort,typeMismatch:t.typeMismatch,valueMissing:t.valueMissing}},this.currentValidity}},xi=class extends bi{computeValidity({state:e,renderedControl:t}){let n=t;Si(e)&&!n?(n=this.inputControl||document.createElement(`input`),this.inputControl=n):n||(n=this.textAreaControl||document.createElement(`textarea`),this.textAreaControl=n);let r=Si(e)?n:null;if(r&&(r.type=e.type),n.value!==e.value&&(n.value=e.value),n.required=e.required,r){let t=e;t.pattern?r.pattern=t.pattern:r.removeAttribute(`pattern`),t.min?r.min=t.min:r.removeAttribute(`min`),t.max?r.max=t.max:r.removeAttribute(`max`),t.step?r.step=t.step:r.removeAttribute(`step`)}return(e.minLength??-1)>-1?n.setAttribute(`minlength`,String(e.minLength)):n.removeAttribute(`minlength`),(e.maxLength??-1)>-1?n.setAttribute(`maxlength`,String(e.maxLength)):n.removeAttribute(`maxlength`),{validity:n.validity,validationMessage:n.validationMessage}}equals({state:e},{state:t}){let n=e.type===t.type&&e.value===t.value&&e.required===t.required&&e.minLength===t.minLength&&e.maxLength===t.maxLength;return!Si(e)||!Si(t)?n:n&&e.pattern===t.pattern&&e.min===t.min&&e.max===t.max&&e.step===t.step}copy({state:e}){return{state:Si(e)?this.copyInput(e):this.copyTextArea(e),renderedControl:null}}copyInput(e){let{type:t,pattern:n,min:r,max:i,step:a}=e;return{...this.copySharedState(e),type:t,pattern:n,min:r,max:i,step:a}}copyTextArea(e){return{...this.copySharedState(e),type:e.type}}copySharedState({value:e,required:t,minLength:n,maxLength:r}){return{value:e,required:t,minLength:n,maxLength:r}}};function Si(e){return e.type!==`textarea`}var Ci=C(hi(li(mt(dt(y))))),K=class extends Ci{constructor(){super(...arguments),this.error=!1,this.errorText=``,this.label=``,this.noAsterisk=!1,this.required=!1,this.value=``,this.prefixText=``,this.suffixText=``,this.hasLeadingIcon=!1,this.hasTrailingIcon=!1,this.supportingText=``,this.textDirection=``,this.rows=2,this.cols=20,this.inputMode=``,this.max=``,this.maxLength=-1,this.min=``,this.minLength=-1,this.noSpinner=!1,this.pattern=``,this.placeholder=``,this.readOnly=!1,this.multiple=!1,this.step=``,this.type=`text`,this.autocomplete=``,this.dirty=!1,this.focused=!1,this.nativeError=!1,this.nativeErrorText=``}get selectionDirection(){return this.getInputOrTextarea().selectionDirection}set selectionDirection(e){this.getInputOrTextarea().selectionDirection=e}get selectionEnd(){return this.getInputOrTextarea().selectionEnd}set selectionEnd(e){this.getInputOrTextarea().selectionEnd=e}get selectionStart(){return this.getInputOrTextarea().selectionStart}set selectionStart(e){this.getInputOrTextarea().selectionStart=e}get valueAsNumber(){let e=this.getInput();return e?e.valueAsNumber:NaN}set valueAsNumber(e){let t=this.getInput();t&&(t.valueAsNumber=e,this.value=t.value)}get valueAsDate(){let e=this.getInput();return e?e.valueAsDate:null}set valueAsDate(e){let t=this.getInput();t&&(t.valueAsDate=e,this.value=t.value)}get hasError(){return this.error||this.nativeError}select(){this.getInputOrTextarea().select()}setRangeText(...e){this.getInputOrTextarea().setRangeText(...e),this.value=this.getInputOrTextarea().value}setSelectionRange(e,t,n){this.getInputOrTextarea().setSelectionRange(e,t,n)}showPicker(){let e=this.getInput();e&&e.showPicker()}stepDown(e){let t=this.getInput();t&&(t.stepDown(e),this.value=t.value)}stepUp(e){let t=this.getInput();t&&(t.stepUp(e),this.value=t.value)}reset(){this.dirty=!1,this.value=this.getAttribute(`value`)??``,this.nativeError=!1,this.nativeErrorText=``}attributeChangedCallback(e,t,n){e===`value`&&this.dirty||super.attributeChangedCallback(e,t,n)}render(){let e={disabled:this.disabled,error:!this.disabled&&this.hasError,textarea:this.type===`textarea`,"no-spinner":this.noSpinner};return k`
      <span class="text-field ${v(e)}">
        ${this.renderField()}
      </span>
    `}updated(e){let t=this.getInputOrTextarea().value;this.value!==t&&(this.value=t)}renderField(){return Pt`<${this.fieldTag}
      class="field"
      count=${this.value.length}
      ?disabled=${this.disabled}
      ?error=${this.hasError}
      error-text=${this.getErrorText()}
      ?focused=${this.focused}
      ?has-end=${this.hasTrailingIcon}
      ?has-start=${this.hasLeadingIcon}
      label=${this.label}
      ?no-asterisk=${this.noAsterisk}
      max=${this.maxLength}
      ?populated=${!!this.value}
      ?required=${this.required}
      ?resizable=${this.type===`textarea`}
      supporting-text=${this.supportingText}
    >
      ${this.renderLeadingIcon()}
      ${this.renderInputOrTextarea()}
      ${this.renderTrailingIcon()}
      <div id="description" slot="aria-describedby"></div>
      <slot name="container" slot="container"></slot>
    </${this.fieldTag}>`}renderLeadingIcon(){return k`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `}renderTrailingIcon(){return k`
      <span class="icon trailing" slot="end">
        <slot name="trailing-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `}renderInputOrTextarea(){let e={direction:this.textDirection},t=this.ariaLabel||this.label||D,n=this.autocomplete,r=(this.maxLength??-1)>-1,i=(this.minLength??-1)>-1;if(this.type===`textarea`)return k`
        <textarea
          class="input"
          style=${b(e)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${t}
          autocomplete=${n||D}
          name=${this.name||D}
          ?disabled=${this.disabled}
          maxlength=${r?this.maxLength:D}
          minlength=${i?this.minLength:D}
          placeholder=${this.placeholder||D}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          rows=${this.rows}
          cols=${this.cols}
          .value=${ri(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent}></textarea>
      `;let a=this.renderPrefix(),o=this.renderSuffix(),s=this.inputMode;return k`
      <div class="input-wrapper">
        ${a}
        <input
          class="input"
          style=${b(e)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${t}
          autocomplete=${n||D}
          name=${this.name||D}
          ?disabled=${this.disabled}
          inputmode=${s||D}
          max=${this.max||D}
          maxlength=${r?this.maxLength:D}
          min=${this.min||D}
          minlength=${i?this.minLength:D}
          pattern=${this.pattern||D}
          placeholder=${this.placeholder||D}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          ?multiple=${this.multiple}
          step=${this.step||D}
          type=${this.type}
          .value=${ri(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent} />
        ${o}
      </div>
    `}renderPrefix(){return this.renderAffix(this.prefixText,!1)}renderSuffix(){return this.renderAffix(this.suffixText,!0)}renderAffix(e,t){return e?k`<span class="${v({suffix:t,prefix:!t})}">${e}</span>`:D}getErrorText(){return this.error?this.errorText:this.nativeErrorText}handleFocusChange(){this.focused=this.inputOrTextarea?.matches(`:focus`)??!1}handleInput(e){this.dirty=!0,this.value=e.target.value}redispatchEvent(e){Br(this,e)}getInputOrTextarea(){return this.inputOrTextarea||(this.connectedCallback(),this.scheduleUpdate()),this.isUpdatePending&&this.scheduleUpdate(),this.inputOrTextarea}getInput(){return this.type===`textarea`?null:this.getInputOrTextarea()}handleIconChange(){this.hasLeadingIcon=this.leadingIcons.length>0,this.hasTrailingIcon=this.trailingIcons.length>0}[ft](){return this.value}formResetCallback(){this.reset()}formStateRestoreCallback(e){this.value=e}focus(){this.getInputOrTextarea().focus()}[ai](){return new xi(()=>({state:this,renderedControl:this.inputOrTextarea}))}[oi](){return this.inputOrTextarea}[ui](e){e?.preventDefault();let t=this.getErrorText();this.nativeError=!!e,this.nativeErrorText=this.validationMessage,t===this.getErrorText()&&this.field?.reannounceError()}};K.shadowRootOptions={...y.shadowRootOptions,delegatesFocus:!0},A([O({type:Boolean,reflect:!0})],K.prototype,`error`,void 0),A([O({attribute:`error-text`})],K.prototype,`errorText`,void 0),A([O()],K.prototype,`label`,void 0),A([O({type:Boolean,attribute:`no-asterisk`})],K.prototype,`noAsterisk`,void 0),A([O({type:Boolean,reflect:!0})],K.prototype,`required`,void 0),A([O()],K.prototype,`value`,void 0),A([O({attribute:`prefix-text`})],K.prototype,`prefixText`,void 0),A([O({attribute:`suffix-text`})],K.prototype,`suffixText`,void 0),A([O({type:Boolean,attribute:`has-leading-icon`})],K.prototype,`hasLeadingIcon`,void 0),A([O({type:Boolean,attribute:`has-trailing-icon`})],K.prototype,`hasTrailingIcon`,void 0),A([O({attribute:`supporting-text`})],K.prototype,`supportingText`,void 0),A([O({attribute:`text-direction`})],K.prototype,`textDirection`,void 0),A([O({type:Number})],K.prototype,`rows`,void 0),A([O({type:Number})],K.prototype,`cols`,void 0),A([O({reflect:!0})],K.prototype,`inputMode`,void 0),A([O()],K.prototype,`max`,void 0),A([O({type:Number})],K.prototype,`maxLength`,void 0),A([O()],K.prototype,`min`,void 0),A([O({type:Number})],K.prototype,`minLength`,void 0),A([O({type:Boolean,attribute:`no-spinner`})],K.prototype,`noSpinner`,void 0),A([O()],K.prototype,`pattern`,void 0),A([O({reflect:!0,converter:ii})],K.prototype,`placeholder`,void 0),A([O({type:Boolean,reflect:!0})],K.prototype,`readOnly`,void 0),A([O({type:Boolean,reflect:!0})],K.prototype,`multiple`,void 0),A([O()],K.prototype,`step`,void 0),A([O({reflect:!0})],K.prototype,`type`,void 0),A([O({reflect:!0})],K.prototype,`autocomplete`,void 0),A([S()],K.prototype,`dirty`,void 0),A([S()],K.prototype,`focused`,void 0),A([S()],K.prototype,`nativeError`,void 0),A([S()],K.prototype,`nativeErrorText`,void 0),A([j(`.input`)],K.prototype,`inputOrTextarea`,void 0),A([j(`.field`)],K.prototype,`field`,void 0),A([M({slot:`leading-icon`})],K.prototype,`leadingIcons`,void 0),A([M({slot:`trailing-icon`})],K.prototype,`trailingIcons`,void 0);var wi=class extends K{constructor(){super(...arguments),this.fieldTag=Mt`md-outlined-field`}},Ti=T`:host{display:inline-flex;outline:none;resize:both;text-align:start;-webkit-tap-highlight-color:rgba(0,0,0,0)}.text-field,.field{width:100%}.text-field{display:inline-flex}.field{cursor:text}.disabled .field{cursor:default}.text-field,.textarea .field{resize:inherit}slot[name=container]{border-radius:inherit}.icon{color:currentColor;display:flex;align-items:center;justify-content:center;fill:currentColor;position:relative}.icon ::slotted(*){display:flex;position:absolute}[has-start] .icon.leading{font-size:var(--_leading-icon-size);height:var(--_leading-icon-size);width:var(--_leading-icon-size)}[has-end] .icon.trailing{font-size:var(--_trailing-icon-size);height:var(--_trailing-icon-size);width:var(--_trailing-icon-size)}.input-wrapper{display:flex}.input-wrapper>*{all:inherit;padding:0}.input{caret-color:var(--_caret-color);overflow-x:hidden;text-align:inherit}.input::placeholder{color:currentColor;opacity:1}.input::-webkit-calendar-picker-indicator{display:none}.input::-webkit-search-decoration,.input::-webkit-search-cancel-button{display:none}@media(forced-colors: active){.input{background:none}}.no-spinner .input::-webkit-inner-spin-button,.no-spinner .input::-webkit-outer-spin-button{display:none}.no-spinner .input[type=number]{-moz-appearance:textfield}:focus-within .input{caret-color:var(--_focus-caret-color)}.error:focus-within .input{caret-color:var(--_error-focus-caret-color)}.text-field:not(.disabled) .prefix{color:var(--_input-text-prefix-color)}.text-field:not(.disabled) .suffix{color:var(--_input-text-suffix-color)}.text-field:not(.disabled) .input::placeholder{color:var(--_input-text-placeholder-color)}.prefix,.suffix{text-wrap:nowrap;width:min-content}.prefix{padding-inline-end:var(--_input-text-prefix-trailing-space)}.suffix{padding-inline-start:var(--_input-text-suffix-leading-space)}
`;Ti.styleSheet;var Ei=class extends wi{constructor(){super(...arguments),this.fieldTag=Mt`md-outlined-field`}};Ei.styles=[Ti,ni],Ei=A([w(`md-outlined-text-field`)],Ei);var Di=class extends i{constructor(...e){super(...e),this.value=``,this.inputRef=d()}static get styles(){return T`
            /* 40px controls: an outlined text field is 56px by default, and the button
               stretched along with it. */
            :host {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                --md-outlined-text-field-top-space: 0.5rem;
                --md-outlined-text-field-bottom-space: 0.5rem;
                --md-outlined-button-container-height: 2.5rem;
            }

            md-outlined-text-field {
                flex-grow: 1;
            }

            md-outlined-icon-button {
                display: none;
                flex-shrink: 0;
            }

            /* In a narrow input panel the button gives the room of its label to the placeholder. */
            @container papyros-input (width < 25rem) {
                md-outlined-button {
                    display: none;
                }

                md-outlined-icon-button {
                    display: inline-flex;
                }
            }
        `}provideInput(){this.papyros.io.provideInput(this.value),this.value=``}updated(e){super.updated(e),this.papyros.io.awaitingInput&&this.inputRef.value.focus()}render(){return k`
            <md-outlined-text-field
                type="text"
                .value=${this.value}
                @input=${e=>this.value=e.target.value}
                @keydown=${e=>{e.key===`Enter`&&!e.isComposing&&e.keyCode!==229&&(e.preventDefault(),this.provideInput())}}
                placeholder=${this.papyros.io.prompt||this.t(`Papyros.input_placeholder.interactive`)}
                aria-label=${this.papyros.io.prompt||this.t(`Papyros.input_placeholder.interactive`)}
                ?disabled=${!this.papyros.io.awaitingInput}
                ${E(this.inputRef)}
            ></md-outlined-text-field>
            <md-outlined-button @click=${()=>this.provideInput()} ?disabled=${!this.papyros.io.awaitingInput}>
                <span slot="icon">${this.papyros.constants.icons.enter}</span>
                ${this.t(`Papyros.enter`)}
            </md-outlined-button>
            <md-outlined-icon-button
                aria-label=${this.t(`Papyros.enter`)}
                title=${this.t(`Papyros.enter`)}
                @click=${()=>this.provideInput()}
                ?disabled=${!this.papyros.io.awaitingInput}
            >
                ${this.papyros.constants.icons.enter}
            </md-outlined-icon-button>
        `}};g([O({state:!0})],Di.prototype,`value`,void 0),Di=g([w(`p-interactive-input`)],Di);var Oi=[a.interactive,a.batch],ki=class extends i{constructor(...e){super(...e),this.heightTransition=new Te(this),this.renderedMode=void 0}static get styles(){return T`
            :host {
                width: 100%;
                display: flex;
                flex-direction: column;
                min-height: 0;
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: 0.625rem;
                background-color: var(--md-sys-color-surface);
                overflow: hidden;
                box-sizing: border-box;
                container: papyros-input / inline-size;
                --md-outlined-text-field-outline-color: var(--md-sys-color-outline-variant);
                --md-outlined-button-outline-color: var(--md-sys-color-outline-variant);
            }

            ${me}
            ${le}
            ${Se}

            .content {
                display: flex;
                flex-direction: column;
                /* Shrinkable, so a tight column takes height from the input box before
                   it takes it from the output above. */
                flex: 0 1 auto;
                min-height: 0;
                padding: 0.75rem 0.875rem;
            }

            .content.interactive {
                padding: 0.5rem 0.625rem;
            }

            p-batch-input {
                flex: 0 1 12.5rem;
                min-height: 4rem;
            }
        `}get mode(){return this.papyros.io.inputMode}willUpdate(e){super.willUpdate(e),this.renderedMode!==void 0&&this.renderedMode!==this.mode&&this.heightTransition.capture(),this.renderedMode=this.mode}updated(e){super.updated(e),this.heightTransition.play()}disconnectedCallback(){super.disconnectedCallback(),this.heightTransition.cancel()}selectMode(e){this.papyros.io.inputMode=e}handleTabsKeydown(e){let t=ce(e.key,Oi.indexOf(this.mode),Oi.length);if(t===void 0)return;e.preventDefault();let n=Oi[t];this.selectMode(n),this.updateComplete.then(()=>{this.renderRoot.querySelector(`#tab-${n}`)?.focus()})}renderTab(e){return k`
            <button
                id="tab-${e}"
                role="tab"
                aria-selected=${this.mode===e}
                aria-controls="input-panel"
                tabindex=${this.mode===e?0:-1}
                class=${this.mode===e?`active`:``}
                @click=${()=>this.selectMode(e)}
            >
                ${this.t(`Papyros.input_modes.${e}`)}
            </button>
        `}render(){return k`
            <div class="tab-bar">
                <span class="pane-label">${this.t(`Papyros.input`)}</span>
                <!-- A tablist may only contain tabs, so the pane label sits outside it. -->
                <div
                    class="tablist"
                    role="tablist"
                    aria-label=${this.t(`Papyros.input_tabs`)}
                    @keydown=${this.handleTabsKeydown}
                >
                    ${Oi.map(e=>this.renderTab(e))}
                </div>
            </div>
            <div class="content ${this.mode}" id="input-panel" role="tabpanel" aria-labelledby="tab-${this.mode}">
                ${this.mode===a.batch?k`<p-batch-input .papyros=${this.papyros}></p-batch-input>`:k`<p-interactive-input .papyros=${this.papyros}></p-interactive-input>`}
            </div>
        `}};ki=g([w(`p-input`)],ki);function Ai(e,t=q){let n=Ni(e,t);return n&&(n.tabIndex=0,n.focus()),n}function ji(e,t=q){let n=Pi(e,t);return n&&(n.tabIndex=0,n.focus()),n}function Mi(e,t=q){for(let n=0;n<e.length;n++){let r=e[n];if(r.tabIndex===0&&t(r))return{item:r,index:n}}return null}function Ni(e,t=q){for(let n of e)if(t(n))return n;return null}function Pi(e,t=q){for(let n=e.length-1;n>=0;n--){let r=e[n];if(t(r))return r}return null}function Fi(e,t,n=q,r=!0){for(let i=1;i<e.length;i++){let a=(i+t)%e.length;if(a<t&&!r)return null;let o=e[a];if(n(o))return o}return e[t]?e[t]:null}function Ii(e,t,n=q,r=!0){for(let i=1;i<e.length;i++){let a=(t-i+e.length)%e.length;if(a>t&&!r)return null;let o=e[a];if(n(o))return o}return e[t]?e[t]:null}function Li(e,t,n=q,r=!0){if(t){let i=Fi(e,t.index,n,r);return i&&(i.tabIndex=0,i.focus()),i}return Ai(e,n)}function Ri(e,t,n=q,r=!0){if(t){let i=Ii(e,t.index,n,r);return i&&(i.tabIndex=0,i.focus()),i}return ji(e,n)}function q(e){return!e.disabled}var J={ArrowDown:`ArrowDown`,ArrowLeft:`ArrowLeft`,ArrowUp:`ArrowUp`,ArrowRight:`ArrowRight`,Home:`Home`,End:`End`},zi=class{constructor(e){this.handleKeydown=e=>{let t=e.key;if(e.defaultPrevented||!this.isNavigableKey(t))return;let n=this.items;if(!n.length)return;let r=Mi(n,this.isActivatable);e.preventDefault();let i=this.isRtl(),a=i?J.ArrowRight:J.ArrowLeft,o=i?J.ArrowLeft:J.ArrowRight,s=null;switch(t){case J.ArrowDown:case o:s=Li(n,r,this.isActivatable,this.wrapNavigation());break;case J.ArrowUp:case a:s=Ri(n,r,this.isActivatable,this.wrapNavigation());break;case J.Home:s=Ai(n,this.isActivatable);break;case J.End:s=ji(n,this.isActivatable)}s&&r&&r.item!==s&&(r.item.tabIndex=-1)},this.onDeactivateItems=()=>{let e=this.items;for(let t of e)this.deactivateItem(t)},this.onRequestActivation=e=>{this.onDeactivateItems();let t=e.target;this.activateItem(t),t.focus()},this.onSlotchange=()=>{let e=this.items,t=!1;for(let n of e)!n.disabled&&n.tabIndex>-1&&!t?(t=!0,n.tabIndex=0):n.tabIndex=-1;if(t)return;let n=Ni(e,this.isActivatable);n&&(n.tabIndex=0)};let{isItem:t,getPossibleItems:n,isRtl:r,deactivateItem:i,activateItem:a,isNavigableKey:o,isActivatable:s,wrapNavigation:c}=e;this.isItem=t,this.getPossibleItems=n,this.isRtl=r,this.deactivateItem=i,this.activateItem=a,this.isNavigableKey=o,this.isActivatable=s,this.wrapNavigation=c??(()=>!0)}get items(){let e=this.getPossibleItems(),t=[];for(let n of e){if(this.isItem(n)){t.push(n);continue}let e=n.item;e&&this.isItem(e)&&t.push(e)}return t}activateNextItem(){let e=this.items,t=Mi(e,this.isActivatable);return t&&(t.item.tabIndex=-1),Li(e,t,this.isActivatable,this.wrapNavigation())}activatePreviousItem(){let e=this.items,t=Mi(e,this.isActivatable);return t&&(t.item.tabIndex=-1),Ri(e,t,this.isActivatable,this.wrapNavigation())}};function Bi(e,t){return new CustomEvent(`close-menu`,{bubbles:!0,composed:!0,detail:{initiator:e,reason:t,itemPath:[e]}})}var Vi=Bi,Hi={SPACE:`Space`,ENTER:`Enter`},Ui={CLICK_SELECTION:`click-selection`,KEYDOWN:`keydown`},Wi={ESCAPE:`Escape`,SPACE:Hi.SPACE,ENTER:Hi.ENTER};function Gi(e){return Object.values(Wi).some(t=>t===e)}function Ki(e){return Object.values(Hi).some(t=>t===e)}function qi(e,t){let n=new Event(`md-contains`,{bubbles:!0,composed:!0}),r=[],i=e=>{r=e.composedPath()};return t.addEventListener(`md-contains`,i),e.dispatchEvent(n),t.removeEventListener(`md-contains`,i),r.length>0}var Y={NONE:`none`,LIST_ROOT:`list-root`,FIRST_ITEM:`first-item`,LAST_ITEM:`last-item`},Ji={END_START:`end-start`,END_END:`end-end`,START_START:`start-start`,START_END:`start-end`},Yi=class{constructor(e,t){this.host=e,this.getProperties=t,this.surfaceStylesInternal={display:`none`},this.lastValues={isOpen:!1},this.host.addController(this)}get surfaceStyles(){return this.surfaceStylesInternal}async position(){let{surfaceEl:e,anchorEl:t,anchorCorner:n,surfaceCorner:r,positioning:i,xOffset:a,yOffset:o,disableBlockFlip:s,disableInlineFlip:c,repositionStrategy:l}=this.getProperties(),u=n.toLowerCase().trim(),d=r.toLowerCase().trim();if(!e||!t)return;let f=window.innerWidth,p=window.innerHeight,m=document.createElement(`div`);m.style.opacity=`0`,m.style.position=`fixed`,m.style.display=`block`,m.style.inset=`0`,document.body.appendChild(m);let h=m.getBoundingClientRect();m.remove();let ee=window.innerHeight-h.bottom,te=window.innerWidth-h.right;this.surfaceStylesInternal={display:`block`,opacity:`0`},this.host.requestUpdate(),await this.host.updateComplete,e.popover&&e.isConnected&&e.showPopover();let g=e.getSurfacePositionClientRect?e.getSurfacePositionClientRect():e.getBoundingClientRect(),_=t.getSurfacePositionClientRect?t.getSurfacePositionClientRect():t.getBoundingClientRect(),[v,y]=d.split(`-`),[ne,b]=u.split(`-`),re=getComputedStyle(e).direction===`ltr`,{blockInset:ie,blockOutOfBoundsCorrection:x,surfaceBlockProperty:ae}=this.calculateBlock({surfaceRect:g,anchorRect:_,anchorBlock:ne,surfaceBlock:v,yOffset:o,positioning:i,windowInnerHeight:p,blockScrollbarHeight:ee});if(x&&!s){let e=v===`start`?`end`:`start`,t=ne===`start`?`end`:`start`,n=this.calculateBlock({surfaceRect:g,anchorRect:_,anchorBlock:t,surfaceBlock:e,yOffset:o,positioning:i,windowInnerHeight:p,blockScrollbarHeight:ee});x>n.blockOutOfBoundsCorrection&&(ie=n.blockInset,x=n.blockOutOfBoundsCorrection,ae=n.surfaceBlockProperty)}let{inlineInset:S,inlineOutOfBoundsCorrection:C,surfaceInlineProperty:w}=this.calculateInline({surfaceRect:g,anchorRect:_,anchorInline:b,surfaceInline:y,xOffset:a,positioning:i,isLTR:re,windowInnerWidth:f,inlineScrollbarWidth:te});if(C&&!c){let e=y===`start`?`end`:`start`,t=b===`start`?`end`:`start`,n=this.calculateInline({surfaceRect:g,anchorRect:_,anchorInline:t,surfaceInline:e,xOffset:a,positioning:i,isLTR:re,windowInnerWidth:f,inlineScrollbarWidth:te});Math.abs(C)>Math.abs(n.inlineOutOfBoundsCorrection)&&(S=n.inlineInset,C=n.inlineOutOfBoundsCorrection,w=n.surfaceInlineProperty)}l===`move`&&(ie-=x,S-=C),this.surfaceStylesInternal={display:`block`,opacity:`1`,[ae]:`${ie}px`,[w]:`${S}px`},l===`resize`&&(x&&(this.surfaceStylesInternal.height=`${g.height-x}px`),C&&(this.surfaceStylesInternal.width=`${g.width-C}px`)),this.host.requestUpdate()}calculateBlock(e){let{surfaceRect:t,anchorRect:n,anchorBlock:r,surfaceBlock:i,yOffset:a,positioning:o,windowInnerHeight:s,blockScrollbarHeight:c}=e,l=+(o===`fixed`||o===`document`),u=+(o===`document`),d=+(i===`start`),f=+(i===`end`),p=(r===i?0:1)*n.height+a,m=d*n.top+f*(s-n.bottom-c),h=d*window.scrollY-f*window.scrollY,ee=Math.abs(Math.min(0,s-m-p-t.height));return{blockInset:l*m+u*h+p,blockOutOfBoundsCorrection:ee,surfaceBlockProperty:i===`start`?`inset-block-start`:`inset-block-end`}}calculateInline(e){let{isLTR:t,surfaceInline:n,anchorInline:r,anchorRect:i,surfaceRect:a,xOffset:o,positioning:s,windowInnerWidth:c,inlineScrollbarWidth:l}=e,u=+(s===`fixed`||s===`document`),d=+(s===`document`),f=+!!t,p=+!t,m=+(n===`start`),h=+(n===`end`),ee=(r===n?0:1)*i.width+o,te=m*i.left+h*(c-i.right-l),g=m*(c-i.right-l)+h*i.left,_=f*te+p*g,v=m*window.scrollX-h*window.scrollX,y=h*window.scrollX-m*window.scrollX,ne=f*v+p*y,b=Math.abs(Math.min(0,c-_-ee-a.width)),re=u*_+ee+d*ne,ie=n===`start`?`inset-inline-start`:`inset-inline-end`;return(s===`document`||s===`fixed`)&&(ie=n===`start`&&t||n===`end`&&!t?`left`:`right`),{inlineInset:re,inlineOutOfBoundsCorrection:b,surfaceInlineProperty:ie}}hostUpdate(){this.onUpdate()}hostUpdated(){this.onUpdate()}async onUpdate(){let e=this.getProperties(),t=!1;for(let[n,r]of Object.entries(e))if(t||=r!==this.lastValues[n],t)break;let n=this.lastValues.isOpen!==e.isOpen,r=!!e.anchorEl,i=!!e.surfaceEl;t&&r&&i&&(this.lastValues.isOpen=e.isOpen,e.isOpen?(this.lastValues=e,await this.position(),e.onOpen()):n&&(await e.beforeClose(),this.close(),e.onClose()))}close(){this.surfaceStylesInternal={display:`none`},this.host.requestUpdate();let e=this.getProperties().surfaceEl;e?.popover&&e?.isConnected&&e.hidePopover()}},X={INDEX:0,ITEM:1,TEXT:2},Xi=class{constructor(e){this.getProperties=e,this.typeaheadRecords=[],this.typaheadBuffer=``,this.cancelTypeaheadTimeout=0,this.isTypingAhead=!1,this.lastActiveRecord=null,this.onKeydown=e=>{this.isTypingAhead?this.typeahead(e):this.beginTypeahead(e)},this.endTypeahead=()=>{this.isTypingAhead=!1,this.typaheadBuffer=``,this.typeaheadRecords=[]}}get items(){return this.getProperties().getItems()}get active(){return this.getProperties().active}beginTypeahead(e){this.active&&(e.code===`Space`||e.code===`Enter`||e.code.startsWith(`Arrow`)||e.code===`Escape`||(this.isTypingAhead=!0,this.typeaheadRecords=this.items.map((e,t)=>[t,e,e.typeaheadText.trim().toLowerCase()]),this.lastActiveRecord=this.typeaheadRecords.find(e=>e[X.ITEM].tabIndex===0)??null,this.lastActiveRecord&&(this.lastActiveRecord[X.ITEM].tabIndex=-1),this.typeahead(e)))}typeahead(e){if(e.defaultPrevented)return;if(clearTimeout(this.cancelTypeaheadTimeout),e.code===`Enter`||e.code.startsWith(`Arrow`)||e.code===`Escape`){this.endTypeahead(),this.lastActiveRecord&&(this.lastActiveRecord[X.ITEM].tabIndex=-1);return}e.code===`Space`&&e.preventDefault(),this.cancelTypeaheadTimeout=setTimeout(this.endTypeahead,this.getProperties().typeaheadBufferTime),this.typaheadBuffer+=e.key.toLowerCase();let t=this.lastActiveRecord?this.lastActiveRecord[X.INDEX]:-1,n=this.typeaheadRecords.length,r=e=>(e[X.INDEX]+n-t)%n,i=this.typeaheadRecords.filter(e=>!e[X.ITEM].disabled&&e[X.TEXT].startsWith(this.typaheadBuffer)).sort((e,t)=>r(e)-r(t));if(i.length===0){clearTimeout(this.cancelTypeaheadTimeout),this.lastActiveRecord&&(this.lastActiveRecord[X.ITEM].tabIndex=-1),this.endTypeahead();return}let a=this.typaheadBuffer.length===1,o;o=this.lastActiveRecord===i[0]&&a?i[1]??i[0]:i[0],this.lastActiveRecord&&(this.lastActiveRecord[X.ITEM].tabIndex=-1),this.lastActiveRecord=o,o[X.ITEM].tabIndex=0,o[X.ITEM].focus()}},Zi=new Set([J.ArrowDown,J.ArrowUp,J.Home,J.End]),Qi=new Set([J.ArrowLeft,J.ArrowRight,...Zi]);function $i(e=document){let t=e.activeElement;for(;t&&t?.shadowRoot?.activeElement;)t=t.shadowRoot.activeElement;return t}var Z=class extends y{get openDirection(){return this.menuCorner.split(`-`)[0]===`start`?`DOWN`:`UP`}get anchorElement(){return this.anchor?this.getRootNode().querySelector(`#${this.anchor}`):this.currentAnchorElement}set anchorElement(e){this.currentAnchorElement=e,this.requestUpdate(`anchorElement`)}constructor(){super(),this.anchor=``,this.positioning=`absolute`,this.quick=!1,this.hasOverflow=!1,this.open=!1,this.xOffset=0,this.yOffset=0,this.noHorizontalFlip=!1,this.noVerticalFlip=!1,this.typeaheadDelay=200,this.anchorCorner=Ji.END_START,this.menuCorner=Ji.START_START,this.stayOpenOnOutsideClick=!1,this.stayOpenOnFocusout=!1,this.skipRestoreFocus=!1,this.defaultFocus=Y.FIRST_ITEM,this.noNavigationWrap=!1,this.typeaheadActive=!0,this.isSubmenu=!1,this.pointerPath=[],this.isRepositioning=!1,this.openCloseAnimationSignal=We(),this.listController=new zi({isItem:e=>e.hasAttribute(`md-menu-item`),getPossibleItems:()=>this.slotItems,isRtl:()=>getComputedStyle(this).direction===`rtl`,deactivateItem:e=>{e.selected=!1,e.tabIndex=-1},activateItem:e=>{e.selected=!0,e.tabIndex=0},isNavigableKey:e=>this.isSubmenu?e===(getComputedStyle(this).direction===`rtl`?J.ArrowLeft:J.ArrowRight)||Zi.has(e):Qi.has(e),wrapNavigation:()=>!this.noNavigationWrap}),this.lastFocusedElement=null,this.typeaheadController=new Xi(()=>({getItems:()=>this.items,typeaheadBufferTime:this.typeaheadDelay,active:this.typeaheadActive})),this.currentAnchorElement=null,this.internals=this.attachInternals(),this.menuPositionController=new Yi(this,()=>({anchorCorner:this.anchorCorner,surfaceCorner:this.menuCorner,surfaceEl:this.surfaceEl,anchorEl:this.anchorElement,positioning:this.positioning===`popover`?`document`:this.positioning,isOpen:this.open,xOffset:this.xOffset,yOffset:this.yOffset,disableBlockFlip:this.noVerticalFlip,disableInlineFlip:this.noHorizontalFlip,onOpen:this.onOpened,beforeClose:this.beforeClose,onClose:this.onClosed,repositionStrategy:this.hasOverflow&&this.positioning!==`popover`?`move`:`resize`})),this.onWindowResize=()=>{this.isRepositioning||this.positioning!==`document`&&this.positioning!==`fixed`&&this.positioning!==`popover`||(this.isRepositioning=!0,this.reposition(),this.isRepositioning=!1)},this.handleFocusout=async e=>{let t=this.anchorElement;if(this.stayOpenOnFocusout||!this.open||this.pointerPath.includes(t))return;if(e.relatedTarget){if(qi(e.relatedTarget,this)||this.pointerPath.length!==0&&qi(e.relatedTarget,t))return}else if(this.pointerPath.includes(this))return;let n=this.skipRestoreFocus;this.skipRestoreFocus=!0,this.close(),await this.updateComplete,this.skipRestoreFocus=n},this.onOpened=async()=>{this.lastFocusedElement=$i();let e=this.items,t=Mi(e);t&&this.defaultFocus!==Y.NONE&&(t.item.tabIndex=-1);let n=!this.quick;switch(this.quick?this.dispatchEvent(new Event(`opening`)):n=!!await this.animateOpen(),this.defaultFocus){case Y.FIRST_ITEM:let t=Ni(e);t&&(t.tabIndex=0,t.focus(),await t.updateComplete);break;case Y.LAST_ITEM:let n=Pi(e);n&&(n.tabIndex=0,n.focus(),await n.updateComplete);break;case Y.LIST_ROOT:this.focus();break;default:case Y.NONE:}n||this.dispatchEvent(new Event(`opened`))},this.beforeClose=async()=>{this.open=!1,this.skipRestoreFocus||this.lastFocusedElement?.focus?.(),this.quick||await this.animateClose()},this.onClosed=()=>{this.quick&&(this.dispatchEvent(new Event(`closing`)),this.dispatchEvent(new Event(`closed`)))},this.onWindowPointerdown=e=>{this.pointerPath=e.composedPath()},this.onDocumentClick=e=>{if(!this.open)return;let t=e.composedPath();this.stayOpenOnOutsideClick||t.includes(this)||t.includes(this.anchorElement)||(this.open=!1)},this.internals.role=`menu`,this.addEventListener(`keydown`,this.handleKeydown),this.addEventListener(`keydown`,this.captureKeydown,{capture:!0}),this.addEventListener(`focusout`,this.handleFocusout)}get items(){return this.listController.items}willUpdate(e){e.has(`open`)&&(this.open?this.removeAttribute(`aria-hidden`):this.setAttribute(`aria-hidden`,`true`))}update(e){e.has(`open`)&&(this.open?this.setUpGlobalEventListeners():this.cleanUpGlobalEventListeners()),e.has(`positioning`)&&this.positioning===`popover`&&!this.showPopover&&(this.positioning=`fixed`),super.update(e)}connectedCallback(){super.connectedCallback(),this.open&&this.setUpGlobalEventListeners()}disconnectedCallback(){super.disconnectedCallback(),this.cleanUpGlobalEventListeners()}getBoundingClientRect(){return this.surfaceEl?this.surfaceEl.getBoundingClientRect():super.getBoundingClientRect()}getClientRects(){return this.surfaceEl?this.surfaceEl.getClientRects():super.getClientRects()}render(){return this.renderSurface()}renderSurface(){return k`
      <div
        class="menu ${v(this.getSurfaceClasses())}"
        style=${b(this.menuPositionController.surfaceStyles)}
        popover=${this.positioning===`popover`?`manual`:D}>
        ${this.renderElevation()}
        <div class="items">
          <div class="item-padding"> ${this.renderMenuItems()} </div>
        </div>
      </div>
    `}renderMenuItems(){return k`<slot
      @close-menu=${this.onCloseMenu}
      @deactivate-items=${this.onDeactivateItems}
      @request-activation=${this.onRequestActivation}
      @deactivate-typeahead=${this.handleDeactivateTypeahead}
      @activate-typeahead=${this.handleActivateTypeahead}
      @stay-open-on-focusout=${this.handleStayOpenOnFocusout}
      @close-on-focusout=${this.handleCloseOnFocusout}
      @slotchange=${this.listController.onSlotchange}></slot>`}renderElevation(){return k`<md-elevation part="elevation"></md-elevation>`}getSurfaceClasses(){return{open:this.open,fixed:this.positioning===`fixed`,"has-overflow":this.hasOverflow}}captureKeydown(e){e.target===this&&!e.defaultPrevented&&Gi(e.code)&&(e.preventDefault(),this.close()),this.typeaheadController.onKeydown(e)}async animateOpen(){let e=this.surfaceEl,t=this.slotEl;if(!e||!t)return!0;let n=this.openDirection;this.dispatchEvent(new Event(`opening`)),e.classList.toggle(`animating`,!0);let r=this.openCloseAnimationSignal.start(),i=e.offsetHeight,a=n===`UP`,o=this.items,s=250/o.length,c=e.animate([{height:`0px`},{height:`${i}px`}],{duration:500,easing:Ue.EMPHASIZED}),l=t.animate([{transform:a?`translateY(-${i}px)`:``},{transform:``}],{duration:500,easing:Ue.EMPHASIZED}),u=e.animate([{opacity:0},{opacity:1}],50),d=[];for(let e=0;e<o.length;e++){let t=o[a?o.length-1-e:e],n=t.animate([{opacity:0},{opacity:1}],{duration:250,delay:s*e});t.classList.toggle(`md-menu-hidden`,!0),n.addEventListener(`finish`,()=>{t.classList.toggle(`md-menu-hidden`,!1)}),d.push([t,n])}let f=e=>{},p=new Promise(e=>{f=e});return r.addEventListener(`abort`,()=>{c.cancel(),l.cancel(),u.cancel(),d.forEach(([e,t])=>{e.classList.toggle(`md-menu-hidden`,!1),t.cancel()}),f(!0)}),c.addEventListener(`finish`,()=>{e.classList.toggle(`animating`,!1),this.openCloseAnimationSignal.finish(),f(!1)}),await p}animateClose(){let e,t=new Promise(t=>{e=t}),n=this.surfaceEl,r=this.slotEl;if(!n||!r)return e(!1),t;let i=this.openDirection===`UP`;this.dispatchEvent(new Event(`closing`)),n.classList.toggle(`animating`,!0);let a=this.openCloseAnimationSignal.start(),o=n.offsetHeight,s=this.items,c=50/s.length,l=n.animate([{height:`${o}px`},{height:`${o*.35}px`}],{duration:150,easing:Ue.EMPHASIZED_ACCELERATE}),u=r.animate([{transform:``},{transform:i?`translateY(-${o*.65}px)`:``}],{duration:150,easing:Ue.EMPHASIZED_ACCELERATE}),d=n.animate([{opacity:1},{opacity:0}],{duration:50,delay:100}),f=[];for(let e=0;e<s.length;e++){let t=s[i?e:s.length-1-e],n=t.animate([{opacity:1},{opacity:0}],{duration:50,delay:50+c*e});n.addEventListener(`finish`,()=>{t.classList.toggle(`md-menu-hidden`,!0)}),f.push([t,n])}return a.addEventListener(`abort`,()=>{l.cancel(),u.cancel(),d.cancel(),f.forEach(([e,t])=>{t.cancel(),e.classList.toggle(`md-menu-hidden`,!1)}),e(!1)}),l.addEventListener(`finish`,()=>{n.classList.toggle(`animating`,!1),f.forEach(([e])=>{e.classList.toggle(`md-menu-hidden`,!1)}),this.openCloseAnimationSignal.finish(),this.dispatchEvent(new Event(`closed`)),e(!0)}),t}handleKeydown(e){this.pointerPath=[],this.listController.handleKeydown(e)}setUpGlobalEventListeners(){document.addEventListener(`click`,this.onDocumentClick,{capture:!0}),window.addEventListener(`pointerdown`,this.onWindowPointerdown),document.addEventListener(`resize`,this.onWindowResize,{passive:!0}),window.addEventListener(`resize`,this.onWindowResize,{passive:!0})}cleanUpGlobalEventListeners(){document.removeEventListener(`click`,this.onDocumentClick,{capture:!0}),window.removeEventListener(`pointerdown`,this.onWindowPointerdown),document.removeEventListener(`resize`,this.onWindowResize),window.removeEventListener(`resize`,this.onWindowResize)}onCloseMenu(){this.close()}onDeactivateItems(e){e.stopPropagation(),this.listController.onDeactivateItems()}onRequestActivation(e){e.stopPropagation(),this.listController.onRequestActivation(e)}handleDeactivateTypeahead(e){e.stopPropagation(),this.typeaheadActive=!1}handleActivateTypeahead(e){e.stopPropagation(),this.typeaheadActive=!0}handleStayOpenOnFocusout(e){e.stopPropagation(),this.stayOpenOnFocusout=!0}handleCloseOnFocusout(e){e.stopPropagation(),this.stayOpenOnFocusout=!1}close(){this.open=!1,this.slotItems.forEach(e=>{e.close?.()})}show(){this.open=!0}activateNextItem(){return this.listController.activateNextItem()??null}activatePreviousItem(){return this.listController.activatePreviousItem()??null}reposition(){this.open&&this.menuPositionController.position()}};A([j(`.menu`)],Z.prototype,`surfaceEl`,void 0),A([j(`slot`)],Z.prototype,`slotEl`,void 0),A([O()],Z.prototype,`anchor`,void 0),A([O()],Z.prototype,`positioning`,void 0),A([O({type:Boolean})],Z.prototype,`quick`,void 0),A([O({type:Boolean,attribute:`has-overflow`})],Z.prototype,`hasOverflow`,void 0),A([O({type:Boolean,reflect:!0})],Z.prototype,`open`,void 0),A([O({type:Number,attribute:`x-offset`})],Z.prototype,`xOffset`,void 0),A([O({type:Number,attribute:`y-offset`})],Z.prototype,`yOffset`,void 0),A([O({type:Boolean,attribute:`no-horizontal-flip`})],Z.prototype,`noHorizontalFlip`,void 0),A([O({type:Boolean,attribute:`no-vertical-flip`})],Z.prototype,`noVerticalFlip`,void 0),A([O({type:Number,attribute:`typeahead-delay`})],Z.prototype,`typeaheadDelay`,void 0),A([O({attribute:`anchor-corner`})],Z.prototype,`anchorCorner`,void 0),A([O({attribute:`menu-corner`})],Z.prototype,`menuCorner`,void 0),A([O({type:Boolean,attribute:`stay-open-on-outside-click`})],Z.prototype,`stayOpenOnOutsideClick`,void 0),A([O({type:Boolean,attribute:`stay-open-on-focusout`})],Z.prototype,`stayOpenOnFocusout`,void 0),A([O({type:Boolean,attribute:`skip-restore-focus`})],Z.prototype,`skipRestoreFocus`,void 0),A([O({attribute:`default-focus`})],Z.prototype,`defaultFocus`,void 0),A([O({type:Boolean,attribute:`no-navigation-wrap`})],Z.prototype,`noNavigationWrap`,void 0),A([M({flatten:!0})],Z.prototype,`slotItems`,void 0),A([S()],Z.prototype,`typeaheadActive`,void 0);var ea=T`:host{--md-elevation-level: var(--md-menu-container-elevation, 2);--md-elevation-shadow-color: var(--md-menu-container-shadow-color, var(--md-sys-color-shadow, #000));min-width:112px;color:unset;display:contents}md-focus-ring{--md-focus-ring-shape: var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px))}.menu{border-radius:var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px));display:none;inset:auto;border:none;padding:0px;overflow:visible;background-color:rgba(0,0,0,0);color:inherit;opacity:0;z-index:20;position:absolute;user-select:none;max-height:inherit;height:inherit;min-width:inherit;max-width:inherit;scrollbar-width:inherit}.menu::backdrop{display:none}.fixed{position:fixed}.items{display:block;list-style-type:none;margin:0;outline:none;box-sizing:border-box;background-color:var(--md-menu-container-color, var(--md-sys-color-surface-container, #f3edf7));height:inherit;max-height:inherit;overflow:auto;min-width:inherit;max-width:inherit;border-radius:inherit;scrollbar-width:inherit}.item-padding{padding-block:var(--md-menu-top-space, 8px) var(--md-menu-bottom-space, 8px)}.has-overflow:not([popover]) .items{overflow:visible}.has-overflow.animating .items,.animating .items{overflow:hidden}.has-overflow.animating .items{pointer-events:none}.animating ::slotted(.md-menu-hidden){opacity:0}slot{display:block;height:inherit;max-height:inherit}::slotted(:is(md-divider,[role=separator])){margin:8px 0}@media(forced-colors: active){.menu{border-style:solid;border-color:CanvasText;border-width:1px}}
`;ea.styleSheet;var ta=class extends Z{};ta.styles=[ea],ta=A([w(`md-menu`)],ta);var na=class extends bi{computeValidity(e){return this.selectControl||=document.createElement(`select`),ye(k`<option value=${e.value}></option>`,this.selectControl),this.selectControl.value=e.value,this.selectControl.required=e.required,{validity:this.selectControl.validity,validationMessage:this.selectControl.validationMessage}}equals(e,t){return e.value===t.value&&e.required===t.required}copy({value:e,required:t}){return{value:e,required:t}}};function ra(e){let t=[];for(let n=0;n<e.length;n++){let r=e[n];r.selected&&t.push([r,n])}return t}var ia,aa=Symbol(`value`),oa=C(hi(li(mt(dt(y))))),Q=class extends oa{get value(){return this[aa]}set value(e){this.lastUserSetValue=e,this.select(e)}get options(){return this.menu?.items??[]}get selectedIndex(){let[e,t]=(this.getSelectedOptions()??[])[0]??[];return t??-1}set selectedIndex(e){this.lastUserSetSelectedIndex=e,this.selectIndex(e)}get selectedOptions(){return(this.getSelectedOptions()??[]).map(([e])=>e)}get hasError(){return this.error||this.nativeError}constructor(){super(),this.quick=!1,this.required=!1,this.errorText=``,this.label=``,this.noAsterisk=!1,this.supportingText=``,this.error=!1,this.menuPositioning=`popover`,this.clampMenuWidth=!1,this.typeaheadDelay=200,this.hasLeadingIcon=!1,this.displayText=``,this.menuAlign=`start`,this[ia]=``,this.lastUserSetValue=null,this.lastUserSetSelectedIndex=null,this.lastSelectedOption=null,this.lastSelectedOptionRecords=[],this.nativeError=!1,this.nativeErrorText=``,this.focused=!1,this.open=!1,this.defaultFocus=Y.NONE,this.prevOpen=this.open,this.selectWidth=0,this.addEventListener(`focus`,this.handleFocus.bind(this)),this.addEventListener(`blur`,this.handleBlur.bind(this))}select(e){let t=this.options.find(t=>t.value===e);t&&this.selectItem(t)}selectIndex(e){let t=this.options[e];t&&this.selectItem(t)}reset(){for(let e of this.options)e.selected=e.hasAttribute(`selected`);this.updateValueAndDisplayText(),this.nativeError=!1,this.nativeErrorText=``}showPicker(){this.open=!0}[(ia=aa,ui)](e){e?.preventDefault();let t=this.getErrorText();this.nativeError=!!e,this.nativeErrorText=this.validationMessage,t===this.getErrorText()&&this.field?.reannounceError()}update(e){if(this.hasUpdated||this.initUserSelection(),this.prevOpen!==this.open&&this.open){let e=this.getBoundingClientRect();this.selectWidth=e.width}this.prevOpen=this.open,super.update(e)}render(){return k`
      <span
        class="select ${v(this.getRenderClasses())}"
        @focusout=${this.handleFocusout}>
        ${this.renderField()} ${this.renderMenu()}
      </span>
    `}async firstUpdated(e){await this.menu?.updateComplete,this.lastSelectedOptionRecords.length||this.initUserSelection(),!this.lastSelectedOptionRecords.length&&!this.options.length&&setTimeout(()=>{this.updateValueAndDisplayText()}),super.firstUpdated(e)}getRenderClasses(){return{disabled:this.disabled,error:this.error,open:this.open}}renderField(){let e=this.ariaLabel||this.label;return Pt`
      <${this.fieldTag}
          aria-haspopup="listbox"
          role="combobox"
          part="field"
          id="field"
          tabindex=${this.disabled?`-1`:`0`}
          aria-label=${e||D}
          aria-describedby="description"
          aria-expanded=${this.open?`true`:`false`}
          aria-controls="listbox"
          class="field"
          label=${this.label}
          ?no-asterisk=${this.noAsterisk}
          .focused=${this.focused||this.open}
          .populated=${!!this.displayText}
          .disabled=${this.disabled}
          .required=${this.required}
          .error=${this.hasError}
          ?has-start=${this.hasLeadingIcon}
          has-end
          supporting-text=${this.supportingText}
          error-text=${this.getErrorText()}
          @keydown=${this.handleKeydown}
          @click=${this.handleClick}>
         ${this.renderFieldContent()}
         <div id="description" slot="aria-describedby"></div>
      </${this.fieldTag}>`}renderFieldContent(){return[this.renderLeadingIcon(),this.renderLabel(),this.renderTrailingIcon()]}renderLeadingIcon(){return k`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `}renderTrailingIcon(){return k`
      <span class="icon trailing" slot="end">
        <slot name="trailing-icon" @slotchange=${this.handleIconChange}>
          <svg height="5" viewBox="7 10 10 5" focusable="false">
            <polygon
              class="down"
              stroke="none"
              fill-rule="evenodd"
              points="7 10 12 15 17 10"></polygon>
            <polygon
              class="up"
              stroke="none"
              fill-rule="evenodd"
              points="7 15 12 10 17 15"></polygon>
          </svg>
        </slot>
      </span>
    `}renderLabel(){return k`<div id="label">${this.displayText||k`&nbsp;`}</div>`}renderMenu(){let e=this.label||this.ariaLabel;return k`<div class="menu-wrapper">
      <md-menu
        id="listbox"
        .defaultFocus=${this.defaultFocus}
        role="listbox"
        tabindex="-1"
        aria-label=${e||D}
        stay-open-on-focusout
        part="menu"
        exportparts="focus-ring: menu-focus-ring"
        anchor="field"
        style=${b({"--__menu-min-width":`${this.selectWidth}px`,"--__menu-max-width":this.clampMenuWidth?`${this.selectWidth}px`:void 0})}
        no-navigation-wrap
        .open=${this.open}
        .quick=${this.quick}
        .positioning=${this.menuPositioning}
        .typeaheadDelay=${this.typeaheadDelay}
        .anchorCorner=${this.menuAlign===`start`?`end-start`:`end-end`}
        .menuCorner=${this.menuAlign===`start`?`start-start`:`start-end`}
        @opening=${this.handleOpening}
        @opened=${this.redispatchEvent}
        @closing=${this.redispatchEvent}
        @closed=${this.handleClosed}
        @close-menu=${this.handleCloseMenu}
        @request-selection=${this.handleRequestSelection}
        @request-deselection=${this.handleRequestDeselection}>
        ${this.renderMenuContent()}
      </md-menu>
    </div>`}renderMenuContent(){return k`<slot></slot>`}handleKeydown(e){if(this.open||this.disabled||!this.menu)return;let t=this.menu.typeaheadController,n=e.code===`Space`||e.code===`ArrowDown`||e.code===`ArrowUp`||e.code===`End`||e.code===`Home`||e.code===`Enter`;if(!t.isTypingAhead&&n)switch(e.preventDefault(),this.open=!0,e.code){case`Space`:case`ArrowDown`:case`Enter`:this.defaultFocus=Y.NONE;break;case`End`:this.defaultFocus=Y.LAST_ITEM;break;case`ArrowUp`:case`Home`:this.defaultFocus=Y.FIRST_ITEM}else if(e.key.length===1){t.onKeydown(e),e.preventDefault();let{lastActiveRecord:n}=t;if(!n)return;this.labelEl?.setAttribute?.(`aria-live`,`polite`),this.selectItem(n[X.ITEM])&&this.dispatchInteractionEvents()}}handleClick(){this.open=!this.open}handleFocus(){this.focused=!0}handleBlur(){this.focused=!1}handleFocusout(e){e.relatedTarget&&qi(e.relatedTarget,this)||(this.open=!1)}getSelectedOptions(){if(!this.menu)return this.lastSelectedOptionRecords=[],null;let e=this.menu.items;return this.lastSelectedOptionRecords=ra(e),this.lastSelectedOptionRecords}async getUpdateComplete(){return await this.menu?.updateComplete,super.getUpdateComplete()}updateValueAndDisplayText(){let e=this.getSelectedOptions()??[],t=!1;if(e.length){let[n]=e[0];t=this.lastSelectedOption!==n,this.lastSelectedOption=n,this[aa]=n.value,this.displayText=n.displayText}else t=this.lastSelectedOption!==null,this.lastSelectedOption=null,this[aa]=``,this.displayText=``;return t}async handleOpening(e){if(this.labelEl?.removeAttribute?.(`aria-live`),this.redispatchEvent(e),this.defaultFocus!==Y.NONE)return;let t=this.menu.items,n=Mi(t)?.item,[r]=this.lastSelectedOptionRecords[0]??[null];n&&n!==r&&(n.tabIndex=-1),r??=t[0],r&&(r.tabIndex=0,r.focus())}redispatchEvent(e){Br(this,e)}handleClosed(e){this.open=!1,this.redispatchEvent(e)}handleCloseMenu(e){let t=e.detail.reason,n=e.detail.itemPath[0];this.open=!1;let r=!1;t.kind===`click-selection`||t.kind===`keydown`&&Ki(t.key)?r=this.selectItem(n):(n.tabIndex=-1,n.blur()),r&&this.dispatchInteractionEvents()}selectItem(e){return(this.getSelectedOptions()??[]).forEach(([t])=>{e!==t&&(t.selected=!1,t.tabIndex=-1)}),e.selected=!0,e.tabIndex=0,this.updateValueAndDisplayText()}handleRequestSelection(e){let t=e.target;this.lastSelectedOptionRecords.some(([e])=>e===t)||this.selectItem(t)}handleRequestDeselection(e){let t=e.target;this.lastSelectedOptionRecords.some(([e])=>e===t)&&this.updateValueAndDisplayText()}initUserSelection(){this.lastUserSetValue&&!this.lastSelectedOptionRecords.length?this.select(this.lastUserSetValue):this.lastUserSetSelectedIndex!==null&&!this.lastSelectedOptionRecords.length?this.selectIndex(this.lastUserSetSelectedIndex):this.updateValueAndDisplayText()}handleIconChange(){this.hasLeadingIcon=this.leadingIcons.length>0}dispatchInteractionEvents(){this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0}))}getErrorText(){return this.error?this.errorText:this.nativeErrorText}[ft](){return this.value}formResetCallback(){this.reset()}formStateRestoreCallback(e){this.value=e}click(){this.field?.click()}[ai](){return new na(()=>this)}[oi](){return this.field}};Q.shadowRootOptions={...y.shadowRootOptions,delegatesFocus:!0},A([O({type:Boolean})],Q.prototype,`quick`,void 0),A([O({type:Boolean})],Q.prototype,`required`,void 0),A([O({type:String,attribute:`error-text`})],Q.prototype,`errorText`,void 0),A([O()],Q.prototype,`label`,void 0),A([O({type:Boolean,attribute:`no-asterisk`})],Q.prototype,`noAsterisk`,void 0),A([O({type:String,attribute:`supporting-text`})],Q.prototype,`supportingText`,void 0),A([O({type:Boolean,reflect:!0})],Q.prototype,`error`,void 0),A([O({attribute:`menu-positioning`})],Q.prototype,`menuPositioning`,void 0),A([O({type:Boolean,attribute:`clamp-menu-width`})],Q.prototype,`clampMenuWidth`,void 0),A([O({type:Number,attribute:`typeahead-delay`})],Q.prototype,`typeaheadDelay`,void 0),A([O({type:Boolean,attribute:`has-leading-icon`})],Q.prototype,`hasLeadingIcon`,void 0),A([O({attribute:`display-text`})],Q.prototype,`displayText`,void 0),A([O({attribute:`menu-align`})],Q.prototype,`menuAlign`,void 0),A([O()],Q.prototype,`value`,null),A([O({type:Number,attribute:`selected-index`})],Q.prototype,`selectedIndex`,null),A([S()],Q.prototype,`nativeError`,void 0),A([S()],Q.prototype,`nativeErrorText`,void 0),A([S()],Q.prototype,`focused`,void 0),A([S()],Q.prototype,`open`,void 0),A([S()],Q.prototype,`defaultFocus`,void 0),A([j(`.field`)],Q.prototype,`field`,void 0),A([j(`md-menu`)],Q.prototype,`menu`,void 0),A([j(`#label`)],Q.prototype,`labelEl`,void 0),A([M({slot:`leading-icon`,flatten:!0})],Q.prototype,`leadingIcons`,void 0);var sa=class extends Q{constructor(){super(...arguments),this.fieldTag=Mt`md-outlined-field`}},ca=T`:host{--_text-field-disabled-input-text-color: var(--md-outlined-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-outlined-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-outlined-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-outlined-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-outlined-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-outlined-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-outline-color: var(--md-outlined-select-text-field-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-outline-opacity: var(--md-outlined-select-text-field-disabled-outline-opacity, 0.12);--_text-field-disabled-outline-width: var(--md-outlined-select-text-field-disabled-outline-width, 1px);--_text-field-disabled-supporting-text-color: var(--md-outlined-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-outlined-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-outlined-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-outlined-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-focus-input-text-color: var(--md-outlined-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-outlined-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-outlined-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-outline-color: var(--md-outlined-select-text-field-error-focus-outline-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-supporting-text-color: var(--md-outlined-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-outlined-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-input-text-color: var(--md-outlined-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-outlined-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-outlined-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-outline-color: var(--md-outlined-select-text-field-error-hover-outline-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-supporting-text-color: var(--md-outlined-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-outlined-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-outlined-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-outlined-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-outlined-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-outline-color: var(--md-outlined-select-text-field-error-outline-color, var(--md-sys-color-error, #b3261e));--_text-field-error-supporting-text-color: var(--md-outlined-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-outlined-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-input-text-color: var(--md-outlined-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-outlined-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-outlined-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-outline-color: var(--md-outlined-select-text-field-focus-outline-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-outline-width: var(--md-outlined-select-text-field-focus-outline-width, 3px);--_text-field-focus-supporting-text-color: var(--md-outlined-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-outlined-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-input-text-color: var(--md-outlined-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-outlined-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-outlined-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-outline-color: var(--md-outlined-select-text-field-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-outline-width: var(--md-outlined-select-text-field-hover-outline-width, 1px);--_text-field-hover-supporting-text-color: var(--md-outlined-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-outlined-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-outlined-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-outlined-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-outlined-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-outlined-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-outlined-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-outlined-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-outlined-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-outlined-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-outlined-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-outlined-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-outlined-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-outlined-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-outlined-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-outlined-select-text-field-leading-icon-size, 24px);--_text-field-outline-color: var(--md-outlined-select-text-field-outline-color, var(--md-sys-color-outline, #79747e));--_text-field-outline-width: var(--md-outlined-select-text-field-outline-width, 1px);--_text-field-supporting-text-color: var(--md-outlined-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-outlined-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-outlined-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-outlined-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-outlined-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-outlined-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-outlined-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-outlined-select-text-field-container-shape-start-start, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-outlined-select-text-field-container-shape-start-end, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-outlined-select-text-field-container-shape-end-end, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-start: var(--md-outlined-select-text-field-container-shape-end-start, var(--md-outlined-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--md-outlined-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-outlined-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-outlined-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-outlined-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-outlined-field-content-color: var(--_text-field-input-text-color);--md-outlined-field-content-font: var(--_text-field-input-text-font);--md-outlined-field-content-line-height: var(--_text-field-input-text-line-height);--md-outlined-field-content-size: var(--_text-field-input-text-size);--md-outlined-field-content-weight: var(--_text-field-input-text-weight);--md-outlined-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-outlined-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-outlined-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-outlined-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-outlined-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-outlined-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-outlined-field-disabled-outline-color: var(--_text-field-disabled-outline-color);--md-outlined-field-disabled-outline-opacity: var(--_text-field-disabled-outline-opacity);--md-outlined-field-disabled-outline-width: var(--_text-field-disabled-outline-width);--md-outlined-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-outlined-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-outlined-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-outlined-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-outlined-field-error-content-color: var(--_text-field-error-input-text-color);--md-outlined-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-outlined-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-outlined-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-outlined-field-error-focus-outline-color: var(--_text-field-error-focus-outline-color);--md-outlined-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-outlined-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-outlined-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-outlined-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-outlined-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-outlined-field-error-hover-outline-color: var(--_text-field-error-hover-outline-color);--md-outlined-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-outlined-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-outlined-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-outlined-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-outlined-field-error-outline-color: var(--_text-field-error-outline-color);--md-outlined-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-outlined-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-outlined-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-outlined-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-outlined-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-outlined-field-focus-outline-color: var(--_text-field-focus-outline-color);--md-outlined-field-focus-outline-width: var(--_text-field-focus-outline-width);--md-outlined-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-outlined-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-outlined-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-outlined-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-outlined-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-outlined-field-hover-outline-color: var(--_text-field-hover-outline-color);--md-outlined-field-hover-outline-width: var(--_text-field-hover-outline-width);--md-outlined-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-outlined-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-outlined-field-label-text-color: var(--_text-field-label-text-color);--md-outlined-field-label-text-font: var(--_text-field-label-text-font);--md-outlined-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-outlined-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-outlined-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-outlined-field-label-text-size: var(--_text-field-label-text-size);--md-outlined-field-label-text-weight: var(--_text-field-label-text-weight);--md-outlined-field-leading-content-color: var(--_text-field-leading-icon-color);--md-outlined-field-outline-color: var(--_text-field-outline-color);--md-outlined-field-outline-width: var(--_text-field-outline-width);--md-outlined-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-outlined-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-outlined-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-outlined-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-outlined-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-outlined-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`;ca.styleSheet;var la=T`:host{color:unset;min-width:210px;display:flex}.field{cursor:default;outline:none}.select{position:relative;flex-direction:column}.icon.trailing svg,.icon ::slotted(*){fill:currentColor}.icon ::slotted(*){width:inherit;height:inherit;font-size:inherit}.icon slot{display:flex;height:100%;width:100%;align-items:center;justify-content:center}.icon.trailing :is(.up,.down){opacity:0;transition:opacity 75ms linear 75ms}.select:not(.open) .down,.select.open .up{opacity:1}.field,.select,md-menu{min-width:inherit;width:inherit;max-width:inherit;display:flex}md-menu{min-width:var(--__menu-min-width);max-width:var(--__menu-max-width, inherit)}.menu-wrapper{width:0px;height:0px;max-width:inherit}md-menu ::slotted(:not[disabled]){cursor:pointer}.field,.select{width:100%}:host{display:inline-flex}:host([disabled]){pointer-events:none}
`;la.styleSheet;var ua=class extends sa{};ua.styles=[la,ca],ua=A([w(`md-outlined-select`)],ua);var da=T`:host{display:flex;gap:16px;--md-ripple-hover-color: var(--md-menu-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-menu-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-menu-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-menu-item-pressed-state-layer-opacity, 0.12)}:host([disabled]){opacity:var(--md-menu-item-disabled-opacity, 0.3);pointer-events:none}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;gap:inherit;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.list-item:not(.disabled){cursor:pointer}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;color:var(--md-menu-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-menu-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-menu-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-menu-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-menu-item-one-line-container-height, 56px);padding-top:var(--md-menu-item-top-space, 12px);padding-bottom:var(--md-menu-item-bottom-space, 12px);padding-inline-start:var(--md-menu-item-leading-space, 16px);padding-inline-end:var(--md-menu-item-trailing-space, 16px);gap:inherit}md-item[multiline]{min-height:var(--md-menu-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-menu-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-menu-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-menu-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-menu-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-menu-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-menu-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-menu-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-menu-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}.list-item{background-color:var(--md-menu-item-container-color, transparent)}.list-item.selected{background-color:var(--md-menu-item-selected-container-color, var(--md-sys-color-secondary-container, #e8def8))}.selected:not(.disabled) ::slotted(*){color:var(--md-menu-item-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b))}@media(forced-colors: active){:host([disabled]),:host([disabled]) slot{color:GrayText;opacity:1}.list-item{position:relative}.list-item.selected::before{content:"";position:absolute;inset:0;box-sizing:border-box;border-radius:inherit;pointer-events:none;border:3px double CanvasText}}
`;da.styleSheet;var fa=class extends y{constructor(){super(...arguments),this.multiline=!1}render(){return k`
      <slot name="container"></slot>
      <slot class="non-text" name="start"></slot>
      <div class="text">
        <slot name="overline" @slotchange=${this.handleTextSlotChange}></slot>
        <slot
          class="default-slot"
          @slotchange=${this.handleTextSlotChange}></slot>
        <slot name="headline" @slotchange=${this.handleTextSlotChange}></slot>
        <slot
          name="supporting-text"
          @slotchange=${this.handleTextSlotChange}></slot>
      </div>
      <slot class="non-text" name="trailing-supporting-text"></slot>
      <slot class="non-text" name="end"></slot>
    `}handleTextSlotChange(){let e=!1,t=0;for(let n of this.textSlots)if(pa(n)&&(t+=1),t>1){e=!0;break}this.multiline=e}};A([O({type:Boolean,reflect:!0})],fa.prototype,`multiline`,void 0),A([Oe(`.text slot`)],fa.prototype,`textSlots`,void 0);function pa(e){for(let t of e.assignedNodes({flatten:!0})){let e=t.nodeType===Node.ELEMENT_NODE,n=t.nodeType===Node.TEXT_NODE&&t.textContent?.match(/\S/);if(e||n)return!0}return!1}var ma=T`:host{color:var(--md-sys-color-on-surface, #1d1b20);font-family:var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-large-size, 1rem);font-weight:var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-large-line-height, 1.5rem);align-items:center;box-sizing:border-box;display:flex;gap:16px;min-height:56px;overflow:hidden;padding:12px 16px;position:relative;text-overflow:ellipsis}:host([multiline]){min-height:72px}[name=overline]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-medium-size, 0.875rem);font-weight:var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-medium-line-height, 1.25rem)}[name=trailing-supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=container]::slotted(*){inset:0;position:absolute}.default-slot{display:inline}.default-slot,.text ::slotted(*){overflow:hidden;text-overflow:ellipsis}.text{display:flex;flex:1;flex-direction:column;overflow:hidden}
`;ma.styleSheet;var ha=class extends fa{};ha.styles=[ma],ha=A([w(`md-item`)],ha);var ga=class{constructor(e,t){this.host=e,this.internalTypeaheadText=null,this.onClick=()=>{this.host.keepOpen||this.host.dispatchEvent(Vi(this.host,{kind:Ui.CLICK_SELECTION}))},this.onKeydown=e=>{if(this.host.href&&e.code===`Enter`){let e=this.getInteractiveElement();e instanceof HTMLAnchorElement&&e.click()}if(e.defaultPrevented)return;let t=e.code;this.host.keepOpen&&t!==`Escape`||Gi(t)&&(e.preventDefault(),this.host.dispatchEvent(Vi(this.host,{kind:Ui.KEYDOWN,key:t})))},this.getHeadlineElements=t.getHeadlineElements,this.getSupportingTextElements=t.getSupportingTextElements,this.getDefaultElements=t.getDefaultElements,this.getInteractiveElement=t.getInteractiveElement,this.host.addController(this)}get typeaheadText(){if(this.internalTypeaheadText!==null)return this.internalTypeaheadText;let e=this.getHeadlineElements(),t=[];return e.forEach(e=>{e.textContent&&e.textContent.trim()&&t.push(e.textContent.trim())}),t.length===0&&this.getDefaultElements().forEach(e=>{e.textContent&&e.textContent.trim()&&t.push(e.textContent.trim())}),t.length===0&&this.getSupportingTextElements().forEach(e=>{e.textContent&&e.textContent.trim()&&t.push(e.textContent.trim())}),t.join(` `)}get tagName(){switch(this.host.type){case`link`:return`a`;case`button`:return`button`;default:case`menuitem`:case`option`:return`li`}}get role(){return this.host.type===`option`?`option`:`menuitem`}hostConnected(){this.host.toggleAttribute(`md-menu-item`,!0)}hostUpdate(){this.host.href&&(this.host.type=`link`)}setTypeaheadText(e){this.internalTypeaheadText=e}};function _a(){return new Event(`request-selection`,{bubbles:!0,composed:!0})}function va(){return new Event(`request-deselection`,{bubbles:!0,composed:!0})}var ya=class{get role(){return this.menuItemController.role}get typeaheadText(){return this.menuItemController.typeaheadText}setTypeaheadText(e){this.menuItemController.setTypeaheadText(e)}get displayText(){return this.internalDisplayText===null?this.menuItemController.typeaheadText:this.internalDisplayText}setDisplayText(e){this.internalDisplayText=e}constructor(e,t){this.host=e,this.internalDisplayText=null,this.firstUpdate=!0,this.onClick=()=>{this.menuItemController.onClick()},this.onKeydown=e=>{this.menuItemController.onKeydown(e)},this.lastSelected=this.host.selected,this.menuItemController=new ga(e,t),e.addController(this)}hostUpdate(){this.lastSelected!==this.host.selected&&(this.host.ariaSelected=this.host.selected?`true`:`false`)}hostUpdated(){this.lastSelected!==this.host.selected&&!this.firstUpdate&&(this.host.selected?this.host.dispatchEvent(_a()):this.host.dispatchEvent(va())),this.lastSelected=this.host.selected,this.firstUpdate=!1}},ba=C(y),$=class extends ba{constructor(){super(...arguments),this.disabled=!1,this.isMenuItem=!0,this.selected=!1,this.value=``,this.type=`option`,this.selectOptionController=new ya(this,{getHeadlineElements:()=>this.headlineElements,getSupportingTextElements:()=>this.supportingTextElements,getDefaultElements:()=>this.defaultElements,getInteractiveElement:()=>this.listItemRoot})}get typeaheadText(){return this.selectOptionController.typeaheadText}set typeaheadText(e){this.selectOptionController.setTypeaheadText(e)}get displayText(){return this.selectOptionController.displayText}set displayText(e){this.selectOptionController.setDisplayText(e)}render(){return this.renderListItem(k`
      <md-item>
        <div slot="container">
          ${this.renderRipple()} ${this.renderFocusRing()}
        </div>
        <slot name="start" slot="start"></slot>
        <slot name="end" slot="end"></slot>
        ${this.renderBody()}
      </md-item>
    `)}renderListItem(e){return k`
      <li
        id="item"
        tabindex=${this.disabled?-1:0}
        role=${this.selectOptionController.role}
        aria-label=${this.ariaLabel||D}
        aria-selected=${this.ariaSelected||D}
        aria-checked=${this.ariaChecked||D}
        aria-expanded=${this.ariaExpanded||D}
        aria-haspopup=${this.ariaHasPopup||D}
        class="list-item ${v(this.getRenderClasses())}"
        @click=${this.selectOptionController.onClick}
        @keydown=${this.selectOptionController.onKeydown}
        >${e}</li
      >
    `}renderRipple(){return k` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.disabled}></md-ripple>`}renderFocusRing(){return k` <md-focus-ring
      part="focus-ring"
      for="item"
      inward></md-focus-ring>`}getRenderClasses(){return{disabled:this.disabled,selected:this.selected}}renderBody(){return k`
      <slot></slot>
      <slot name="overline" slot="overline"></slot>
      <slot name="headline" slot="headline"></slot>
      <slot name="supporting-text" slot="supporting-text"></slot>
      <slot
        name="trailing-supporting-text"
        slot="trailing-supporting-text"></slot>
    `}focus(){this.listItemRoot?.focus()}};$.shadowRootOptions={...y.shadowRootOptions,delegatesFocus:!0},A([O({type:Boolean,reflect:!0})],$.prototype,`disabled`,void 0),A([O({type:Boolean,attribute:`md-menu-item`,reflect:!0})],$.prototype,`isMenuItem`,void 0),A([O({type:Boolean})],$.prototype,`selected`,void 0),A([O()],$.prototype,`value`,void 0),A([j(`.list-item`)],$.prototype,`listItemRoot`,void 0),A([M({slot:`headline`})],$.prototype,`headlineElements`,void 0),A([M({slot:`supporting-text`})],$.prototype,`supportingTextElements`,void 0),A([Ae({slot:``})],$.prototype,`defaultElements`,void 0),A([O({attribute:`typeahead-text`})],$.prototype,`typeaheadText`,null),A([O({attribute:`display-text`})],$.prototype,`displayText`,null);var xa=class extends ${};xa.styles=[da],xa=A([w(`md-select-option`)],xa);var Sa=class extends i{render(){return k`
            <md-outlined-select
                ?disabled=${!this.papyros.runner.canStart||this.papyros.debugger.active}
                label=${this.t(`Papyros.programming_language`)}
                @input=${e=>{this.papyros.runner.programmingLanguage=e.target.value}}
            >
                ${Object.values(x).map(e=>k`
                        <md-select-option value=${e} ?selected=${this.papyros.runner.programmingLanguage===e}>
                            <div slot="headline">${e}</div>
                        </md-select-option>
                    `)}
            </md-outlined-select>
        `}};Sa=g([w(`p-programming-language-picker`)],Sa);var Ca=class extends i{static get styles(){return T`
            :host {
                --md-outlined-select-text-field-outline-color: var(--md-sys-color-outline-variant);
            }
        `}render(){return k`
            <md-outlined-select
                ?disabled=${!this.papyros.runner.canStart||this.papyros.debugger.active}
                label=${this.t(`Papyros.examples`)}
                @input=${e=>{this.papyros.runner.code=this.papyros.examples.getExampleCode(e.target.value)}}
            >
                ${this.papyros.examples.names.map(e=>k`
                        <md-select-option value=${e}>
                            <div slot="headline">${e}</div>
                        </md-select-option>
                    `)}
            </md-outlined-select>
        `}};Ca=g([w(`p-example-picker`)],Ca);var wa=class extends i{render(){return k`
            <md-outlined-select
                label=${this.t(`Papyros.language`)}
                @input=${e=>{this.papyros.i18n.locale=e.target.value}}
            >
                ${this.papyros.i18n.availableLocales.map(e=>k`
                        <md-select-option value=${e} ?selected=${this.papyros.i18n.locale===e}>
                            <div slot="headline">${this.t(`Papyros.locales.${e}`)}</div>
                        </md-select-option>
                    `)}
            </md-outlined-select>
        `}};wa=g([w(`p-language-picker`)],wa);var Ta=class extends i{constructor(...e){super(...e),this.dark=!1,this.name=``}connectedCallback(){super.connectedCallback(),this.theme&&ue(this.renderRoot,[this.theme])}focus(e){this.updateComplete.then(()=>{this.renderRoot.querySelector(`md-filled-icon-button`)?.focus(e)})}render(){let e=this.t(`Papyros.themes.names.${this.name.split(` `)[0].toLowerCase()}`),t=this.dark?this.t(`Papyros.themes.dark`,{name:e}):this.t(`Papyros.themes.light`,{name:e}),n=this.papyros.constants.activeTheme.name===this.name;return k`
            <md-filled-icon-button aria-label=${t} aria-pressed=${n}>
                <md-icon aria-hidden="true">
                    ${this.dark?k`
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                                      <path
                                          d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"
                                      />
                                  </svg>
                              `:k`
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                                      <path
                                          d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"
                                      />
                                  </svg>
                              `}
                </md-icon>
            </md-filled-icon-button>
        `}};g([O({type:Boolean})],Ta.prototype,`dark`,void 0),g([O()],Ta.prototype,`name`,void 0),Ta=g([w(`p-themed-button`)],Ta);var Ea=class extends i{constructor(...e){super(...e),this.picking=!1,this.onKeydown=e=>{e.key===`Escape`&&(e.stopPropagation(),this.close())}}async close(){this.picking=!1,await this.updateComplete,this.toggleButton?.focus()}setTheme(e){this.close(),this.papyros.constants.activeTheme=e}updated(e){super.updated(e),e.has(`picking`)&&this.picking&&this.firstThemedButton?.focus()}render(){return this.picking?k`
            <div role="group" aria-label=${this.t(`Papyros.themes.pick`)} @keydown=${this.onKeydown}>
                ${Object.values(this.papyros.constants.themes).map(e=>k`
                        <p-themed-button
                            .papyros=${this.papyros}
                            .theme=${e.theme}
                            .dark=${e.dark}
                            .name=${e.name}
                            @click=${()=>this.setTheme(e)}
                        ></p-themed-button>
                    `)}
            </div>
        `:k`
                <md-icon-button aria-label=${this.t(`Papyros.themes.pick`)} @click=${()=>this.picking=!0}>
                    <md-icon aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                            <path
                                d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-220 40q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120-160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm200 0q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120 160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"
                            />
                        </svg>
                    </md-icon>
                </md-icon-button>
            `}};g([O({state:!0})],Ea.prototype,`picking`,void 0),g([j(`md-icon-button`)],Ea.prototype,`toggleButton`,void 0),g([j(`p-themed-button`)],Ea.prototype,`firstThemedButton`,void 0),Ea=g([w(`p-theme-picker`)],Ea);var Da={"Hello world!":`console.log("Hello, World!");`,Input:"const name = prompt('What is your name?')\nconsole.log(`Hello, ${name}!`)",Fibonacci:`function fibonacci(n){
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 2) + fibonacci(n - 1);
}
for(let i = 0; i < 10; i += 1){
    console.log(fibonacci(i));
}
`},Oa={"Hello, World!":`print('Hello, World!')`,Input:`name = input('What is your name?')
print(f'Hello, {name}!')`,Fibonacci:`def fibonacci(n):
    return n if n <= 1 else fibonacci(n- 2) + fibonacci(n - 1)

print([fibonacci(n) for n in range(10)])`,Doctests:`def factorial(n):
    """Return the factorial of n, an exact integer >= 0.

    >>> [factorial(n) for n in range(6)]
    [1, 1, 2, 6, 24, 120]
    >>> factorial(30)
    265252859812191058636308480000000
    >>> factorial(-1)
    Traceback (most recent call last):
        ...
    ValueError: n must be >= 0

    Factorials of floats are OK, but the float must be an exact integer:
    >>> factorial(30.1)
    Traceback (most recent call last):
        ...
    ValueError: n must be exact integer
    >>> factorial(30.0)
    265252859812191058636308480000000

    It must also not be ridiculously large:
    >>> factorial(1e100)
    Traceback (most recent call last):
        ...
    OverflowError: n too large
    """

    import math
    if not n >= 0:
        raise ValueError("n must be >= 0")
    if math.floor(n) != n:
        raise ValueError("n must be exact integer")
    if n+1 == n:  # catch a value like 1e300
        raise OverflowError("n too large")
    result = 1
    factor = 2
    while factor <= n:
        result *= factor
        factor += 1
    return result

def wrong_factorial(n):
    """
    >>> [wrong_factorial(n) for n in range(6)]
    [1, 1, 2, 6, 24, 120]
    >>> wrong_factorial(30)
    265252859812191058636308480000000
    """
    return 0
`,Async:`import asyncio

async def nested():
    print(42)

async def main():
    # Schedule nested() to run soon concurrently
    # with "main()".
    task = asyncio.create_task(nested())

    # "task" can now be used to cancel "nested()", or
    # can simply be awaited to wait until it is complete:
    await task

await main()
`,Erroneous:`def bitonic_search(numbers, query):
    if not numbers:
        return -1
    if len(numbers) == 1:
        return 0 if numbers[0] == query else -1
    int top_index = find_max_index(numbers, 0, len(numbers))
    possible_position = find_bitonic_query(numbers,query,0,top_index+1, lambda a, b: a - b)
    if possible_position != -1:
        return possible_position
    else:
        return find_bitonic_query(numbers,query,top_index, len(numbers), lambda a, b: b - a)

def find_max_index(numbers, start, stop):
    while start <= stop:
        if stop - start <= 1:
            return start
        middle = (start + stop) / 2;
        if numbers[middle] < numbers[middle+1]:
            start = midden + 1
        else:
            stop = midden
        
def find_bitonic_query(numbers, query, start, stop, comp):
    while start <= stop:
        if stop - start <= 1:
            return start if numbers[start] == query else -1
        middle = (start + stop) / 2;
        if comp(numbers[midden], query) <= 0:
            start = midden
        else:
            stop = midden
`,Unicode:`import random
emoji = '🎅🤶👪🦌🌟❄️☃️🔥🎄🎁🧦🔔🎶🕯️🦆'
for _ in range(10):
    print(''.join(random.choice(emoji) for _ in range(30)))
`,Files:`with open("names.txt", "w") as out_file:
    for name in ["Alice", "Bob", "Claire"]:
        print(name, file=out_file)

with open("names.txt", "r") as in_file:
    for line in in_file:
        print(line.rstrip())
`,Turtle:`import turtle

colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
for i in range(360):
    turtle.pencolor(colors[i % 6])
    turtle.forward(i * 0.5)
    turtle.left(59)
`,Matplotlib:`import matplotlib.pyplot as plt
import networkx as nx

plt.rcParams["font.size"] = 10
plt.figure()
plt.title('Random graph')

plt.tick_params(
    axis='both', left='off', top='off', right='off', 
    bottom='off', labelleft='off', labeltop='off', 
    labelright='off', labelbottom='off'
)
G = nx.random_geometric_graph(512, 0.125)
pos=nx.spring_layout(G)
nx.draw_networkx_edges(G, pos, alpha=0.2)
nx.draw_networkx_nodes(G, pos, node_color='r', node_size=12)

plt.show()
`,Sleep:`import time
text = """What is the air-speed velocity of an unladen swallow?
What do you mean? An African or European swallow?
What? I, I don't know that.
"""
for character in text:
    print(character, end="")
    time.sleep(0.1)
`,Overflow:`from functools import lru_cache

@lru_cache
def fibonacci(n):
    return n if n <= 1 else fibonacci(n- 2) + fibonacci(n - 1)

for index in range(5000):
    print(f'{index}: {fibonacci(index)}')
`,Interrupt:`i = 0
while i >= 0:
    print(i)
    i += 1
`},ka,Aa=ka=class extends i{static get styles(){return T`
            :host {
                width: 100%;
                height: 100%;
                display: block;
                background-color: var(--md-sys-color-background);
                color: var(--md-sys-color-on-background);
                --md-ref-typeface-brand: Roboto, "Helvetica Neue", sans-serif;
                --md-ref-typeface-plain: var(--md-ref-typeface-brand);
                font-family: var(--md-ref-typeface-brand);
                font-size: 16px;
                --md-outlined-field-bottom-space: 8px;
                --md-outlined-field-top-space: 8px;
                --md-outlined-text-field-bottom-space: 8px;
                --md-outlined-text-field-top-space: 8px;
            }

            .rows {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }

            /* The debugger is only worth a quarter of the page while it is empty. Once a run
               fills it, it gets an equal share, which is the least a trace can be read in. */
            .top {
                flex: 3;
                display: flex;
                min-height: 0;
                transition: flex-grow 250ms ease-out;
            }

            .bottom {
                flex: 1;
                margin: 0.5rem;
                transition: flex-grow 250ms ease-out;
            }

            /* Enough for the title and its one line of placeholder on a short window. This
               carries .pane too, and paneStyles sets min-height: 0 from a later rule of the
               same weight, so the floor has to outrank it. */
            .bottom.pane {
                min-height: 6rem;
            }

            .content.debugging .top {
                flex-grow: 1;
            }

            .content.debugging .bottom {
                flex-grow: 1;
            }

            @media (prefers-reduced-motion: reduce) {
                .top,
                .bottom {
                    transition: none;
                }
            }

            .left {
                flex: 1;
                min-width: 0;
                display: flex;
                margin: 0.5rem;
            }

            .right {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                min-width: 0;
                min-height: 0;
                margin: 0.5rem;
            }

            /* Output must not be squeezed away when the debugger claims its share. Here it
               fills its column instead of growing with its output. */
            .grow {
                flex: 1;
                min-height: 7rem;
                --papyros-output-max-height: none;
            }

            ${ie}

            .pane-title {
                display: flex;
                align-items: center;
                height: 2.25rem;
                padding: 0 0.875rem;
                flex-shrink: 0;
                box-shadow: inset 0 -1px 0 var(--md-sys-color-outline-variant);
                font-size: 0.875rem;
                font-weight: 500;
                color: var(--md-sys-color-primary);
            }

            /* The label carries the indicator, so it is as wide as the text like a real tab. */
            .pane-title span {
                position: relative;
                display: flex;
                align-items: center;
                height: 100%;
            }

            .pane-title span::after {
                content: "";
                position: absolute;
                left: -0.25rem;
                right: -0.25rem;
                bottom: 0;
                height: 2px;
                border-radius: 2px 2px 0 0;
                background-color: var(--md-sys-color-primary);
            }

            /* The debugger scrolls its own memory view, under its step controls. */
            .pane-body {
                flex: 1;
                min-height: 0;
                display: flex;
                flex-direction: column;
            }

            /* The 40px controls set the height of this row, so the padding is all there is
               to give back to the content below. */
            .header {
                align-items: center;
                padding: 0.5rem 1.5rem;
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                justify-content: space-between;
                background-color: var(--md-sys-color-surface-container);
                color: var(--md-sys-color-on-surface);
            }

            .title {
                margin: 0;
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--md-sys-color-primary);
            }

            /* The pickers wrap rather than push the header wider than a narrow window. */
            .header-options {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                align-items: center;
            }

            /* No height here: flex-grow already claims the room the header leaves, and a
               definite height would become this item's automatic minimum, so the page
               scrolled by exactly the header once the panes wanted more than it. */
            .content {
                max-width: 1500px;
                width: 100%;
                min-height: 0;
                /* The panes carry their own 0.5rem, so a full rem here doubled the gap. */
                margin: 0.5rem auto;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
        `}constructor(){super(),this.subscriptions=[],this.papyros.launch()}connectedCallback(){super.connectedCallback(),this.papyros.examples.setExamples(x.JavaScript,Da),this.papyros.examples.setExamples(x.Python,Oa),this.initializeLocalStorageProperty(this.papyros.i18n,`locale`),this.initializeLocalStorageProperty(this.papyros.runner,`code`),this.initializeLocalStorageProperty(this.papyros.runner,`programmingLanguage`),this.initializeLocalStorageProperty(this.papyros.constants,`activeTheme`)}disconnectedCallback(){super.disconnectedCallback(),this.subscriptions.forEach(e=>e()),this.subscriptions=[]}initializeLocalStorageProperty(e,t){let n=localStorage.getItem(t);if(n!==null)try{e[t]=JSON.parse(n)}catch{}let r=e.subscribe(()=>{localStorage.setItem(t,JSON.stringify(e[t]))},t);this.subscriptions.push(r)}setTheme(e){document.documentElement.style.setProperty(`color-scheme`,e.dark?`dark`:`light`),ue(this.renderRoot,[ka.styles,e.theme])}render(){return this.setTheme(this.papyros.constants.activeTheme),document.documentElement.lang=this.papyros.i18n.locale,k`
            <div class="rows">
                <header class="header">
                    <div class="header-options">
                        <h1 class="title">${this.t(`Papyros.Papyros`)}</h1>
                        <md-icon-button
                            href="https://github.com/dodona-edu/papyros"
                            target="_blank"
                            rel="noopener"
                            aria-label=${this.t(`Papyros.github_link`)}
                        >
                            <md-icon aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27"
                                    ></path>
                                </svg>
                            </md-icon>
                        </md-icon-button>
                    </div>
                    <div class="header-options">
                        <p-theme-picker .papyros=${this.papyros}></p-theme-picker>
                        <p-language-picker .papyros=${this.papyros}></p-language-picker>
                        <p-programming-language-picker .papyros=${this.papyros}></p-programming-language-picker>
                        <p-example-picker .papyros=${this.papyros}></p-example-picker>
                    </div>
                </header>
                <main class="content ${this.papyros.debugger.active?`debugging`:``}">
                    <div class="top">
                        <div class="left">
                            <p-code-runner .papyros=${this.papyros}></p-code-runner>
                        </div>
                        <div class="right">
                            <p-output .papyros=${this.papyros} class="grow"></p-output>
                            <p-input .papyros=${this.papyros}></p-input>
                        </div>
                    </div>
                    <div class="bottom pane">
                        <div class="pane-title"><span>${this.t(`Papyros.debugger_tab`)}</span></div>
                        <div class="pane-body">
                            <p-debugger .papyros=${this.papyros}></p-debugger>
                        </div>
                    </div>
                </main>
            </div>
        `}};Aa=ka=g([w(`p-app`)],Aa);