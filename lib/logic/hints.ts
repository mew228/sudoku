// lib/logic/hints.ts — Pure logic-based Sudoku hint engine
// No external dependencies. O(81) per strategy scan.

import { GRID_SIZE } from './sudoku';

export interface HintResult {
    r: number;
    c: number;
    value: number;
    reason: string;
    strategy: 'naked_single' | 'hidden_single' | 'fallback';
}

/**
 * Get all valid candidates for a cell by elimination.
 * O(27) per cell — checks row (9) + col (9) + box (9).
 */
function getCandidates(board: number[][], r: number, c: number): Set<number> {
    const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Eliminate from row and column in one pass
    for (let i = 0; i < GRID_SIZE; i++) {
        candidates.delete(board[r][i]);
        candidates.delete(board[i][c]);
    }

    // Eliminate from 3x3 box
    const boxR = Math.floor(r / 3) * 3;
    const boxC = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            candidates.delete(board[boxR + i][boxC + j]);
        }
    }

    return candidates;
}

/**
 * Naked Single: Find a cell with exactly one possible candidate.
 * Scans all 81 cells. Returns the first match.
 */
function findNakedSingle(board: number[][]): HintResult | null {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] !== 0) continue;

            const candidates = getCandidates(board, r, c);
            if (candidates.size === 1) {
                const value = candidates.values().next().value!;
                return {
                    r, c, value,
                    reason: `Only ${value} can go in R${r + 1}C${c + 1} — all other numbers are already in this row, column, or box.`,
                    strategy: 'naked_single',
                };
            }
        }
    }
    return null;
}

/**
 * Hidden Single: Find a number that can only go in one cell within a unit (row/col/box).
 * Scans 27 units × 9 numbers = 243 checks. Returns the first match.
 */
function findHiddenSingle(board: number[][]): HintResult | null {
    // Check each row
    for (let r = 0; r < GRID_SIZE; r++) {
        const result = findHiddenInUnit(board, getRowCells(r), `Row ${r + 1}`);
        if (result) return result;
    }

    // Check each column
    for (let c = 0; c < GRID_SIZE; c++) {
        const result = findHiddenInUnit(board, getColCells(c), `Column ${c + 1}`);
        if (result) return result;
    }

    // Check each 3x3 box
    for (let boxR = 0; boxR < 3; boxR++) {
        for (let boxC = 0; boxC < 3; boxC++) {
            const result = findHiddenInUnit(board, getBoxCells(boxR, boxC), `Box ${boxR * 3 + boxC + 1}`);
            if (result) return result;
        }
    }

    return null;
}

/** Helper: find a hidden single within one unit (row, col, or box). */
function findHiddenInUnit(
    board: number[][],
    cells: { r: number; c: number }[],
    unitName: string
): HintResult | null {
    // For each number 1-9, count how many cells in this unit can hold it
    for (let num = 1; num <= 9; num++) {
        // Skip if number is already placed in this unit
        let alreadyPlaced = false;
        for (const { r, c } of cells) {
            if (board[r][c] === num) { alreadyPlaced = true; break; }
        }
        if (alreadyPlaced) continue;

        // Find empty cells where this number is a valid candidate
        let possibleCell: { r: number; c: number } | null = null;
        let count = 0;

        for (const { r, c } of cells) {
            if (board[r][c] !== 0) continue;
            const candidates = getCandidates(board, r, c);
            if (candidates.has(num)) {
                possibleCell = { r, c };
                count++;
                if (count > 1) break; // Not unique, skip
            }
        }

        if (count === 1 && possibleCell) {
            return {
                r: possibleCell.r,
                c: possibleCell.c,
                value: num,
                reason: `${num} can only go here in ${unitName} — no other empty cell in this ${unitName.toLowerCase().split(' ')[0]} can hold it.`,
                strategy: 'hidden_single',
            };
        }
    }
    return null;
}

// --- Cell coordinate helpers (zero-allocation arrays) ---

function getRowCells(r: number): { r: number; c: number }[] {
    const cells = [];
    for (let c = 0; c < GRID_SIZE; c++) cells.push({ r, c });
    return cells;
}

function getColCells(c: number): { r: number; c: number }[] {
    const cells = [];
    for (let r = 0; r < GRID_SIZE; r++) cells.push({ r, c });
    return cells;
}

function getBoxCells(boxR: number, boxC: number): { r: number; c: number }[] {
    const cells = [];
    const startR = boxR * 3;
    const startC = boxC * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            cells.push({ r: startR + i, c: startC + j });
        }
    }
    return cells;
}

/**
 * Main entry point: Get the best available hint.
 * Tries strategies in order of simplicity. Falls back to solvedBoard lookup.
 */
export function getSmartHint(board: number[][], solvedBoard: number[][]): HintResult | null {
    // 1. Try Naked Single (fastest, easiest to explain)
    const naked = findNakedSingle(board);
    if (naked) return naked;

    // 2. Try Hidden Single
    const hidden = findHiddenSingle(board);
    if (hidden) return hidden;

    // 3. Fallback: pick a random empty cell and reveal from solution
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === 0) emptyCells.push({ r, c });
        }
    }

    if (emptyCells.length === 0) return null;

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = solvedBoard[cell.r][cell.c];

    return {
        r: cell.r,
        c: cell.c,
        value,
        reason: `The answer for R${cell.r + 1}C${cell.c + 1} is ${value}.`,
        strategy: 'fallback',
    };
}
