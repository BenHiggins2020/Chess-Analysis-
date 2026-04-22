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
        // this.enabled_state = this.UI_ref.style
        console.log(this.TAG + `Setting up piece UI for `);
        this.UI_ref.addEventListener('click', () => {


            console.log(this.TAG + `square clicked: ${this.position} `)
            // if (this.piece === null || this.piece === "empty") return

            // GameStateManager.getInstance().calculateMovesForPieceOnSquare(this)
            // GameStateManager.getInstance().setSelected(this)
        });

        // this.UI_ref.addEventListener('mouseover', () => {
        // this.UI_ref.style.opacity = '0.5';
        // this.UI_ref.style.transition = 'background-color 0.3s, opacity 0.3s';
        // });

        // this.UI_ref.addEventListener('mouseout', () => {
        // this.UI_ref.style.backgroundColor = '';
        // this.UI_ref.style.opacity = '1';

        // });
    }

    setPiece(piece) {
        console.warn(this.TAG + ` setPiece: ${piece.type} to square: ${this.position}`)

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
        console.warn(this.TAG + `Removing piece (${this.piece.type}) from ${this.file}${this.rank}`);

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
        let originalParent = null; // track the piece's original parent for restoration
        let cancelMove = false;

        piece.addEventListener('mousedown', (e) => {
            selectedPiece = piece;

            // Step 1: Capture the visual bounding rect BEFORE any DOM/style changes.
            // getBoundingClientRect() always returns the on-screen position regardless
            // of CSS transforms on ancestors, so this is correct for both orientations.
            const rect = selectedPiece.getBoundingClientRect();

            // Compute offset of the cursor relative to the piece's top-left visual corner.
            // This keeps the piece locked under the cursor while dragging.
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            // Step 2: Reparent the piece to document.body so it escapes the board's
            // rotate(180deg) transform (used when playing as black). Without this,
            // position:fixed would still be affected by the CSS transform on the parent,
            // causing the piece to appear offset below and to the right of the cursor.
            originalParent = selectedPiece.parentElement;
            document.body.appendChild(selectedPiece);

            // Step 3: Apply fixed positioning AFTER reparenting.
            selectedPiece.style.position = 'fixed';
            selectedPiece.style.zIndex = '1000';
            selectedPiece.style.pointerEvents = 'none';
            selectedPiece.style.margin = '0';
            selectedPiece.style.width = rect.width + 'px';
            selectedPiece.style.height = rect.height + 'px';
            selectedPiece.classList.add('dragging-now');

            const moveAt = (clientX, clientY) => {
                selectedPiece.style.left = (clientX - offsetX) + 'px';
                selectedPiece.style.top = (clientY - offsetY) + 'px';
            };

            // Position immediately under the cursor.
            moveAt(e.clientX, e.clientY);

            function onMouseMove(event) {
                if (cancelMove) {
                    cancelMove = false;
                    return;
                }
                moveAt(event.clientX, event.clientY);
            }

            function onRightClick(event) {
                if (selectedPiece !== null) {
                    event.preventDefault();
                    cancelMove = true;
                    // Restore piece to its original square.
                    if (originalParent) {
                        selectedPiece.style.position = '';
                        selectedPiece.style.zIndex = '';
                        selectedPiece.style.left = '';
                        selectedPiece.style.top = '';
                        selectedPiece.style.margin = '';
                        selectedPiece.style.width = '';
                        selectedPiece.style.height = '';
                        selectedPiece.style.pointerEvents = '';
                        selectedPiece.classList.remove('dragging-now');
                        originalParent.appendChild(selectedPiece);
                        originalParent = null;
                    }
                    selectedPiece = null;
                    document.removeEventListener('mousemove', onMouseMove);
                }
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('contextmenu', onRightClick);

            document.onmouseup = (event) => {
                document.removeEventListener('mousemove', onMouseMove);

                // Find what square is under the cursor BEFORE clearing fixed position.
                const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
                const square = elementBelow?.closest('.light-square, .dark-square');

                // Reset all drag styles.
                selectedPiece.style.position = '';
                selectedPiece.style.zIndex = '';
                selectedPiece.style.left = '';
                selectedPiece.style.top = '';
                selectedPiece.style.margin = '';
                selectedPiece.style.width = '';
                selectedPiece.style.height = '';
                selectedPiece.style.pointerEvents = '';
                selectedPiece.classList.remove('dragging-now');

                // Restore the piece to its original parent square before the move logic
                // runs, so the DOM is in a consistent state for setPiece/removePiece.
                if (originalParent) {
                    originalParent.appendChild(selectedPiece);
                    originalParent = null;
                }

                if (square && selectedPiece != null) {
                    const fromCoord = this.file + this.rank;
                    const toCoord = square.dataset.file + square.dataset.rank;

                    if (fromCoord !== toCoord) {
                        console.log(this.TAG + `Attempting move from ${fromCoord} to ${toCoord}`);
                        GameStateManager.getInstance().handleMove(fromCoord, toCoord);
                    }
                }

                selectedPiece = null;
                document.onmouseup = null;
            };
        });

        piece.ondragstart = () => false;

        // this.UI_ref.addEventListener('click', () => {
        //     console.log(this.TAG + `square clicked: ${this.position} `)
        //     if (this.piece === null || this.piece === "empty") return

        //     GameStateManager.getInstance().calculateMovesForPieceOnSquare(this)
        //     GameStateManager.getInstance().setSelected(this)
        // });
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