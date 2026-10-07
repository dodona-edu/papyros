import { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * Keeps a scrollable output at its end while the reader is there, when the host renders and when
 * an image gets its height. Other growth is left alone, so a traceback the reader opens keeps its
 * toggle in view. Bind `onScroll` to the scroller's scroll event.
 */
export class FollowEnd implements ReactiveController {
    /** Whether the reader is at the end of the output, so new output keeps the end in view. */
    private following = true;

    /** A scroll position set here, so the scroll event it causes is not taken for the reader's. */
    private ownScrollTop: number | undefined = undefined;

    /** An image gets its height after the render that inserts it, which moves the end of the output. */
    private resizeObserver = new ResizeObserver(() => this.scrollToEndIfFollowing());

    private observed: Element[] = [];

    /**
     * @param {ReactiveControllerHost} host The element that renders the scroller
     * @param {function(): HTMLElement | null} scroller The scrollable element, null while it is not rendered
     */
    constructor(
        host: ReactiveControllerHost,
        private readonly scroller: () => HTMLElement | null,
    ) {
        host.addController(this);
    }

    /** Follows the end again, whatever the reader did before. */
    restart(): void {
        this.following = true;
    }

    onScroll = (): void => {
        const scroller = this.scroller();
        if (!scroller) return;
        if (scroller.scrollTop === this.ownScrollTop) {
            this.ownScrollTop = undefined;
            return;
        }
        this.following = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 1;
    };

    hostConnected(): void {
        this.observe();
    }

    hostUpdated(): void {
        this.observe();
        this.scrollToEndIfFollowing();
        // Elements in the output, such as p-friendly-error, render after the host.
        requestAnimationFrame(() => this.scrollToEndIfFollowing());
    }

    hostDisconnected(): void {
        this.resizeObserver.disconnect();
        this.observed = [];
    }

    private scrollToEndIfFollowing(): void {
        const scroller = this.scroller();
        if (!scroller) return;
        // Output that fits has no end to scroll away from, so the next output is followed again.
        if (scroller.scrollHeight <= scroller.clientHeight) this.following = true;
        if (!this.following) return;
        const before = scroller.scrollTop;
        scroller.scrollTop = scroller.scrollHeight;
        if (scroller.scrollTop !== before) {
            this.ownScrollTop = scroller.scrollTop;
        }
    }

    private observe(): void {
        const elements = Array.from(this.scroller()?.querySelectorAll("img") ?? []);
        if (elements.length === this.observed.length && elements.every((element, i) => element === this.observed[i])) {
            return;
        }
        this.resizeObserver.disconnect();
        elements.forEach((element) => this.resizeObserver.observe(element));
        this.observed = elements;
    }
}
