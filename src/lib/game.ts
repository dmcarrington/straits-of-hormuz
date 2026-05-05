export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  state: CellState;
  isMine: boolean;
  adjacent: number;
}

export interface GameState {
  board: Cell[][];
  width: number;
  height: number;
  mines: number;
  gameOver: boolean;
  won: boolean;
  startTime: number | null;
  flagCount: number;
}

export type Difficulty = {
  label: string;
  width: number;
  height: number;
  mines: number;
};

export const DIFFICULTIES: Difficulty[] = [
  { label: 'Persian Gulf', width: 10, height: 10, mines: 15 },
  { label: 'Gulf of Oman', width: 16, height: 16, mines: 40 },
  { label: 'Strait of Hormuz', width: 20, height: 16, mines: 60 },
  { label: 'Custom', width: 0, height: 0, mines: 0 },
];

export function createBoard(width: number, height: number, mines: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      state: 'hidden' as CellState,
      isMine: false,
      adjacent: 0,
    }))
  );

  // Place mines randomly
  let placed = 0;
  while (placed < mines) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (!board[y][x].isMine) {
      board[y][x].isMine = true;
      placed++;
    }
  }

  // Calculate adjacent counts
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!board[y][x].isMine) {
        board[y][x].adjacent = countAdjacentMines(board, x, y);
      }
    }
  }

  return board;
}

export function countAdjacentMines(board: Cell[][], x: number, y: number): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < board.length && nx >= 0 && nx < board[0].length && board[ny][nx].isMine) {
        count++;
      }
    }
  }
  return count;
}

export function floodFill(board: Cell[][], x: number, y: number): Cell[][] {
  board = board.map(row => row.map(cell => ({ ...cell })));
  const stack: [number, number][] = [[x, y]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const key = `${cx},${cy}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = board[cy][cx];
    if (cell.isMine || cell.state === 'revealed') continue;

    board[cy][cx].state = 'revealed';

    if (cell.adjacent === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (ny >= 0 && ny < board.length && nx >= 0 && nx < board[0].length) {
            stack.push([nx, ny]);
          }
        }
      }
    }
  }

  return board;
}

export function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map(row =>
    row.map(cell => (cell.isMine ? { ...cell, state: 'revealed' as CellState } : cell))
  );
}

export function checkWin(board: Cell[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && cell.state !== 'revealed') return false;
    }
  }
  return true;
}

export function getElapsed(startTime: number | null): number {
  if (!startTime) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}