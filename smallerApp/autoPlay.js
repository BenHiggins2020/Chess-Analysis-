/**
 * Auto-play module: simply tracks whether auto-play is enabled.
 * The actual move execution happens in analysis.js to avoid engine conflicts.
 */
import { tryMoveUci, syncBoardTo, turn, isGameOver, getLearnerColor } from "./chessEngine.js";

let autoPlayEnabled = false;
let autoPlayDepth = 12;

export function isAutoPlay() {
    return autoPlayEnabled;
}

export function setAutoPlay(on) {
    autoPlayEnabled = Boolean(on);
}

export function setAutoPlayDepth(d) {
    autoPlayDepth = Math.max(1, Math.min(30, Number(d) || 12));
}

export function getAutoPlayDepth() {
    return autoPlayDepth;
}

/**
 * Applies a move if it's the computer's turn and auto-play is enabled.
 * Called by analysis.js after a move is found.
 */
export function performAutoMove(chessboard, bestmove) {
    console.log(`[AutoPlay] performAutoMove called.[enabled =${autoPlayEnabled} isGameOver =${isGameOver()}] bestmove:`, bestmove);
    if (!autoPlayEnabled) return;
    if (isGameOver()) return;

    const learner = getLearnerColor();
    if (turn() === learner) return; // Human turn

    if (!bestmove || bestmove === "(none)") return;

    const from = bestmove.slice(0, 2);
    const to = bestmove.slice(2, 4);
    const promo = bestmove.length > 4 ? bestmove[4] : "q";

    console.log("[AutoPlay] Executing computer move:", from, "to", to);
    const moveResult = tryMoveUci(from, to, promo);
    if (moveResult.ok) {
        syncBoardTo(chessboard);
    }
}

/**
 * Legacy export for Chessboard.js - does nothing now as analysis.js handles it.
 */
export function scheduleComputerMove(chessboard) {
    // No-op. analysis.js now triggers the move after it finishes thinking.
}
