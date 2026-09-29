import { afterEach, describe, expect, it, vi } from "vitest";
import { fileNameFromUrl, loadFile } from "../../../src/frontend/state/Files";
import { RunMode } from "../../../src/backend/Backend";
import { ProgrammingLanguage } from "../../../src/ProgrammingLanguage";
import { launchPapyros, waitForPapyrosReady } from "../../helpers";

const BASE = "https://files.test/activities/1/";

// Loaded files are cached per URL for the whole module, so every test uses its own URLs.
function stubFetch(...responses: (() => Response)[]): ReturnType<typeof vi.fn> {
    const fetch = vi.fn();
    for (const response of responses) {
        fetch.mockImplementationOnce(async () => response());
    }
    vi.stubGlobal("fetch", fetch);
    return fetch;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("fileNameFromUrl", () => {
    it("decodes the last path segment", () => {
        expect(fileNameFromUrl(`${BASE}media/my%20grades.txt?v=1#top`)).toBe("my grades.txt");
    });

    it("keeps a segment that cannot be decoded", () => {
        expect(fileNameFromUrl(`${BASE}media/100%.txt`)).toBe("100%.txt");
    });
});

describe("loadFile", () => {
    it("loads UTF-8 content as text", async () => {
        stubFetch(() => new Response("naam;score\nJoké;10\n"));

        const file = await loadFile(`${BASE}text.txt`);

        expect(file).toEqual({
            name: "text.txt",
            content: "naam;score\nJoké;10\n",
            binary: false,
        });
    });

    it("keeps a byte order mark in the text", async () => {
        stubFetch(() => new Response(new Uint8Array([0xef, 0xbb, 0xbf, 0x61])));

        const file = await loadFile(`${BASE}bom.csv`);

        expect(file.content).toBe("﻿a");
        expect(file.binary).toBe(false);
    });

    it("base64-encodes content that is not valid UTF-8", async () => {
        const bytes = new Uint8Array(100_000).fill(0xff);
        bytes.set([0x89, 0x50, 0x4e, 0x47]);
        stubFetch(() => new Response(bytes));

        const file = await loadFile(`${BASE}image.png`);

        expect(file.binary).toBe(true);
        expect(file.content).toBe(btoa(String.fromCharCode(...bytes)));
    });

    it("fetches a file once for several loads", async () => {
        const url = `${BASE}shared.txt`;
        const fetch = stubFetch(() => new Response("shared"));

        const [first, second] = await Promise.all([loadFile(url), loadFile(url)]);
        const third = await loadFile(url);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
        expect(third).toBe(first);
    });

    it("rejects a response that is not OK", async () => {
        stubFetch(() => new Response("Not found", { status: 404 }));

        await expect(loadFile(`${BASE}missing.txt`)).rejects.toThrow("404");
    });

    it("fetches a file again after a failed load", async () => {
        const url = `${BASE}flaky.txt`;
        const fetch = stubFetch(
            () => new Response("Server error", { status: 500 }),
            () => new Response("recovered"),
        );

        await expect(loadFile(url)).rejects.toThrow("500");
        const file = await loadFile(url);

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(file.content).toBe("recovered");
    });
});

describe.sequential("running with loaded files", () => {
    it("lets the code read a loaded text file", async () => {
        stubFetch(() => new Response("18\n15\n"));
        const papyros = await launchPapyros(ProgrammingLanguage.Python);
        try {
            const { name, content, binary } = await loadFile(`${BASE}grades.txt`);
            papyros.runner.code = 'print(open("grades.txt").read().split())';
            await papyros.runner.start(RunMode.Run, [{ name, content, binary }]);
            await waitForPapyrosReady(papyros, 60000);

            expect(papyros.io.output.map((o) => o.content).join("")).toContain("['18', '15']");
        } finally {
            papyros.dispose();
        }
    }, 180000);
});
