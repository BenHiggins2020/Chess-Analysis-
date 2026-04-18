import { Square } from "./Square.js";
import { handlePawnMove, handleBishopMove, handleKnightMove, handleRookMoves, handleQueenMoves, handleKingMoves } from "./MoveHandler.js";
import { Chessboard } from "./Chessboard.js";
import { GameStateManager } from "./GameStateManage.js";



const GLYPHS = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};
/**
 * Generates a piece based on the letter set in the Glyph object. 
 * handle move calculation for each piece type. 
 */
export class Piece {
    constructor(type, chessboard) {
        this.TAG = "Piece: "
        this.type = type; // 'K', 'Q', 'R', 'B', 'N', 'P'
        this.isPinned = false;
        this.isPinning = false;
        this.chessboard
        if (!GLYPHS[type]) {
            console.error(`Invalid piece type: ${type}`);
        }

        this.UI_ref = document.createElement('div');
        this.UI_ref.textContent = GLYPHS[type];

        if (type.toString() === type.toString().toUpperCase()) {
            this.color = 'white';
            this.UI_ref.style = "piece-white"
            this.UI_ref.classList.add('piece');
            this.UI_ref.classList.add('piece-white');
            this.UI_ref.dataset.color = 'white';

        } else {
            this.color = 'black';
            this.UI_ref.classList.add('piece');
            this.UI_ref.classList.add('piece-black');
            this.UI_ref.dataset.color = 'black';
        }

        this.moves = [];
        this.setupUI();
    }

    clearMoves() {
        this.moves.forEach((square) => {
            // const square = this.chessboard.gameState.get(position)
            square.hideMoveDot();
        })
    }

    onSelected() {
        // console.log(`${this.TAG} onSelected(), moves = ${this.moves.length}`);
        this.moves.forEach((square) => {
            // console.log(this.TAG + `square is square? = ${(square instanceof Square)}`)

            // console.log(this.TAG + `showing move dot for square: ${square.position}`)
            square.showMove();
        })
    }

    onDeselected() {
        // console.log(`${this.TAG} onDeselected() `)
        this.moves.forEach((square) => {
            square.hideMove();
        })
    }

    canMoveTo = (fromSquare, toSquare, chessboard) => {
        // Implement basic move validation logic here based on piece type and chess rules.
        // This is a complex topic, so you might want to start with simple rules and expand later.

        // Does move check YOUR king?
        // Option 1. if this move is done, will your king be in check? 
        // remove piece from square, then check all the opposite team piece,
        // to see if your king's position is within their moves..

        // Option 2: Check for Pin?? 
        // When doing a move, by opposite team, if king and other piece are within the move,
        // set piece parameter to pinned and pinning, reset both on move, while pinning piece is there??? 


        // Check Threats:  
        //will this move threaten the opposite king?
        GameStateManager.getInstance().checkForThreats(fromSquare);

        switch (this.type.toString()) {
            case 'P':
            case 'p':
                return handlePawnMove(fromSquare, toSquare, this, chessboard);
            case 'B':
            case 'b':
                return handleBishopMove(fromSquare, toSquare);
            case 'N':
            case 'n':
                return handleKnightMove(fromSquare, toSquare);
            case 'R':
            case 'r':
                return handleRookMoves(fromSquare, toSquare);
            case 'Q':
            case 'q':
                return handleQueenMoves(fromSquare, toSquare);
            case 'K':
            case 'k':
                return handleKingMoves(fromSquare, toSquare);

            // Add cases for move piece types
        }

        // return true; // Placeholder: allow all moves for now
    }

    setupUI() {
        this.UI_ref.draggable = true;


        this.UI_ref.addEventListener('dragstart', (e) => {
            // This makes the piece "stick" to the cursor
            // console.log(this.TAG + "Drag start event triggered on piece: " + this.file + this.rank);
            e.dataTransfer.setData('text/plain', this.file + this.rank);

            // Optional: Customizing the drag ghost
            // e.dataTransfer.setDragImage(piece, 25, 25); 

            this.UI_ref.style.backgroundColor = "transparent"; // Visual cue that it's being moved
            this.UI_ref.style.opacity = ".9"; // Visual cue that it's being moved
        });

        this.UI_ref.addEventListener('dragend', (e) => {
            // console.log(this.TAG + "Drag end event triggered on piece: " + this.file + this.rank);
            // console.log(this.TAG + "Drag end event: ", e);
            // this.UI_ref.style.opacity = "1";
        });
    }
}