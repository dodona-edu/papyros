import { html, nothing, ReactiveController, ReactiveControllerHost, TemplateResult } from "lit";
import { FileEntry } from "../../state/InputOutput";
import { fileNameFromUrl, loadFile } from "../../state/Files";
import type { Papyros } from "../../state/Papyros";
import { isValidFileName } from "../../../util/Util";
import { renderStatus } from "./status";
import "../EditorTabs";
import "../FileViewer";

export interface FilesHost extends ReactiveControllerHost {
    readonly papyros: Papyros;
    /** Space-separated paths of the data files */
    readonly files: string;
}

interface FileRef {
    /** The path as declared */
    path: string;
    name: string;
    url: string;
}

/**
 * The data files of a playground: their read-only tabs and previews, and loading them for
 * a run. Renders into the host's shadow root.
 */
export class PlaygroundFiles implements ReactiveController {
    private parsedFrom?: string;
    private refs: FileRef[] = [];
    private tabs: FileEntry[] = [];
    private shownTab: string | undefined;

    // Keyed by URL
    private readonly previews = new Map<string, FileEntry>();

    // URLs of the files whose latest load failed
    private readonly failedFiles = new Set<string>();

    constructor(private readonly host: FilesHost) {
        host.addController(this);
    }

    private t(phrase: string, options?: Record<string, any>): string {
        return this.host.papyros.i18n.t(phrase, options);
    }

    private get declared(): boolean {
        return this.refs.length > 0;
    }

    /** Why the declared files cannot be used, if they cannot */
    get configError(): string | undefined {
        const invalid = this.refs.find((f) => !isValidFileName(f.name));
        if (invalid) {
            return this.t("Papyros.playground.invalid_file_name", { path: invalid.path });
        }
        const names = this.refs.map((f) => f.name);
        const duplicate = names.find((name, index) => names.indexOf(name) !== index);
        if (duplicate !== undefined) {
            return this.t("Papyros.playground.duplicate_file_name", { name: duplicate });
        }
        return undefined;
    }

    private get activeFile(): FileRef | undefined {
        return this.refs.find((f) => f.name === this.host.papyros.io.activeEditorTab);
    }

    hostUpdate(): void {
        if (this.host.files !== this.parsedFrom) {
            this.parsedFrom = this.host.files;
            this.refs = this.host.files
                .split(/\s+/)
                .filter((path) => path !== "")
                .map((path) => {
                    const url = new URL(path, document.baseURI).href;
                    return { path, name: fileNameFromUrl(url), url };
                });
            this.tabs = this.refs.map((f) => ({ name: f.name, content: "", binary: false }));
            this.failedFiles.clear();
            // The open tab may now stand for another file
            this.shownTab = undefined;
        }
        const tab = this.host.papyros.io.activeEditorTab;
        if (tab !== this.shownTab) {
            this.shownTab = tab;
            const file = this.activeFile;
            if (file) {
                // A file that failed to load is retried when its tab is opened again
                this.clearFailed(file.url);
                // Files load when their tab is first opened, or when Run needs them
                if (!this.previews.has(file.url)) {
                    loadFile(file.url).then(
                        (loaded) => {
                            this.previews.set(file.url, loaded);
                            this.host.requestUpdate();
                        },
                        () => this.markFailed([file.url]),
                    );
                }
            }
        }
    }

    private markFailed(urls: string[]): void {
        urls.forEach((url) => this.failedFiles.add(url));
        this.host.requestUpdate();
    }

    private clearFailed(url: string): void {
        if (this.failedFiles.delete(url)) {
            this.host.requestUpdate();
        }
    }

    /** Whether a file failed to load, which shows as an alert */
    get failed(): boolean {
        return this.failedFiles.size > 0;
    }

    /** Clears the failures of earlier loads, which the next run retries */
    clearFailures(): void {
        this.failedFiles.clear();
        this.host.requestUpdate();
    }

    /** Rejects when a file failed to load, which shows as an alert */
    async loadForRun(): Promise<FileEntry[]> {
        const refs = this.refs;
        const results = await Promise.allSettled(refs.map((f) => loadFile(f.url)));
        const files: FileEntry[] = [];
        const failed: string[] = [];
        results.forEach((result, i) => {
            if (result.status === "fulfilled") {
                files.push(result.value);
            } else {
                failed.push(refs[i].url);
            }
        });
        if (failed.length > 0) {
            this.markFailed(failed);
            throw new Error(`Loading ${failed.join(", ")} failed`);
        }
        return files;
    }

    renderTabs(): TemplateResult | typeof nothing {
        if (!this.declared) {
            return nothing;
        }
        const papyros = this.host.papyros;
        const file = this.activeFile;
        const preview = file && this.previews.get(file.url);
        return html`
            <p-editor-tabs .papyros=${papyros} .files=${this.tabs} readonly></p-editor-tabs>
            ${
                file
                    ? html`<div class="file-panel" role="tabpanel" aria-label=${file.name}>
                          ${
                              preview
                                  ? html`<p-file-viewer
                                        .papyros=${papyros}
                                        .file=${preview}
                                        .url=${file.url}
                                        readonly
                                    ></p-file-viewer>`
                                  : !this.failedFiles.has(file.url)
                                    ? renderStatus(this.t("Papyros.playground.file_loading"), "file-status")
                                    : nothing
                          }
                      </div>`
                    : nothing
            }
            ${this.refs
                .filter((f) => this.failedFiles.has(f.url))
                .map(
                    (f) =>
                        html`<div class="file-error" role="alert">
                            ${this.t("Papyros.playground.file_load_failed", { name: f.name })}
                        </div>`,
                )}
        `;
    }

    /** The editor, as the Code tab's panel when there are file tabs */
    renderCodePanel(editor: TemplateResult): TemplateResult {
        if (!this.declared) {
            return editor;
        }
        // The tabs live in another shadow root, so the panel is named directly instead of by aria-labelledby.
        return html`<div
            class="code-panel"
            role="tabpanel"
            aria-label=${this.t("Papyros.editor_tab_code")}
            ?hidden=${this.activeFile !== undefined}
        >
            ${editor}
        </div>`;
    }
}
