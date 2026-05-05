export type CellState = 'hidden' | 'revealed' | 'flagged';

export type Terrain = 'water' | 'land';

export interface Cell {
  state: CellState;
  terrain: Terrain;
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

export function generateTerrain(width: number, height: number, difficulty: string): Terrain[][] {
  // Real geography of the Strait of Hormuz region
  // Persian Gulf to the west, Gulf of Oman to the east
  // Key features: Iranian coast (north), Oman coast (south), UAE coast (southwest)
  const terrain: Terrain[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 'water' as Terrain)
  );

  if (height < 6) return terrain;

  // Iran coastline — northern edge with coves/indentations
  const iranY = Math.max(1, Math.floor(height * 0.12));
  for (let x = 0; x < width; x++) {
    const jitter = Math.floor((Math.sin(x * 0.6 + width * 0.3) + 1) * 1.5);
    const y = Math.min(iranY + jitter, height - 2);
    terrain[y][x] = 'land';
    // Occasional inland extension (mountains/jazireh)
    if ((x % 7 === 0 || x % 11 === 3) && y + 1 < height) {
      terrain[y + 1][x] = 'land';
    }
  }

  // Oman/Ras Al Hadd — southern coast, eastern portion
  const omanBaseY = Math.max(height - 4, Math.floor(height * 0.82));
  for (let x = Math.floor(width * 0.55); x < width; x++) {
    const jitter = Math.floor((Math.sin(x * 0.5 + 1) + 1) * 1.2);
    const y = Math.max(omanBaseY - jitter, 1);
    terrain[y][x] = 'land';
    // Omani mountains extending inland
    if (x % 9 === 0 && y > 1) {
      terrain[y - 1][x] = 'land';
    }
  }

  // UAE coast — southwestern portion, southern edge
  for (let x = 0; x < Math.floor(width * 0.45); x++) {
    const jitter = Math.floor((Math.sin(x * 0.4) + 1) * 1.5);
    const y = Math.max(omanBaseY - jitter, 1);
    terrain[y][x] = 'land';
    if (x % 6 === 0 && y > 1) {
      terrain[y - 1][x] = 'land';
    }
  }

  // Islands — Qeshm (near strait entrance), Greater Tunb, Lesser Tunb, Sirri
  const islands: [number, number, number, number][] = [
    [Math.floor(width * 0.38), Math.floor(height * 0.38), 3, 2],  // Qeshm
    [Math.floor(width * 0.52), Math.floor(height * 0.45), 2, 1],   // Greater Tunb
    [Math.floor(width * 0.55), Math.floor(height * 0.42), 1, 1],  // Lesser Tunb
    [Math.floor(width * 0.68), Math.floor(height * 0.35), 1, 1],  // Sirri
  ];

  for (const [ix, iy, iw, ih] of islands) {
    for (let dy = 0; dy < ih && iy + dy < height; dy++) {
      for (let dx = 0; dx < iw && ix + dx < width; dx++) {
        if (ix + dx >= 0 && iy + dy >= 0) {
          terrain[iy + dy][ix + dx] = 'land';
        }
      }
    }
  }

  return terrain;
}

export function createBoard(width: number, height: number, mines: number, terrain?: Terrain[][]): Cell[][] {
  const t = terrain ?? generateTerrain(width, height, '');

  const board: Cell[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      state: 'hidden' as CellState,
      terrain: t[y][x],
      isMine: false,
      adjacent: 0,
    }))
  );

  // Place mines only on water
  let placed = 0;
  while (placed < mines) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (!board[y][x].isMine && board[y][x].terrain === 'water') {
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
    // Don't auto-reveal land cells via flood fill — they get revealed on explicit click
    if (cell.terrain === 'land') continue;
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