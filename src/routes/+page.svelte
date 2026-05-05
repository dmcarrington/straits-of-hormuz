<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    createBoard,
    floodFill,
    revealAllMines,
    checkWin,
    getElapsed,
    DIFFICULTIES,
    type Difficulty,
    type Cell,
  } from '$lib/game';
  import Board from '$lib/components/Board.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let difficulty = $state<Difficulty>(DIFFICULTIES[0]);
  let board = $state<Cell[][]>([]);
  let gameOver = $state(false);
  let won = $state(false);
  let startTime = $state<number | null>(null);
  let elapsed = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  function start(d: Difficulty, _cx: number, _cy: number) {
    difficulty = d;
    board = createBoard(d.width, d.height, d.mines);
    gameOver = false;
    won = false;
    startTime = null;
    elapsed = 0;
    if (timer) clearInterval(timer);
  }

  function startTimer() {
    if (!timer) {
      timer = setInterval(() => {
        elapsed = getElapsed(startTime);
      }, 1000);
    }
  }

  function reveal(x: number, y: number) {
    const cell = board[y][x];
    if (cell.state !== 'hidden' || gameOver || won) return;

    if (!startTime) {
      startTime = Date.now();
      startTimer();
    }

    if (cell.isMine) {
      board = revealAllMines(board);
      gameOver = true;
      if (timer) clearInterval(timer);
      return;
    }

    board = floodFill(board, x, y);
    won = checkWin(board);
    if (won && timer) clearInterval(timer);
  }

  function flag(x: number, y: number) {
    if (gameOver || won) return;
    const cell = board[y][x];
    if (cell.state === 'revealed') return;
    if (!startTime) { startTime = Date.now(); startTimer(); }
    board[y][x].state = cell.state === 'flagged' ? 'hidden' : 'flagged';
    board = [...board];
  }

  function backToMenu() {
    if (timer) clearInterval(timer);
    board = [];
    gameOver = false;
    won = false;
    startTime = null;
    elapsed = 0;
    goto('/');
  }

  // React to URL param changes without full reload
  let currentDifficulty = '';
  onMount(() => {
    function checkUrl() {
      const params = new URLSearchParams(window.location.search);
      const label = params.get('difficulty') || '';
      if (label !== currentDifficulty) {
        currentDifficulty = label;
        const d = DIFFICULTIES.find((d) => d.label === label);
        if (d) start(d, 0, 0);
      }
    }
    checkUrl();
    const interval = setInterval(checkUrl, 200);
    return () => clearInterval(interval);
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });
</script>

<svelte:head>
  <title>Straits of Hormuz — Naval Minesweeper</title>
  <meta name="description" content="Naval minesweeper set in the Strait of Hormuz. Classic puzzle game with a military twist." />
</svelte:head>

{#if board.length === 0}
  <div class="menu-wrapper">
    <a href="/?difficulty=Persian+Gulf" class="diff-link">⚓ Persian Gulf</a>
    <a href="/?difficulty=Gulf+of+Oman" class="diff-link">🌊 Gulf of Oman</a>
    <a href="/?difficulty=Strait+of+Hormuz" class="diff-link">🛢️ Strait of Hormuz</a>
  </div>
{:else}
  <Board
    {board}
    width={difficulty.width}
    height={difficulty.height}
    mines={difficulty.mines}
    {gameOver}
    {won}
    flagCount={board.flat().filter((c) => c.state === 'flagged').length}
    {elapsed}
    onReveal={reveal}
    onFlag={flag}
    onReset={backToMenu}
    difficultyLabel={difficulty.label}
  />
  <div class="back-link">
    <button onclick={backToMenu}>↩ New Mission</button>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    background: #0a0a0f;
    font-family: 'Courier New', monospace;
  }

  .menu-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 2rem;
    min-height: 100vh;
    background: #0a0a0f;
    box-sizing: border-box;
  }

  .diff-link {
    display: block;
    background: #111827;
    border: 1px solid #1e2d4a;
    color: #8fa8c8;
    text-decoration: none;
    padding: 1rem 2rem;
    border-radius: 4px;
    font-size: 1rem;
    letter-spacing: 0.1em;
    transition: all 0.15s;
    min-width: 240px;
    text-align: center;
  }

  .diff-link:hover {
    border-color: #f0a500;
    color: #f0a500;
    background: #1a2840;
  }

  .back-link {
    position: fixed;
    top: 1rem;
    left: 1rem;
  }

  .back-link button {
    background: transparent;
    border: 1px solid #1e2d4a;
    color: #4a6080;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    transition: all 0.15s;
  }

  .back-link button:hover {
    border-color: #3a6aaa;
    color: #8fa8c8;
  }
</style>