import { Chessboard } from "./Chessboard.js";
import { GameStateManager } from "./GameStateManage.js";
import {
    resetEngine,
    syncBoardTo,
    loadFen,
    loadPgnOpening,
    loadComputerOpeningPgn,
    clearComputerOpening,
    undoLast,
    setLearnerColor,
    setStrictOpening,
    getChess,
    getFen,
} from "./chessEngine.js";
import { mountAnalysisPanel } from "./analysis.js";
import { mountOllamaChat } from "./ollamaChat.js";
import { setAutoPlay, setAutoPlayDepth } from "./autoPlay.js";
import { OPENINGS } from "./openingsDb.js";

const boardEl = document.getElementById("board");
const boardWrap = document.getElementById("board-wrap");
const statusEl = document.getElementById("chess-status");
const fenInput = document.getElementById("fen");
const pgnInput = document.getElementById("pgn");
const computerPgnInput = document.getElementById("computer-pgn");

function showStatus(message, kind = "info") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("error");
    if (kind === "error") {
        statusEl.classList.add("error");
    }
}

document.addEventListener("chessStatus", (e) => {
    const { message, kind } = e.detail;
    if (kind === "clear") {
        showStatus("", "info");
    } else {
        showStatus(message, kind);
    }
});

function readTrainerOptions() {
    const b = document.getElementById("learner-black");
    setLearnerColor(b?.checked ? "b" : "w");
    const strict = document.getElementById("strict-opening");
    setStrictOpening(strict?.checked ?? false);
}

function updateBoardFlip() {
    const black = document.getElementById("learner-black")?.checked;
    boardWrap?.classList.toggle("board-wrap--flipped", !!black);
}

new GameStateManager();
const game = new Chessboard();

resetEngine();
syncBoardTo(game);

game.gameState.forEach((square) => {
    boardEl.appendChild(square.UI_ref);
});

mountAnalysisPanel(document.getElementById("analysis"), game);
mountOllamaChat(document.getElementById("ollama-root"));

updateBoardFlip();
document.dispatchEvent(
    new CustomEvent("chessPositionChanged", { detail: { fen: getFen() } }),
);

document.getElementById("load-fen-btn")?.addEventListener("click", () => {
    readTrainerOptions();
    const fen = fenInput?.value?.trim();
    if (!fen) {
        showStatus("Paste a FEN string.", "error");
        return;
    }
    const r = loadFen(fen);
    if (!r.ok) {
        showStatus(r.error, "error");
        return;
    }
    syncBoardTo(game);
    showStatus("FEN loaded.", "info");
});

document.getElementById("load-pgn-btn")?.addEventListener("click", () => {
    readTrainerOptions();
    const pgn = pgnInput?.value?.trim();
    if (!pgn) {
        showStatus("Paste a PGN first.", "error");
        return;
    }
    const r = loadPgnOpening(pgn);
    if (!r.ok) {
        showStatus(r.error, "error");
        return;
    }
    syncBoardTo(game);
    showStatus(
        `Trainer PGN loaded (${r.moveCount} half-moves). ${getChess().inCheck() ? "Check." : ""
        }`,
        "info",
    );
});

document.getElementById("load-computer-pgn-btn")?.addEventListener("click", () => {
    const pgn = computerPgnInput?.value?.trim();
    if (!pgn) {
        showStatus("Paste a computer-opening PGN.", "error");
        return;
    }
    const r = loadComputerOpeningPgn(pgn);
    if (!r.ok) {
        showStatus(r.error, "error");
        return;
    }
    showStatus(`Computer opening loaded (${r.moveCount} half-moves).`, "info");
});

document.getElementById("clear-computer-pgn-btn")?.addEventListener("click", () => {
    clearComputerOpening();
    if (computerPgnInput) computerPgnInput.value = "";
    showStatus("Computer opening cleared.", "info");
});

document.getElementById("undo-btn")?.addEventListener("click", () => {
    const r = undoLast();
    if (!r.ok) {
        showStatus("Nothing to undo.", "error");
        return;
    }
    syncBoardTo(game);
    showStatus("Undid one move.", "info");
});

document.getElementById("reset-btn")?.addEventListener("click", () => {
    readTrainerOptions();
    resetEngine();
    syncBoardTo(game);
    showStatus("New game.", "info");
});

["learner-white", "learner-black", "strict-opening"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
        readTrainerOptions();
        if (id === "learner-white" || id === "learner-black") {
            updateBoardFlip();
        }
        showStatus(
            "Trainer options updated. Reload trainer PGN if the auto-prefix should change.",
            "info",
        );
    });
});

/* ── Auto-play controls ─────────────────────────────────── */
document.getElementById("auto-play")?.addEventListener("change", (e) => {
    setAutoPlay(e.target.checked);
    showStatus(e.target.checked ? "Auto-play ON — computer will reply." : "Auto-play OFF.", "info");
});

document.getElementById("auto-play-depth")?.addEventListener("change", (e) => {
    setAutoPlayDepth(Number(e.target.value));
    showStatus(`Computer depth set to ${e.target.value}.`, "info");
});

/* ── Opening database ───────────────────────────────────── */
function populateOpeningSelect(selectEl, colorFilter) {
    if (!selectEl) return;
    OPENINGS.forEach((o, i) => {
        if (colorFilter && o.color !== colorFilter && o.color !== "both") return;
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = `${o.eco} — ${o.name}`;
        selectEl.appendChild(opt);
    });
}

const openingMineEl = document.getElementById("opening-mine");
const openingCompEl = document.getElementById("opening-computer");

// Populate with all openings (user can pick any side's opening for either slot)
populateOpeningSelect(openingMineEl, null);
populateOpeningSelect(openingCompEl, null);

document.getElementById("apply-openings-btn")?.addEventListener("click", () => {
    readTrainerOptions();

    const mineIdx = openingMineEl?.value;
    const compIdx = openingCompEl?.value;

    // Load player opening as trainer PGN
    if (mineIdx !== "" && mineIdx != null) {
        const o = OPENINGS[Number(mineIdx)];
        if (pgnInput) pgnInput.value = o.pgn;
        const r = loadPgnOpening(o.pgn);
        if (r.ok) {
            showStatus(`Loaded ${o.name} as your opening (${r.moveCount} half-moves).`, "info");
        } else {
            showStatus(r.error, "error");
        }
    }

    // Load computer opening PGN
    if (compIdx !== "" && compIdx != null) {
        const o = OPENINGS[Number(compIdx)];
        if (computerPgnInput) computerPgnInput.value = o.pgn;
        const r = loadComputerOpeningPgn(o.pgn);
        if (r.ok) {
            showStatus(`Loaded ${o.name} as computer opening (${r.moveCount} half-moves).`, "info");
        } else {
            showStatus(r.error, "error");
        }
    }

    syncBoardTo(game);
});
