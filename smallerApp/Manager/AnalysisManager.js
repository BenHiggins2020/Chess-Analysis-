export class AnalysisManager {
    constructor() {
        this.TAG = "AnalysisManager: "
        this.stockfishLines = 4; // default lines for
        this.eval_before = 0;
        this.eval_after = 0;
    }

    setStockfishLines(lines) {
        this.stockfishLines = lines;
    }

    async setupStockfish() {
        this.stockfish = await createStockfish();
    }

    async analyse(fen) {
        const result = await this.stockfish.analyse(fen, this.stockfishLines);
        console.log(this.TAG + `Stockfish evaluation:`, result);
        return result;
    }
}