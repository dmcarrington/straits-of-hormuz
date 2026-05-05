<script lang="ts">
  import { onMount } from 'svelte';
  import { DIFFICULTIES, type Difficulty } from '$lib/game';

  let { onStart }: { onStart: (d: Difficulty, cx: number, cy: number) => void } = $props();

  let selected = $state<Difficulty>(DIFFICULTIES[0]);
  let cw = $state(20);
  let ch = $state(16);
  let cm = $state(60);
  let showCustom = $state(false);

  function select(d: Difficulty) {
    selected = d;
    showCustom = d.label === 'Custom';
  }

  function start() {
    if (selected.label !== 'Custom') {
      onStart(selected, 0, 0);
    } else {
      const mines = Math.min(Math.max(cm, 1), cw * ch - 1);
      onStart({ label: 'Custom', width: cw, height: ch, mines }, 0, 0);
    }
  }
</script>

<div class="screen">
  <div class="title-block">
    <h1>STRAITS OF HOMRUZ</h1>
    <p class="subtitle">⚓ NAVY MINEFIELD COMMAND ⚓</p>
  </div>

  <div class="difficulty-panel">
    {#each DIFFICULTIES as d}
      <button
        class="diff-btn"
        class:selected={selected.label === d.label}
        onclick={() => select(d)}
      >
        <span class="diff-label">{d.label}</span>
        {#if d.label !== 'Custom'}
          <span class="diff-stats">{d.width}×{d.height} · {d.mines} mines</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if showCustom}
    <div class="custom-panel">
      <label>
        Width (5–50)
        <input type="number" bind:value={cw} min="5" max="50" />
      </label>
      <label>
        Height (5–30)
        <input type="number" bind:value={ch} min="5" max="30" />
      </label>
      <label>
        Mines
        <input type="number" bind:value={cm} min="1" max={cw * ch - 1} />
      </label>
    </div>
  {/if}

  <button class="start-btn" onclick={start}>
    DEPLOY MINEFIELD
  </button>

  <div class="legend">
    <span>⬛ = Unknown cell</span>
    <span>🔲 = Cleared</span>
    <span>💣 = Mine (game over)</span>
    <span>🚩 = Flagged</span>
  </div>
</div>

<style>
  .screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
    min-height: 100vh;
    background: #0a0a0f;
    color: #c8d3f0;
  }

  .title-block {
    text-align: center;
  }

  h1 {
    font-size: clamp(1.8rem, 5vw, 3rem);
    letter-spacing: 0.3em;
    color: #f0a500;
    text-shadow: 0 0 20px rgba(240, 165, 0, 0.5);
    margin: 0;
  }

  .subtitle {
    font-size: 0.8rem;
    letter-spacing: 0.2em;
    color: #7a8ba8;
    margin-top: 0.5rem;
  }

  .difficulty-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    max-width: 400px;
  }

  .diff-btn {
    background: #111827;
    border: 1px solid #1e2d4a;
    color: #8fa8c8;
    padding: 0.75rem 1.25rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.15s;
    font-family: inherit;
  }

  .diff-btn:hover {
    border-color: #2a4a7f;
    color: #c8d3f0;
  }

  .diff-btn.selected {
    background: #1a2840;
    border-color: #3a6aaa;
    color: #f0a500;
  }

  .diff-label {
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .diff-stats {
    font-size: 0.75rem;
    color: inherit;
    opacity: 0.6;
  }

  .custom-panel {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .custom-panel label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #7a8ba8;
  }

  .custom-panel input {
    background: #111827;
    border: 1px solid #1e2d4a;
    color: #f0a500;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    width: 80px;
    font-family: inherit;
    text-align: center;
  }

  .start-btn {
    background: #f0a500;
    color: #0a0a0f;
    border: none;
    padding: 0.9rem 2.5rem;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }

  .start-btn:hover {
    background: #ffc933;
    transform: scale(1.03);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.7rem;
    color: #4a5a7a;
    justify-content: center;
  }
</style>