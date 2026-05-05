<script lang="ts">
  import type { Cell } from '$lib/game';

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

  function cellBg(cell: Cell): string {
    if (cell.terrain === 'land') {
      // Desert land — revealed or hidden, both look like rocky terrain
      return '#b5a27a';
    }
    // Water
    if (cell.state === 'revealed') {
      return cell.isMine ? '#4a1010' : '#0d1a2e';
    }
    return ''; // use CSS class for hidden water
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
      {#if won}😌{:else if gameOver}💥{:else}🚢{/if}
    </button>
    <div class="hud-item">
      <span class="hud-label">TIME</span>
      <span class="hud-value">{formatTime(elapsed)}</span>
    </div>
  </div>

  <div class="mission-bar">
    <span class="mission-text">OPERATION: {difficultyLabel.toUpperCase()}</span>
    <span class="terrain-legend">
      <span class="legend-water"></span> Water
      <span class="legend-land"></span> Land
    </span>
  </div>

  <div
    class="board"
    style="--cols: {width}; --rows: {height};"
  >
    {#each board as row, y}
      {#each row as cell, x}
        <button
          class="cell"
          class:water={cell.terrain === 'water' && cell.state === 'hidden'}
          class:land={cell.terrain === 'land'}
          class:flagged={cell.state === 'flagged'}
          class:revealed={cell.state === 'revealed'}
          class:mine={cell.isMine && (cell.state === 'revealed' || gameOver)}
          class:misflagged={cell.state === 'flagged' && !cell.isMine && gameOver}
          style="background: {cellBg(cell)};"
          onclick={() => handleClick(x, y)}
          oncontextmenu={(e) => handleRightClick(e, x, y)}
          aria-label="Cell {x},{y} {cell.terrain}"
        >
          {#if cell.state === 'flagged'}
            🚩
          {:else if cell.state === 'revealed' && cell.isMine}
            💥
          {:else if cell.state === 'revealed' && cell.adjacent > 0 && cell.terrain === 'water'}
            <span style="color: {ADJ_COLORS[cell.adjacent] ?? '#888'}">{cell.adjacent}</span>
          {:else if cell.terrain === 'land' && cell.state === 'revealed'}
            <span class="land-text">◇</span>
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
        <button class="overlay-btn" onclick={onReset}>{won ? 'NEW MISSION' : 'TRY AGAIN'}</button>
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
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .mission-text {
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: #4a6080;
  }

  .terrain-legend {
    display: flex;
    gap: 0.75rem;
    font-size: 0.6rem;
    color: #4a6080;
    align-items: center;
  }

  .legend-water,
  .legend-land {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .legend-water {
    background: linear-gradient(135deg, #2a3f6a 0%, #1a2840 100%);
    border: 1px solid #2a4a7f;
  }

  .legend-land {
    background: #b5a27a;
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

  /* Water — hidden */
  .cell.water {
    background: linear-gradient(135deg, #1e3560 0%, #132240 100%);
    border: 1px solid #2a4a8f;
  }

  .cell.water:hover {
    background: linear-gradient(135deg, #2a4f80 0%, #1a3060 100%);
  }

  /* Land */
  .cell.land {
    background: #b5a27a;
    border: 1px solid #9a8860;
    cursor: default;
  }

  .cell.land:hover {
    background: #c4b488;
  }

  /* Water — revealed */
  .cell.revealed {
    border: 1px solid #151d2a;
    cursor: default;
  }

  .cell.flagged {
    background: linear-gradient(135deg, #1e3560 0%, #132240 100%) !important;
    border: 1px solid #2a4a8f !important;
  }

  .cell.mine {
    background: #4a1010 !important;
    cursor: default;
  }

  .cell.misflagged {
    background: #4a1010 !important;
  }

  .cell.misflagged::after {
    content: '❌';
    font-size: 0.65rem;
  }

  .land-text {
    color: #8a7458;
    font-size: 0.8rem;
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