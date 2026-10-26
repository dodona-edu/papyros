import type { ReactiveController, ReactiveControllerHost } from "lit";
import { Papyros, papyros as globalPapyros } from "../../state/Papyros";
import { PapyrosRuntime } from "../../state/PapyrosRuntime";
import { preloadWhenVisible, stopPreloading } from "./preload";

/**
 * Runtime of the playgrounds a host did not give a Papyros instance
 */
let defaultRuntime: PapyrosRuntime | undefined;

export interface InstanceHost extends ReactiveControllerHost, HTMLElement {
    papyros: Papyros;
    readonly code: string;
}

/**
 * The Papyros instance of a playground: creates one on the default runtime when the host
 * gives none and disposes it when the playground leaves the page or the host replaces it,
 * keeps the instance's code in sync with the playground's, and registers the instance for
 * preloading.
 */
export class PlaygroundInstance implements ReactiveController {
    private ownPapyros?: Papyros;
    private synced?: { papyros: Papyros; code: string };
    private preloaded?: Papyros;

    /**
     * @param {InstanceHost} host The playground
     * @param {function(): boolean} runsCode Whether the playground can run its code, which is
     *     what preloading is for
     */
    constructor(
        private readonly host: InstanceHost,
        private readonly runsCode: () => boolean,
    ) {
        host.addController(this);
    }

    hostConnected(): void {
        // PapyrosElement falls back to one global instance, whose state playgrounds must not share
        if (this.host.papyros === globalPapyros) {
            defaultRuntime ??= new PapyrosRuntime();
            this.host.papyros = this.ownPapyros = new Papyros({ runtime: defaultRuntime });
        }
        this.syncPreload();
    }

    hostDisconnected(): void {
        this.syncPreload();
        // Deferred so that moving the element within the page keeps its instance
        queueMicrotask(() => {
            if (!this.host.isConnected && this.ownPapyros && this.host.papyros === this.ownPapyros) {
                // A removed playground must not keep the runtime claimed, e.g. while waiting for input
                this.disposeOwnPapyros();
                this.host.papyros = globalPapyros;
            }
        });
    }

    hostUpdate(): void {
        const { papyros, code } = this.host;
        if (this.ownPapyros && papyros !== this.ownPapyros) {
            // The host assigned an instance after the playground created its own
            this.disposeOwnPapyros();
        }
        // The global instance only stands in while the playground is out of the page; its
        // code belongs to whoever else uses it.
        if (papyros !== globalPapyros && (papyros !== this.synced?.papyros || code !== this.synced.code)) {
            papyros.runner.code = code;
            this.synced = { papyros, code };
        }
        this.syncPreload();
    }

    private disposeOwnPapyros(): void {
        this.ownPapyros!.dispose();
        this.ownPapyros = undefined;
    }

    private syncPreload(): void {
        const papyros = this.host.isConnected && this.runsCode() ? this.host.papyros : undefined;
        if (papyros === this.preloaded) {
            return;
        }
        if (this.preloaded) {
            stopPreloading(this.host, this.preloaded.runtime);
        }
        this.preloaded = papyros;
        if (papyros) {
            preloadWhenVisible(this.host, papyros);
        }
    }
}
