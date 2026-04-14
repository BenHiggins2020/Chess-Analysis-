/**
 * Chessboard class just manages the UI state. 
 * 
 */

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
                const squareObj = new Square(file, rank);
                const squareName = squareObj.file + squareObj.rank;
                this.gameState.set(
                    squareName,
                    squareObj
                );
            }
        }
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
    constructor(file, rank) {
        this.TAG = "Square.js -> "

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
            console.log(this.TAG + `Square ${this.file}${this.rank} clicked. (${this.color}) Piece: ${this.piece}`);
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
            this.UI_ref.textContent = '';
            this.setPiece(this.piece);
        });
    }

    setPiece(piece) {
        if (piece === null || piece === 'empty' || !(piece instanceof Piece)) return;
        this.piece = piece;
        this.UI_ref.appendChild(piece.UI_ref);

        this.setupPieceUI();
    }


    setupPieceUI = () => {
        this.UI_ref.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow a drop
            e.dataTransfer.dropEffect = 'move';
        });

        this.UI_ref.addEventListener('drop', (e) => {
            console.log(this.TAG + "Drop event triggered on square: ", this.file, this.rank);
            e.preventDefault();
            const sourceCoords = e.dataTransfer.getData('text/plain');
            console.log(`Moving piece from ${sourceCoords} to ${this.file}${this.rank}`);

            // Here you would call a method in your Chessboard class to 
            // update the gameState Map and re-render the board.
        });
        // this.UI_ref.style.display = 'flex';
        // this.UI_ref.style.justifyContent = 'center';
        // this.UI_ref.style.alignItems = 'center';
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


