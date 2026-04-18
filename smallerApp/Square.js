import { Piece } from "./Piece.js";
import { handlePawnMove, calculateBishopPath, calculateKnightMoves, calculatePawnMoves, calculateKingMoves, calculateQueenMoves, calculateRookMoves, } from "./MoveHandler.js";
import { Chessboard } from "./Chessboard.js";
import { GameStateManager } from "./GameStateManage.js";

/**
 * Square class represents each square on the chessboard, 
 * holding information about its file, rank, piece, and color.
 * Manages the UI for each square, including piece placement and move highlighting.
 * Also handles user interactions like clicking and dragging pieces.
 */
export class Square {
    constructor(file, rank, chessboard) {
        this.TAG = "Square:  "
        this.chessboard = chessboard;
        this.file = file;
        this.rank = rank;
        this.position = file + rank; // e.g. 'e4'
        this.piece = null; // e.g. 'wP', 'bK', etc. will be a string
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

        this.UI_ref.addEventListener('mouseover', () => {
            this.UI_ref.style.opacity = '0.5';
            this.UI_ref.style.transition = 'background-color 0.3s, opacity 0.3s';
        });

        this.UI_ref.addEventListener('mouseout', () => {
            this.UI_ref.style.backgroundColor = '';
            this.UI_ref.style.opacity = '1';

        });
    }

    setPiece(piece) {
        // console.warn(this.TAG + ` setPiece: ${piece.type} to square: ${this.position}`)

        if (piece === null || piece === 'empty' || !(piece instanceof Piece)) {
            console.warn(this.TAG + `trying to set null piece. returning. `)
            return;
        }

        if (this.piece !== null) {
            // console.warn(this.TAG + ` other piece already exists on square. ${this.piece.type} updateing to -> ${piece.type}`);
        }

        this.piece = piece;

        this.UI_ref.replaceChildren(this.piece.UI_ref)
        // this.UI_ref.appendChild(piece.UI_ref);

        this.setupPieceUI();
    }

    removePiece() {
        // console.warn(this.TAG + `Removing piece (${this.piece.type}) from ${this.file}${this.rank}`);

        if (this.piece === null || this.piece === 'empty') {
            // console.warn(this.TAG + `No piece to remove from ${this.file}${this.rank}`);
            return;
        };

        if (this.UI_ref.childElementCount > 0) { // removes child. 
            this.UI_ref.removeChild(this.piece.UI_ref);
        } else {
            // console.log(this.TAG + `removing piece... but Child count is 0... `);
        }

        if (this.piece !== null) {
            this.piece = null
        }
    }

    setupPieceUI = () => {
        const piece = this.piece.UI_ref;
        let selectedPiece = null; // used for dragging 
        //going to use gamestatemanager for this 

        piece.addEventListener('mousedown', (e) => {
            // console.log(this.TAG + "Mouse-down event: ", e);

            // 1. Make piece ignore mouse so we can detect the square underneath
            selectedPiece = piece;
            selectedPiece.style.pointerEvents = 'none';
            selectedPiece.style.position = 'fixed';
            selectedPiece.style.zIndex = '1000';
            selectedPiece.classList.add('dragging-now');

            // Capture initial offset so piece doesn't "jump" center
            const shiftX = selectedPiece.offsetWidth / 2;
            const shiftY = selectedPiece.offsetHeight / 2;

            const moveAt = (clientX, clientY) => {
                selectedPiece.style.left = clientX - shiftX + 'px';
                selectedPiece.style.top = clientY - shiftY + 'px';
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
                // console.log(this.TAG + "Mouse-up event: ", event);
                // console.log(this.TAG + "Selected piece: ", selectedPiece);

                document.removeEventListener('mousemove', onMouseMove);

                // 2. IMPORTANT: Re-enable pointer events so it can be grabbed again
                selectedPiece.style.pointerEvents = 'auto';
                selectedPiece.style.position = '';
                selectedPiece.style.zIndex = '';
                selectedPiece.classList.remove('dragging-now');

                // 3. Find what is underneath the cursor
                const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
                const square = elementBelow?.closest('.light-square, .dark-square');

                if (square && selectedPiece != null) {
                    // console.log("Dropped on:", square.dataset.file, square.dataset.rank);

                    const fromCoord = this.file + this.rank;
                    const toCoord = square.dataset.file + square.dataset.rank;

                    this.chessboard.handleMove(fromCoord, toCoord);
                } else {
                    // Snap back if dropped in the void
                    selectedPiece.style.left = '';
                    selectedPiece.style.top = '';
                }
                selectedPiece = null;

                document.onmouseup = null;
            };
        });

        piece.ondragstart = () => false;

        this.UI_ref.addEventListener('click', () => {

            if (this.piece === null || this.piece === "empty") return

            console.log(this.TAG + `square clicked: ${this.position} w/piece: ${this.piece.type}`)
            GameStateManager.getInstance().calculateMovesForPieceOnSquare(this)
            GameStateManager.getInstance().setSelected(this)
        });
    }

    render() {
        this.UI_ref.innerHTML = '';
        this.hideMove()
        if (this.piece !== 'empty' && this.piece !== null) {
            if (this.UI_ref.childElementCount > 0) {
                // console.log(this.TAG + `1 or more elements found. removing. `);
                this.UI_ref.removeChild();
            }
            this.UI_ref.appendChild = (this.piece.UI_ref);
        }
    }

    showMove = () => {
        this.UI_ref.style.opacity = "0.5"
        if (this.piece === null || this.piece === "empty") {
        }
    }

    hideMove = () => {
        this.UI_ref.style.opacity = "1"
        this.UI_ref.backgroundColor = 'transparent'
        if (this.piece === null || this.piece === "empty") {
        }
    }

}