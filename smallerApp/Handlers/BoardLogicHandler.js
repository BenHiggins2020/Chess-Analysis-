import { GameStateManager } from "../GameStateManage.js";
import { Square } from "../Square.js";

export class BoardLogicHandler {
    static TAG = "BoardLogicHandler: ";
    constructor() {


    }

    static validFiles = ["a", "b", "c", "d", "e", "f", "g", "h"]
    static validRanks = ["1", "2", "3", "4", "5", "6", "7", "8"]

    static validateFile = (file) => {
        let convertedFile = null;
        if (file instanceof String) {
            return this.validFiles.includes(file);

        } else if (file instanceof Number) {
            convertedFile = String.fromCharCode(file);
            return this.validFiles.includes(convertedFile);

        } else {
            console.warn(this.TAG + `could not validate passed file. : ${file}, neither instance of string or number. ${file.instance} `);
        }
    }

    static validateRank(rankToCheck) {
        let rank = rankToCheck.toString();
        // console.log(this.TAG + ` Rank to check: `, rank);
        // console.log(this.TAG + ` ValidRanks: `, this.validRanks);

        if (!(rank instanceof String) || !(rank instanceof Char)) {
            rank.toString();
        }

        if (this.validRanks.includes(rank)) return true;
        return false;
    }

    /**
     * Takes a @param {Square} toSquare , and fetches the piece
     * 
     * @returns boolean whether piece is not null or undefined. 
     */
    static isSquareEmpty = (toSquare) => {
        if (toSquare === null) return false;
        return toSquare.piece === undefined || toSquare.piece === null;
    }


    /**
     * Before moving piece from one square to another, check if this move will result in a check against a king. 
     * 
     * @param {Square} fromSquare 
     * @param {Square} toSquare 
     */
    static movePrecheck(fromSquare, toSquare) {
        const movingPiece = fromSquare.piece;

        // discovered checks. 

        // from king position, check the verticals and diagonals for piece attacks. 

        // normal attacking checks, 
        // from the new position, would the piece attack the king? 
    }
}