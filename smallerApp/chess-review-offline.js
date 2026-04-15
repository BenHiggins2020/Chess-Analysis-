/**
 * Chessboard class just manages the UI state. 
 * 
 */

import { handlePawnMove } from "./pawnMoveHandler.js";

const GLYPHS = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

export class Chessboard {

    // 8 files, 8 ranks
    constructor() {
        this.TAG = "Chessboard.js -> "
        this.gameState = new Map(); // gameState map is used to access each square's state (piece, color, etc.) efficiently by its coordinate (e.g. 'e4').

        this.generateChessboard();
        this.setPieces();
    }

    generateChessboard = () => {
        console.log(this.TAG + "Generating chessboard...");
        // const chessboard = document.getElementById('chessboard-container');
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
        for (let rank of ranks) {
            for (let file of files) {
                const squareObj = new Square(file, rank, this);
                const squareName = squareObj.file + squareObj.rank;
                this.gameState.set(
                    squareName,
                    squareObj
                );
            }
        }
    }

    handleMove = (fromCoord, toCoord) => {
        console.log(this.TAG + `Moving piece from ${fromCoord} to ${toCoord}`);
        const fromSquare = this.gameState.get(fromCoord);
        const toSquare = this.gameState.get(toCoord);

        if (!fromSquare || !toSquare) {
            console.error(this.TAG + `Invalid move from ${fromSquare} to ${toSquare}`);
            return;
        }

        const piece = fromSquare.piece;

        if (piece.canMoveTo(fromSquare, toSquare, this)) {
            // Move the piece
            toSquare.setPiece(piece);
            fromSquare.removePiece();
        } else {
            console.error(this.TAG + `Invalid move for piece ${piece.type} from ${fromCoord} to ${toCoord}`);
        }

        if (piece === 'empty' || piece === null) {
            console.error(this.TAG + `No piece at ${fromSquare} to move.`);
            return;
        }

        fromSquare.render();
        toSquare.render();

    }

    setPieces = () => {
        if (this.gameState.size === 0) {
            console.error(this.TAG + "Game state is empty. Cannot set pieces.");
            return;
        }

        // Set Pawns: Rank 2
        let rank = 2;
        for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = new Piece('P', 'w');
            const square = this.gameState.get(`${file}${rank}`);
            square.setPiece(piece);
        }

        rank = 7;
        for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = new Piece('p', 'b');
            const square = this.gameState.get(`${file}${rank}`);
            square.setPiece(piece);
        }

        let rookPositions = ['a1', 'h1']
        for (let pos of rookPositions) {
            const piece = new Piece('R', 'w');
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        rookPositions = ['a8', 'h8']
        for (let pos of rookPositions) {
            const piece = new Piece('r', 'b');
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        let knightPositions = ['b1', 'g1']
        for (let pos of knightPositions) {
            const piece = new Piece('N', 'w');
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        knightPositions = ['b8', 'g8']
        for (let pos of knightPositions) {
            const piece = new Piece('n', 'b');
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        let bishopPositions = ['c1', 'f1']
        for (let pos of bishopPositions) {
            const piece = new Piece('B', 'w');
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }
        bishopPositions = ['c8', 'f8']
        for (let pos of bishopPositions) {
            const piece = new Piece('b', 'b');
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        let queenPosition = 'd1';
        let piece = new Piece('Q', 'w');
        let square = this.gameState.get(queenPosition);
        square.setPiece(piece);
        queenPosition = 'd8';

        piece = new Piece('q', 'b');
        square = this.gameState.get(queenPosition);
        square.setPiece(piece);

        let kingPosition = 'e1';
        piece = new Piece('K', 'w');
        square = this.gameState.get(kingPosition);
        square.setPiece(piece);

        kingPosition = 'e8';
        piece = new Piece('k', 'b');
        square = this.gameState.get(kingPosition);
        square.setPiece(piece);

        // Now we need to place this piece on the correct square based on its type and color.
        // For example, for white pieces:
        // - Pawns (P) go on rank 2 (a2, b2, c2, d2, e2, f2, g2, h2)
        // - Rooks (R) go on a1 and h1
        // - Knights (N) go on b1 and g1
        // - Bishops (B) go on c1 and f1
        // - Queen (Q) goes on d1
        // - King (K) goes on e1
        // For black pieces, it's similar but on ranks 7 and 8.
    };
}

/**
 * Square class represents each square on the chessboard, holding information about its file, rank, piece, and color.
 */
export class Square {
    constructor(file, rank, chessboard) {
        this.TAG = "Square.js -> "
        this.chessboard = chessboard;
        this.file = file;
        this.rank = rank;
        this.piece = 'empty'; // e.g. 'wP', 'bK', etc. will be a string
        this.color = this.createColorType(file, rank);

        this.UI_ref = document.createElement('div');
        this.UI_ref.dataset.file = file.toString();
        this.UI_ref.dataset.rank = rank.toString();
        this.UI_ref.classList.add(`square`);

        this.UI_ref.classList.add(`${this.color}-square`);
        this.setupUI();
    }

    createColorType(file, rank) {
        let color = 'default';
        switch (rank.toString()) {
            // For odd ranks, the color starts with 'dark' and alternates with each file.
            case "1":

            case "3":
            case "5":
            case "7":
                switch (file.toString()) {
                    case "a":
                    case "c":
                    case "e":
                    case "g":
                        color = 'dark';
                        break;
                    case "b":
                    case "d":
                    case "f":
                    case "h":
                        color = 'light';
                        break;
                }
                break;

            // For even ranks, the color starts with 'light' and alternates with each file.
            case "2":
            case "4":
            case "6":
            case "8":
                switch (file.toString()) {
                    case "a":
                    case "c":
                    case "e":
                    case "g":
                        color = 'light';
                        break;
                    case "b":
                    case "d":
                    case "f":
                    case "h":
                        color = 'dark';
                        break;
                }

            default:
                console.error(this.TAG + `Invalid rank: ${rank}`);
                break;


        }
        return color;
    }

    setupUI() {
        this.enabled_state = this.UI_ref.style
        this.UI_ref.addEventListener('click', () => {

            console.log(
                this.TAG + `Square ${this.file}${this.rank} clicked. (${this.color}) Piece: ${this.piece}`
            );
        })

        this.UI_ref.addEventListener('mouseover', () => {
            // this.UI_ref.style.backgroundColor = 'red';
            this.UI_ref.style.opacity = '0.5';
            this.UI_ref.style.transition = 'background-color 0.3s, opacity 0.3s';
            // this.UI_ref.textContent = `${this.file}${this.rank}`;
        });

        this.UI_ref.addEventListener('mouseout', () => {
            this.UI_ref.style.backgroundColor = '';
            this.UI_ref.style.opacity = '1';
            // this.UI_ref.textContent = '';
            // this.setPiece(this.piece);
        });
    }

    setPiece(piece) {

        if (piece === null || piece === 'empty' || !(piece instanceof Piece)) return;
        this.piece = piece;

        //Check to make sure square only has one child element. If there is already a piece on the square, remove it before adding the new piece.
        if (this.UI_ref.childElementCount > 0) {
            console.warn(this.TAG + `Square ${this.file}${this.rank} already has a piece. Removing existing piece before setting new one.`);
            this.UI_ref.removeChild(this.UI_ref.childNodes[0]);
        }

        this.UI_ref.appendChild(piece.UI_ref);

        console.log(`
            ${this.TAG} Childrend for square ${this.file}${this.rank}: ${this.UI_ref.childElementCount}`
        );

        this.setupPieceUI();
    }

    removePiece() {
        console.warn(this.TAG + `Removing piece from ${this.file}${this.rank}`);

        if (this.piece === null || this.piece === 'empty') {
            console.warn(this.TAG + `No piece to remove from ${this.file}${this.rank}`);
            return;
        };

        this.UI_ref.removeChild(this.piece.UI_ref);
        this.piece = 'empty';

        console.log(this.TAG + `Piece removed. Current child count: ${this.UI_ref.childElementCount}`);

        this.UI_ref.childElementCount
    }

    setupPieceUI = () => {
        const piece = this.piece.UI_ref;
        let selectedPiece = null;

        piece.addEventListener('mousedown', (e) => {
            console.log(this.TAG + "Mouse down event: ", e);

            // 1. Make piece ignore mouse so we can detect the square underneath
            piece.style.pointerEvents = 'none';
            piece.style.position = 'fixed';
            piece.style.zIndex = '1000';
            piece.classList.add('dragging-now');

            // Capture initial offset so piece doesn't "jump" center
            const shiftX = piece.offsetWidth / 2;
            const shiftY = piece.offsetHeight / 2;

            const moveAt = (clientX, clientY) => {
                piece.style.left = clientX - shiftX + 'px';
                piece.style.top = clientY - shiftY + 'px';
            };

            // Move it immediately to current cursor
            moveAt(e.clientX, e.clientY);

            function onMouseMove(event) {
                moveAt(event.clientX, event.clientY);
            }

            document.addEventListener('mousemove', onMouseMove);

            // Use document for mouseup so it triggers even if we release 
            // the mouse slightly outside the piece boundaries
            document.onmouseup = (event) => {
                console.log(this.TAG + "Mouse-up event: ", event);
                document.removeEventListener('mousemove', onMouseMove);

                // 2. IMPORTANT: Re-enable pointer events so it can be grabbed again
                piece.style.pointerEvents = 'auto';
                piece.style.position = '';
                piece.style.zIndex = '';
                piece.classList.remove('dragging-now');

                // 3. Find what is underneath the cursor
                const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
                const square = elementBelow?.closest('.light-square, .dark-square');

                if (square) {
                    console.log("Dropped on:", square.dataset.file, square.dataset.rank);

                    const fromCoord = this.file + this.rank;
                    const toCoord = square.dataset.file + square.dataset.rank;

                    this.chessboard.handleMove(fromCoord, toCoord);

                } else {
                    // Snap back if dropped in the void
                    piece.style.left = '';
                    piece.style.top = '';
                }

                document.onmouseup = null;
            };
        });

        piece.ondragstart = () => false;
    }

    render() {
        this.UI_ref.innerHTML = '';
        if (this.piece !== 'empty' && this.piece !== null) {
            this.UI_ref.childNodes[0] = this.piece.UI_ref;
        }
    }

}

/**
 * Generates a piece based on the letter set in the Glyph object. 
 */
export class Piece {
    constructor(type) {
        this.TAG = "Piece.js -> "
        this.type = type; // 'K', 'Q', 'R', 'B', 'N', 'P'

        if (!GLYPHS[type]) {
            console.error(`Invalid piece type: ${type}`);
        }

        this.UI_ref = document.createElement('div');
        this.UI_ref.textContent = GLYPHS[type];

        if (type.toString() === type.toString().toUpperCase()) {
            this.color = 'w';
            this.UI_ref.style = "piece-white"
            this.UI_ref.classList.add('piece');
            this.UI_ref.classList.add('piece-white');
            this.UI_ref.dataset.color = 'white';

        } else {
            this.color = 'b';
            this.UI_ref.classList.add('piece');
            this.UI_ref.classList.add('piece-black');
            this.UI_ref.dataset.color = 'black';
        }

        this.setupUI();
    }

    canMoveTo = (fromSquare, toSquare, chessboard) => {
        // Implement basic move validation logic here based on piece type and chess rules.
        // This is a complex topic, so you might want to start with simple rules and expand later.

        switch (this.type.toString()) {
            case 'P':
            case 'p':
                return handlePawnMove(fromSquare, toSquare, this, chessboard);
            case 'B':
            case 'b':
            // return handleBishopMove(fromSquare, toSquare);

            // Add cases for other piece types
        }

        return true; // Placeholder: allow all moves for now
    }





    setupUI() {
        this.UI_ref.draggable = true;


        this.UI_ref.addEventListener('dragstart', (e) => {
            // This makes the piece "stick" to the cursor
            console.log(this.TAG + "Drag start event triggered on piece: " + this.file + this.rank);
            e.dataTransfer.setData('text/plain', this.file + this.rank);

            // Optional: Customizing the drag ghost
            // e.dataTransfer.setDragImage(piece, 25, 25); 

            this.UI_ref.style.backgroundColor = "transparent"; // Visual cue that it's being moved
            this.UI_ref.style.opacity = ".9"; // Visual cue that it's being moved
        });

        this.UI_ref.addEventListener('dragend', (e) => {
            console.log(this.TAG + "Drag end event triggered on piece: " + this.file + this.rank);
            console.log(this.TAG + "Drag end event: ", e);
            // this.UI_ref.style.opacity = "1";
        });
        // this.UI_ref.addEventListener('dragstart', (e) => {
        //     e.dataTransfer.setData('text/plain', this.UI_ref.dataset.color);
        // });
        // this.UI_ref.addEventListener('dragover', (e) => {
        //     e.preventDefault(); // Necessary to allow a drop
        //     e.dataTransfer.dropEffect = 'move';
        // });

        // this.UI_ref.addEventListener('drop', (e) => {
        //     e.preventDefault();
        //     const sourceCoords = e.dataTransfer.getData('text/plain');
        //     console.log(`Moving piece from ${sourceCoords} to ${this.file}${this.rank}`);

        //     // Here you would call a method in your Chessboard class to 
        //     // update the gameState Map and re-render the board.
        // });
    }
}


