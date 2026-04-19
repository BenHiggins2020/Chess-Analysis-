// ─────────────────────────────────────────────
//  Stockfish.js helper
//  
//  Usage:
//    const sf = await createStockfish();
//    const result = await sf.analyse('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', 16);
//    console.log(result);
//    // { cp: -0.2, mate: null, bestMove: 'e7e5', depth: 16 }
//
//  cp       = centipawns from the SIDE-TO-MOVE's perspective (positive = good for them)
//  mate     = mate in N moves (null if no forced mate found)
//  bestMove = best move in UCI notation e.g. "e2e4", "g1f3", "e7e8q"
//  depth    = search depth Stockfish reached
// ─────────────────────────────────────────────

const SF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

export async function createStockfish() {
    // Fetch the engine JS as text, wrap in a Blob, create Worker from blob:// URL.
    // This is necessary when running from file:// — browsers block Workers
    // created directly from cross-origin URLs in that context.
    const code = await fetch(SF_CDN).then(r => r.text());
    const blob = new Blob([code], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    // Shared callback list — each pending analyse() call registers one
    const callbacks = [];
    let ready = false;

    worker.onmessage = e => {
        const line = typeof e.data === 'string' ? e.data : e.data?.toString() ?? '';
        if (line === 'readyok') ready = true;
        callbacks.forEach(cb => cb(line));
    };

    // Initialise the engine
    worker.postMessage('uci');
    worker.postMessage('isready');

    // Wait until Stockfish says it's ready
    await new Promise(resolve => {
        const check = setInterval(() => {
            if (ready) { clearInterval(check); resolve(); }
        }, 50);
    });

    return {

        // analyse(fen, depth) → Promise<{ cp, mate, bestMove, depth }>
        analyse(fen, depth = 16) {
            return new Promise((resolve, reject) => {
                let result = { cp: 0, mate: null, bestMove: null, depth: 0 };

                // Timeout so we never hang forever
                const timer = setTimeout(() => {
                    removeCb();
                    reject(new Error(`Stockfish timed out on: ${fen}`));
                }, 15000);

                const cb = line => {
                    // "info depth 12 score cp 34 ..."
                    const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
                    if (scoreMatch) {
                        if (scoreMatch[1] === 'cp') result.cp = parseInt(scoreMatch[2]) / 100;
                        if (scoreMatch[1] === 'mate') result.mate = parseInt(scoreMatch[2]);
                    }

                    // "info depth 16 ..."
                    const depthMatch = line.match(/\bdepth (\d+)/);
                    if (depthMatch) result.depth = parseInt(depthMatch[1]);

                    // "bestmove e2e4 ponder e7e5"  ← this line means Stockfish is done
                    if (line.startsWith('bestmove')) {
                        const bm = line.split(' ')[1];
                        result.bestMove = (bm && bm !== '(none)') ? bm : null;
                        clearTimeout(timer);
                        removeCb();
                        resolve(result);
                    }
                };

                const removeCb = () => {
                    const idx = callbacks.indexOf(cb);
                    if (idx !== -1) callbacks.splice(idx, 1);
                };

                callbacks.push(cb);

                // Stop any previous search, then start new one
                worker.postMessage('stop');
                worker.postMessage(`position fen ${fen}`);
                worker.postMessage(`go depth ${depth}`);
            });
        },

        // Free the worker when you're done with it
        destroy() {
            worker.postMessage('quit');
            worker.terminate();
        }
    };
}

async function analyzePosition(fen, depth = 16) {
    const stockfish = await createStockfish();
    try {
        return await stockfish.analyse(fen, depth);
    } catch (e) {
        console.error('Error analyzing position:', e);
        return null;
    }
}