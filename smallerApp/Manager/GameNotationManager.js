import { createPGNTracker } from "./Util/PGNWriter.js";


export class GameNotationManager {
    constructor() {
        this.TAG = "GameNotationManager: "
        this.tracker = createPGNTracker({ "White": "Player 1", "Black": "Player 2" });
    }


}