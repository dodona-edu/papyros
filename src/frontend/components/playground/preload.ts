import type { Papyros } from "../../state/Papyros";
import type { PapyrosRuntime } from "../../state/PapyrosRuntime";
import { PapyrosLaunchError } from "../../state/PapyrosErrors";

interface Preload {
    observer: IntersectionObserver;
    waiting: Map<Element, Papyros>;
    started: boolean;
}

const preloads: WeakMap<PapyrosRuntime, Preload> = new WeakMap();

/**
 * Launch the runtime of a playground once the first playground on that runtime scrolls
 * into view, rather than on page load: a page can hold playgrounds nobody ever sees, such
 * as a hidden copy of a description. Every waiting instance is launched then, which after
 * the first costs nothing since they share the runtime's worker.
 * @param {Element} element The playground to watch
 * @param {Papyros} papyros The instance that runs the playground's code
 */
export function preloadWhenVisible(element: Element, papyros: Papyros): void {
    let preload = preloads.get(papyros.runtime);
    if (preload?.started) {
        papyros.runner.ensureLaunched().catch(() => undefined);
        return;
    }
    if (!preload) {
        const waiting: Map<Element, Papyros> = new Map();
        const created: Preload = {
            waiting,
            started: false,
            observer: new IntersectionObserver((entries) => {
                const visible = entries.find((entry) => entry.isIntersecting);
                if (!visible) {
                    return;
                }
                created.observer.disconnect();
                created.started = true;
                const reporter = waiting.get(visible.target)!;
                const launches = [...waiting.values()].map((instance) => instance.runner.ensureLaunched());
                waiting.clear();
                // A failure is reported once, and the next Run retries the launch
                Promise.all(launches).catch((error) =>
                    reporter.errorHandler(
                        new PapyrosLaunchError("Preloading the code playground runtime failed", { cause: error }),
                    ),
                );
            }),
        };
        preload = created;
        preloads.set(papyros.runtime, preload);
    }
    preload.waiting.set(element, papyros);
    preload.observer.observe(element);
}

/**
 * Stop watching a playground, for instance because it left the page
 * @param {Element} element The playground to stop watching
 * @param {PapyrosRuntime} runtime The runtime it was watched for
 */
export function stopPreloading(element: Element, runtime: PapyrosRuntime): void {
    const preload = preloads.get(runtime);
    if (preload && !preload.started) {
        preload.observer.unobserve(element);
        preload.waiting.delete(element);
    }
}
