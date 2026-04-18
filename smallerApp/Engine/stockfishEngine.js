/**
 * UCI wrapper for stockfish.js (lite single WASM). Serve over HTTP; worker loads sibling .wasm.
 * Requests are serialized so rapid FEN updates do not interleave UCI streams.
 */

const STOCKFISH_SCRIPT = new URL(
    "./node_modules/stockfish/src/stockfish-17.1-lite-single-03e3232.js",
    import.meta.url,
);

/** @type {Worker | null} */
let worker = null;
let buf = "";
/** @type {string[]} */
const pending = [];
/** @type {((line: string) => void)[]} */
const lineResolvers = [];

function pushData(s) {
    console.log("[Stockfish] Raw: " + s);
    buf += s;
    for (; ;) {
        const i = buf.indexOf("\n");
        if (i === -1) break;
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        console.log("[Stockfish] Line: " + line);
        if (lineResolvers.length > 0) {
            lineResolvers.shift()(line);
        } else {
            pending.push(line);
        }
    }
}

function readLine() {
    if (pending.length > 0) {
        return Promise.resolve(pending.shift());
    }
    return new Promise((resolve) => {
        lineResolvers.push(resolve);
    });
}

function ensureWorker() {
    if (!worker) {
        console.log("[Stockfish] Creating new worker: " + STOCKFISH_SCRIPT);
        worker = new Worker(STOCKFISH_SCRIPT, { type: "classic" });
        worker.onmessage = (e) => {
            const raw = typeof e.data === "string" ? e.data : "";
            pushData(raw.replace(/\r/g, ""));
        };
        worker.onerror = (err) => {
            console.error("[Stockfish] Worker ERROR:", err);
        };
    }
    return worker;
}

let uciReady = false;

export async function initStockfishUci() {
    const w = ensureWorker();
    if (uciReady) {
        return;
    }
    w.postMessage("uci");
    for (; ;) {
        const line = await readLine();
        if (line === null) {
            // Interrupted during handshake. Let the next attempt restart it.
            return;
        }
        if (line === "uciok") {
            break;
        }
    }
    uciReady = true;
}

function flushInput() {
    pending.length = 0;
    buf = "";
    // Resolve all pending readLine promises with null so old consumers unblock
    while (lineResolvers.length > 0) {
        lineResolvers.shift()(null);
    }
}

/** @type {Promise<unknown>} */
let queue = Promise.resolve();

/**
 * @param {string} fen
 * @param {number} [depth]
 */
export function analyzeFen(fen, depth = 14) {
    const task = async () => {
        await initStockfishUci();
        const w = ensureWorker();

        // Stop any current search
        w.postMessage("stop");
        // Tiny wait to yield
        await new Promise((r) => setTimeout(r, 20));
        flushInput();

        w.postMessage("ucinewgame");
        w.postMessage(`position fen ${fen}`);
        w.postMessage(`go depth ${depth}`);

        let lastScore = "";
        let lastPv = "";

        for (; ;) {
            const line = await readLine();
            if (line === null) return { bestmove: "", scoreText: "—", pv: "" };

            if (line.startsWith("info ") && line.includes(" pv ")) {
                const cp = /\bscore cp (-?\d+)/.exec(line);
                const mate = /\bscore mate (-?\d+)/.exec(line);
                if (mate) {
                    lastScore = `Mate in ${mate[1]}`;
                } else if (cp) {
                    const c = Number(cp[1]) / 100;
                    lastScore = `${c >= 0 ? "+" : ""}${c.toFixed(2)} pawns (side to move)`;
                }
                const pvMatch = line.match(/\bpv\s+(.+)$/);
                if (pvMatch) {
                    lastPv = pvMatch[1].trim();
                }
            }
            if (line.startsWith("bestmove")) {
                const m = /^bestmove\s+(\S+)(?:\s+ponder\s+(\S+))?/.exec(line);
                const bm = m ? m[1] : "";
                if (bm === "(none)") {
                    return { bestmove: "", scoreText: lastScore || "—", pv: lastPv };
                }
                return {
                    bestmove: bm,
                    ponder: m?.[2],
                    scoreText: lastScore || "—",
                    pv: lastPv,
                };
            }
        }
    };

    const p = queue.catch(() => { }).then(() => task());
    queue = p.catch(() => { });
    return p;
}

export function terminateStockfish() {
    if (worker) {
        try {
            worker.postMessage("quit");
        } catch {
            /* ignore */
        }
        worker.terminate();
        worker = null;
        uciReady = false;
        flushInput();
    }
}
