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
  { label: 'Persian Gulf', width: 14, height: 14, mines: 8 },
  { label: 'Gulf of Oman', width: 18, height: 18, mines: 14 },
  { label: 'Strait of Hormuz', width: 24, height: 20, mines: 18 },
  { label: 'Custom', width: 0, height: 0, mines: 0 },
];

export function generateTerrain(width: number, height: number, difficulty: string): Terrain[][] {
  const terrain: Terrain[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 'water' as Terrain)
  );

  if (height < 6) return terrain;

  // Draw a land region on the grid given row ranges for each column
  function blit(coastlineFn: (x: number) => [number, number]) {
    for (let x = 0; x < width; x++) {
      const [start, end] = coastlineFn(x);
      for (let y = start; y <= end; y++) {
        if (y >= 0 && y < height) terrain[y][x] = 'land';
      }
    }
  }

  function island(x: number, y: number, w: number, h: number) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        if (y + dy < height && x + dx < width) terrain[y + dy][x + dx] = 'land';
  }

  // Three distinct maps
  if (difficulty === 'Persian Gulf') {
    // Persian Gulf — wide body of water, Arabian Peninsula takes bottom ~40%
    // Iran (north coast, fills to top edge)
    blit(x => {
      const j = Math.floor(Math.sin(x * 0.5) * 1.5 + 1.5);
      return [0, 2 + j];
    });
    // Saudi/Arabian Peninsula (southern portion)
    for (let x = 0; x < width; x++) {
      const baseY = Math.floor(height * 0.65);
      for (let y = baseY; y < height; y++) terrain[y][x] = 'land';
    }
    // Qatar peninsula (protrudes north from Saudi coast, center-right)
    blit(x => {
      const mid = Math.floor(width * 0.55);
      if (Math.abs(x - mid) <= 1) return [Math.floor(height * 0.50), Math.floor(height * 0.64)];
      if (Math.abs(x - mid) === 2) return [Math.floor(height * 0.55), Math.floor(height * 0.64)];
      return [height, -1];
    });
    // Bahrain island
    island(Math.floor(width * 0.30), Math.floor(height * 0.58), 1, 1);
  } else if (difficulty === 'Strait of Hormuz') {
    // Strait of Hormuz — narrow channel, Iran north, Musandam (Oman) south
    // Iran (north coast, fills to top)
    blit(x => {
      const j = Math.floor(Math.sin(x * 0.7) * 1.5 + 1.5);
      return [0, 3 + j];
    });
    // Musandam Peninsula, Oman — protrudes from south about 1/3 from left
    // Narrow land jutting into the strait from the south
    blit(x => {
      const musandamStart = Math.floor(width * 0.25);
      const musandamEnd = Math.floor(width * 0.55);
      if (x < musandamStart - 2) return [Math.floor(height * 0.70), height - 1];
      if (x < musandamStart) return [Math.floor(height * 0.65), height - 1];
      if (x <= musandamEnd) {
        // Musandam tip juts up to create the narrow strait
        const tipHeight = Math.floor(height * 0.45) + Math.floor(Math.sin((x - musandamStart) * 0.5) * 1);
        return [Math.max(5, tipHeight), height - 1];
      }
      // UAE/Oman south coast
      return [Math.floor(height * 0.72), height - 1];
    });
    // Islands in the strait
    island(Math.floor(width * 0.58), 5, 1, 1);  // Hormuz Island
    island(Math.floor(width * 0.42), 6, 1, 1);  // Larak Island
    island(Math.floor(width * 0.35), 4, 2, 1);  // Qeshm
    // Greater & Lesser Tunb
    island(Math.floor(width * 0.30), Math.floor(height * 0.52), 1, 1);
    island(Math.floor(width * 0.68), Math.floor(height * 0.50), 1, 1);
  } else if (difficulty === 'Gulf of Oman') {
    // Gulf of Oman — open water, Iran north, Oman south
    // Iran (north coast)
    blit(x => {
      const j = Math.floor(Math.sin(x * 0.4) * 2 + 2);
      return [0, 4 + j];
    });
    // Oman coast (south)
    for (let x = 0; x < width; x++) {
      const baseY = Math.floor(height * 0.75);
      for (let y = baseY; y < height; y++) terrain[y][x] = 'land';
    }
    // Jabal Akhdar mountain extension
    blit(x => {
      if (x < Math.floor(width * 0.3)) return [height, -1];
      const j = Math.floor(Math.sin(x * 0.3) * 1);
      return [Math.floor(height * 0.68) - j, Math.floor(height * 0.74)];
    });
    // Muscat peninsula
    island(Math.floor(width * 0.75), Math.floor(height * 0.62), 2, 2);
  } else {
    // Default / Custom — generic map
    blit(x => {
      const j = Math.floor(Math.sin(x * 0.6) * 1.5 + 1.5);
      return [0, 3 + j];
    });
    for (let x = 0; x < width; x++) {
      const baseY = Math.floor(height * 0.80);
      for (let y = baseY; y < height; y++) terrain[y][x] = 'land';
    }
  }

  return terrain;
}

export function createBoard(width: number, height: number, mines: number, difficultyLabel?: string): Cell[][] {
  const t = generateTerrain(width, height, difficultyLabel ?? '');

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