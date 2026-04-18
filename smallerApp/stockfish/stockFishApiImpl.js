import { createStockfish } from "./stockFishApi.js";

// Create once, reuse for multiple calls
const sf = await createStockfish();

// Starting position after 1.e4
const r = await sf.analyse(
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    16
);
console.log(r);
// { cp: -0.2, mate: null, bestMove: 'e7e5', depth: 16 }

// A position where white has a forced mate in 2
const r2 = await sf.analyse('6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0 1', 20);
console.log(r2.mate); // -1 (black can force mate in 1)

// Clean up when done
sf.destroy();


export function analyzeFen(fen, depth = 16) {
    if (!sf) {
        console.log("[StockfishImpl] Stockfish not initialized");
        return null;
    }
    console.log("[StockfishImpl] Analyzing depth ", depth, "FEN: ", fen);
    return sf.analyse(fen, depth);
}