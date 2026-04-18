import { Chess, validateFen, WHITE, BLACK } from "./node_modules/chess.js/dist/esm/chess.js";
import { syncBoardFromChess } from "./boardSync.js";

const chess = new Chess();

/** @type {import('chess.js').Move[]} */
let openingVerbose = [];
/** Optional: opponent moves from a separate PGN (same indexing from start FEN); overrides trainer line when set. */
let computerOpeningVerbose = [];
let learnerColor = WHITE;
let strictOpening = false;

function pickLineMove(idx) {
    return computerOpeningVerbose[idx] ?? openingVerbose[idx];
}

function promotionForMove(from, to, promotionPiece = "q") {
    const p = chess.get(from);
    if (!p || p.type !== "p") return undefined;
    const rank = to[1];
    if (p.color === "w" && rank === "8") return promotionPiece || "q";
    if (p.color === "b" && rank === "1") return promotionPiece || "q";
    return undefined;
}

function movesEqualVerbose(a, from, to, promotion) {
    const bpr = a.promotion ?? "";
    const pr = promotion ?? "";
    return a.from === from && a.to === to && bpr === pr;
}

/**
 * Play every opponent reply that is next in the loaded line until it is the
 * learner's turn or the line ends.
 */
export function playScheduledOpponentReplies() {
    const maxLen = Math.max(openingVerbose.length, computerOpeningVerbose.length);
    if (maxLen === 0) return;

    while (chess.history().length < maxLen) {
        const next = pickLineMove(chess.history().length);
        if (!next) break;
        if (next.color === learnerColor) break;
        try {
            chess.move({
                from: next.from,
                to: next.to,
                promotion: next.promotion,
            });
        } catch {
            break;
        }
    }
}

export function getChess() {
    return chess;
}

export function getLearnerColor() {
    return learnerColor;
}

export function setLearnerColor(color) {
    learnerColor = color === "b" || color === BLACK ? BLACK : WHITE;
}

export function getStrictOpening() {
    return strictOpening;
}

export function setStrictOpening(on) {
    strictOpening = Boolean(on);
}

export function getOpeningLength() {
    return openingVerbose.length;
}

/**
 * Load a PGN main line used for the computer's opening moves (same start as trainer, or standard start).
 * When a ply exists here it overrides the trainer PGN for that ply index.
 * @param {string} pgn
 * @returns {{ ok: true, moveCount: number } | { ok: false, error: string }}
 */
export function loadComputerOpeningPgn(pgn) {
    const tmp = new Chess();
    try {
        tmp.loadPgn(pgn.trim(), { strict: false });
    } catch (e) {
        return { ok: false, error: String(e.message || e) };
    }
    computerOpeningVerbose = tmp.history({ verbose: true });
    playScheduledOpponentReplies();
    return { ok: true, moveCount: computerOpeningVerbose.length };
}

export function clearComputerOpening() {
    computerOpeningVerbose = [];
}

/**
 * @param {string} fen
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function loadFen(fen) {
    const v = validateFen(fen.trim());
    if (!v.ok) {
        return { ok: false, error: v.error ?? "Invalid FEN" };
    }
    try {
        chess.load(fen.trim());
    } catch (e) {
        return { ok: false, error: String(e.message || e) };
    }
    openingVerbose = [];
    computerOpeningVerbose = [];
    return { ok: true };
}

/**
 * Reset to standard start and clear opening data.
 */
export function resetEngine() {
    chess.reset();
    openingVerbose = [];
    computerOpeningVerbose = [];
}

/**
 * Parse PGN into a mainline, reset the game to the line's start FEN, and
 * auto-play any opening moves that are not the learner's.
 *
 * @param {string} pgn
 * @returns {{ ok: true, moveCount: number } | { ok: false, error: string }}
 */
export function loadPgnOpening(pgn) {
    const tmp = new Chess();
    try {
        tmp.loadPgn(pgn.trim(), { strict: false });
    } catch (e) {
        return { ok: false, error: String(e.message || e) };
    }

    const verbose = tmp.history({ verbose: true });
    const headers = tmp.getHeaders();
    const startFen =
        headers.FEN || headers.fen || new Chess().fen();

    try {
        chess.load(startFen);
    } catch (e) {
        return { ok: false, error: String(e.message || e) };
    }

    openingVerbose = verbose;
    computerOpeningVerbose = [];

    playScheduledOpponentReplies();

    return { ok: true, moveCount: verbose.length };
}

/**
 * @param {string} from
 * @param {string} to
 * @param {string} [promotionPiece] single letter q|r|b|n when promoting
 * @returns {{ ok: true } | { ok: false, reason: 'illegal' | 'line', expected?: string }}
 */
export function tryMoveUci(from, to, promotionPiece = "q") {
    const promotion = promotionForMove(from, to, promotionPiece);

    if (strictOpening && openingVerbose.length > 0) {
        const idx = chess.history().length;
        const expected = openingVerbose[idx];
        if (
            expected &&
            expected.color === chess.turn() &&
            expected.color === learnerColor
        ) {
            if (!movesEqualVerbose(expected, from, to, promotion)) {
                return { ok: false, reason: "line", expected: expected.san };
            }
        }
    }

    try {
        chess.move({ from, to, promotion });
    } catch {
        return { ok: false, reason: "illegal" };
    }

    const autoReply = strictOpening || computerOpeningVerbose.length > 0;
    if (autoReply) {
        playScheduledOpponentReplies();
    }

    return { ok: true };
}

/**
 * @returns {{ ok: true } | { ok: false }}
 */
export function undoLast() {
    if (chess.history().length === 0) {
        return { ok: false };
    }
    chess.undo();
    return { ok: true };
}

export function isInCheck() {
    return chess.inCheck();
}

export function isGameOver() {
    return chess.isGameOver();
}

export function turn() {
    return chess.turn();
}

export function getFen() {
    return chess.fen();
}

export function syncBoardTo(chessboard) {
    syncBoardFromChess(chess, chessboard);
    document.dispatchEvent(
        new CustomEvent("chessPositionChanged", {
            detail: { fen: chess.fen() },
        }),
    );
}
