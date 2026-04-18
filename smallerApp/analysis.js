import {
    fetchMastersExplorer,
    fetchLichessPlayerExplorer,
    fetchCloudEval,
} from "./lichessApi.js";
import { analyzeFen } from "./stockfishEngine.js";
import { performAutoMove } from "./autoPlay.js";

/**
 * @param {object} data
 * @param {number} [limit]
 */
function formatExplorerMoves(data, limit = 8) {
    const moves = data?.moves;
    if (!Array.isArray(moves) || moves.length === 0) {
        return "<p class='analysis-muted'>No statistics for this position.</p>";
    }
    const rows = moves.slice(0, limit).map((m) => {
        const total = (m.white || 0) + (m.draws || 0) + (m.black || 0);
        const pct = total ? Math.round(((m.white || 0) / total) * 100) : 0;
        return `<tr><td>${escapeHtml(m.san)}</td><td>${total}</td><td>${pct}% white</td></tr>`;
    });
    return `<table class="analysis-table"><thead><tr><th>Move</th><th>Games</th><th>White%</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * @param {HTMLElement} root
 * @param {import('./Chessboard.js').Chessboard} game
 */
export function mountAnalysisPanel(root, game) {
    if (!root) {
        return;
    }
    root.innerHTML = `
        <p class="analysis-muted">Analysis updates after each position change (debounced).</p>
        <section class="analysis-section">
            <h3 class="analysis-heading">Opening — Masters (Lichess explorer)</h3>
            <div id="analysis-masters">…</div>
        </section>
        <section class="analysis-section">
            <h3 class="analysis-heading">Opening — Lichess games</h3>
            <div id="analysis-lichess">…</div>
        </section>
        <section class="analysis-section">
            <h3 class="analysis-heading">Cloud eval (Lichess, when available)</h3>
            <div id="analysis-cloud">…</div>
        </section>
        <section class="analysis-section">
            <h3 class="analysis-heading">Engine (Stockfish.js, depth 14)</h3>
            <div id="analysis-engine">…</div>
        </section>
    `;

    let debounceTimer = 0;
    let seq = 0;

    async function refresh(fen) {
        console.log("[Analysis] Refreshing for FEN:", fen);
        const id = ++seq;
        const elM = root.querySelector("#analysis-masters");
        const elL = root.querySelector("#analysis-lichess");
        const elC = root.querySelector("#analysis-cloud");
        const elE = root.querySelector("#analysis-engine");
        if (!elM || !elL || !elC || !elE) {
            return;
        }

        elM.textContent = "Loading…";
        elL.textContent = "Loading…";
        elC.textContent = "Loading…";
        elE.textContent = "Thinking…";

        try {
            const [masters, lichessDb] = await Promise.all([
                fetchMastersExplorer(fen).catch((e) => ({ error: String(e.message || e) })),
                fetchLichessPlayerExplorer(fen).catch((e) => ({ error: String(e.message || e) })),
            ]);
            if (id !== seq) return;

            elM.innerHTML =
                "error" in masters
                    ? `<p class="analysis-error">${escapeHtml(masters.error)}</p>`
                    : formatExplorerMoves(masters);
            elL.innerHTML =
                "error" in lichessDb
                    ? `<p class="analysis-error">${escapeHtml(lichessDb.error)}</p>`
                    : formatExplorerMoves(lichessDb);

            let cloudHtml = "<p class='analysis-muted'>No cloud eval for this FEN.</p>";
            try {
                const ce = await fetchCloudEval(fen);
                if (id !== seq) return;
                if (ce?.pvs?.length) {
                    const pv0 = ce.pvs[0];
                    cloudHtml = `<p><strong>Best:</strong> ${escapeHtml(pv0.moves || "")}</p><p><strong>CP:</strong> ${pv0.cp ?? "—"}</p>`;
                }
            } catch (e) {
                cloudHtml = `<p class="analysis-error">${escapeHtml(String(e.message || e))}</p>`;
            }
            elC.innerHTML = cloudHtml;

            try {
                const eng = await analyzeFen(fen, 14);
                if (id !== seq) return;
                elE.innerHTML = `
                    <p><strong>Eval:</strong> ${escapeHtml(eng.scoreText)}</p>
                    <p><strong>Best move (UCI):</strong> ${escapeHtml(eng.bestmove || "—")}</p>
                    <p class="analysis-pv"><strong>PV:</strong> ${escapeHtml(eng.pv || "—")}</p>
                `;

                // If auto-play is on and it's computer turn, take this move immediately
                if (eng.bestmove) {
                    console.log("[Analysis] Best move found:", eng.bestmove);
                    performAutoMove(game, eng.bestmove);
                }
            } catch (e) {
                if (id !== seq) return;
                elE.innerHTML = `<p class="analysis-error">Stockfish: ${escapeHtml(String(e.message || e))}</p><p class="analysis-muted">Use <code>npm run dev</code> so the worker can load the WASM file.</p>`;
            }
        } catch (e) {
            if (id !== seq) return;
            const msg = escapeHtml(String(e.message || e));
            elM.innerHTML = `<p class="analysis-error">${msg}</p>`;
            elL.innerHTML = elM.innerHTML;
        }
    }

    document.addEventListener("chessPositionChanged", (ev) => {
        const fen = ev.detail?.fen;
        if (!fen) return;
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => refresh(fen), 400);
    });
}
