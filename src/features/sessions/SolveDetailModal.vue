<script setup lang="ts">
import { formatSolveTime } from "../timer/timerFormat";
import type { Solve } from "./types";

defineProps<{
  solve: Solve | null;
}>();

const emit = defineEmits<{
  close: [];
  penalty: [solveId: string, penalty: Solve["penalty"]];
  comment: [solveId: string, comment: string];
  delete: [solveId: string];
}>();
</script>

<template>
  <div
    v-if="solve"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    @mousedown="emit('close')"
  >
    <section
      class="w-full max-w-[480px] rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
      @mousedown.stop
    >
      <h2 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
        Solve detail
      </h2>
      <div class="mt-3 font-mono text-5xl font-light text-zinc-100">
        {{ formatSolveTime(solve.ms, solve.penalty) }}
      </div>
      <div class="mt-2 font-mono text-xs text-zinc-500">
        {{ new Date(solve.timestamp).toLocaleString() }}
      </div>
      <p class="mt-4 rounded-md bg-black p-3 font-mono text-xs leading-relaxed text-zinc-300">
        {{ solve.scramble }}
      </p>
      <textarea
        :value="solve.comment ?? ''"
        placeholder="Notes"
        class="mt-4 min-h-20 w-full rounded-md border border-white/10 bg-black p-3 text-sm text-zinc-100 outline-none focus:border-indigo-400"
        @blur="emit('comment', solve.id, ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          :class="['modal-button', solve.penalty === 'OK' ? 'modal-button-on' : '']"
          @click="emit('penalty', solve.id, 'OK')"
        >
          OK
        </button>
        <button
          type="button"
          :class="['modal-button', solve.penalty === '+2' ? 'modal-button-on' : '']"
          @click="emit('penalty', solve.id, solve.penalty === '+2' ? 'OK' : '+2')"
        >
          +2
        </button>
        <button
          type="button"
          :class="['modal-button', solve.penalty === 'DNF' ? 'modal-button-on' : '']"
          @click="emit('penalty', solve.id, solve.penalty === 'DNF' ? 'OK' : 'DNF')"
        >
          DNF
        </button>
        <button type="button" class="modal-button text-red-300" @click="emit('delete', solve.id)">
          Delete
        </button>
      </div>
      <div class="mt-4 flex justify-end">
        <button
          type="button"
          class="rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-black"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </section>
  </div>
</template>
