<script lang="ts">
  import type { Cell, CellState } from '$lib/game';

  let {
    board,
    width,
    height,
    mines,
    gameOver,
    won,
    flagCount,
    elapsed,
    onReveal,
    onFlag,
    onReset,
    difficultyLabel,
  }: {
    board: Cell[][];
    width: number;
    height: number;
    mines: number;
    gameOver: boolean;
    won: boolean;
    flagCount: number;
    elapsed: number;
    onReveal: (x: number, y: number) => void;
    onFlag: (x: number, y: number) => void;
    onReset: () => void;
    difficultyLabel: string;
  } = $props();

  const ADJ_COLORS: Record<number, string> = {
    1: '#6fb3d2',
    2: '#7ec87e',
    3: '#e07070',
    4: '#9b6ec8',
    5: '#c87e9b',
    6: '#6ec8c8',
    7: '#f0f0f0',
    8: '#aaaaaa',
  };

  function cellStyle(cell: Cell): string {
    if (cell.state === 'hidden') return '';
    if (cell.isMine) {
      return gameOver || won ? '#e03030' : '#e03030';
    }
    return 'transparent';
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function handleClick(x: number, y: number) {
    if (!gameOver && !won) onReveal(x, y);
  }

  function handleRightClick(e: MouseEvent, x: number, y: number) {
    e.preventDefault();
    if (!gameOver && !won) onFlag(x, y);
  }
</script>

<div class="game-container">
  <div class="hud">
    <div class="hud-item">
      <span class="hud-label">MINES</span>
      <span class="hud-value">{mines - flagCount}</span>
    </div>
    <button class="reset-btn" onclick={onReset}>
      {#if won}
        😌
      {:else if gameOver}
        💥
      {:else}
        🚢
      {/if}
    </button>
    <div class="hud-item">
      <span class="hud-label">TIME</span>
      <span class="hud-value">{formatTime(elapsed)}</span>
    </div>
  </div>

  <div class="mission-bar">
    <span class="mission-text">OPERATION: {difficultyLabel.toUpperCase()}</span>
  </div>

  <div
    class="board"
    style="--cols: {width}; --rows: {height};"
  >
    {#each board as row, y}
      {#each row as cell, x}
        <button
          class="cell"
          class:hidden={cell.state === 'hidden'}
          class:flagged={cell.state === 'flagged'}
          class:revealed={cell.state === 'revealed'}
          class:mine={cell.isMine && (cell.state === 'revealed' || gameOver)}
          class:misflagged={cell.state === 'flagged' && !cell.isMine && gameOver}
          style="background: {cellStyle(cell)};"
          onclick={() => handleClick(x, y)}
          oncontextmenu={(e) => handleRightClick(e, x, y)}
          aria-label="Cell {x},{y}"
        >
          {#if cell.state === 'flagged'}
            🚩
          {:else if cell.state === 'revealed' && cell.isMine}
            💥
          {:else if cell.state === 'revealed' && cell.adjacent > 0}
            <span style="color: {ADJ_COLORS[cell.adjacent] ?? '#888'}">
              {cell.adjacent}
            </span>
          {/if}
        </button>
      {/each}
    {/each}
  </div>

  {#if won || gameOver}
    <div class="overlay">
      <div class="overlay-card" class:won class:lost={gameOver && !won}>
        <p class="overlay-title">{won ? 'MISSION COMPLETE' : 'MINE DETONATED'}</p>
        <p class="overlay-sub">{won ? 'All mines successfully charted.' : 'Your fleet hit a mine.'}</p>
        <button class="overlay-btn" onclick={onReset}>
          {won ? 'NEW MISSION' : 'TRY AGAIN'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    min-height: 100vh;
    background: #0a0a0f;
    position: relative;
  }

  .hud {
    display: flex;
    align-items: center;
    gap: 2rem;
    background: #111827;
    border: 1px solid #1e2d4a;
    border-radius: 4px;
    padding: 0.6rem 1.5rem;
  }

  .hud-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .hud-label {
    font-size: 0.6rem;
    color: #4a6080;
    letter-spacing: 0.15em;
  }

  .hud-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: #f0a500;
    letter-spacing: 0.05em;
    font-variant-numeric: tabular-nums;
  }

  .reset-btn {
    background: #1a2840;
    border: 2px solid #3a6aaa;
    color: #f0a500;
    font-size: 1.5rem;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    font-family: inherit;
  }

  .reset-btn:hover {
    background: #2a3a60;
    transform: scale(1.1);
  }

  .mission-bar {
    width: 100%;
    max-width: calc(var(--cols) * 28px);
  }

  .mission-text {
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: #4a6080;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(var(--cols), 28px);
    grid-template-rows: repeat(var(--rows), 28px);
    gap: 1px;
    background: #0d0d14;
    border: 2px solid #1e2d4a;
    padding: 2px;
  }

  .cell {
    width: 28px;
    height: 28px;
    border: none;
    font-size: 0.85rem;
    font-weight: 700;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.1s;
    padding: 0;
  }

  .cell.hidden {
    background: linear-gradient(135deg, #2a3f6a 0%, #1a2840 100%);
    border: 1px solid #2a4a7f;
  }

  .cell.hidden:hover {
    background: linear-gradient(135deg, #3a5f8a 0%, #2a3870 100%);
  }

  .cell.revealed {
    background: #0d1520;
    border: 1px solid #151d2a;
    cursor: default;
  }

  .cell.flagged {
    background: linear-gradient(135deg, #2a3f6a 0%, #1a2840 100%);
    border: 1px solid #2a4a7f;
  }

  .cell.mine {
    background: #3a1010 !important;
    cursor: default;
  }

  .cell.misflagged {
    background: #3a1010 !important;
  }

  .cell.misflagged::after {
    content: '❌';
    font-size: 0.7rem;
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .overlay-card {
    background: #111827;
    border: 2px solid #1e2d4a;
    border-radius: 8px;
    padding: 2.5rem 3rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .overlay-card.won {
    border-color: #f0a500;
    box-shadow: 0 0 30px rgba(240, 165, 0, 0.3);
  }

  .overlay-card.lost {
    border-color: #e03030;
    box-shadow: 0 0 30px rgba(224, 48, 48, 0.3);
  }

  .overlay-title {
    font-size: 1.4rem;
    letter-spacing: 0.2em;
    color: #f0a500;
    margin: 0;
  }

  .overlay-sub {
    color: #7a8ba8;
    font-size: 0.85rem;
    margin: 0;
  }

  .overlay-btn {
    background: #f0a500;
    color: #0a0a0f;
    border: none;
    padding: 0.75rem 2rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    margin-top: 0.5rem;
  }

  .overlay-btn:hover {
    background: #ffc933;
  }
</style>