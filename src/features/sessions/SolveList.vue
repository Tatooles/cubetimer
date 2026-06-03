<script setup lang="ts">
import { computed } from "vue";
import { formatSolveTime } from "../timer/timerFormat";
import { rollingStats } from "./solveStats";
import type { Solve } from "./types";

const props = defineProps<{
  solves: Solve[];
}>();

const emit = defineEmits<{
  open: [solve: Solve];
  penalty: [solveId: string, penalty: Solve["penalty"]];
  delete: [solveId: string];
}>();

const series = computed(() => rollingStats(props.solves));
const rows = computed(() => props.solves.map((solve, index) => ({ solve, index })).reverse());
</script>

<template>
  <div class="min-h-0 flex-1 overflow-y-auto pb-3">
    <button
      v-for="{ solve, index } in rows"
      :key="solve.id"
      type="button"
      class="group grid w-full grid-cols-[2.25rem_1fr_3.5rem_3.5rem] items-center px-5 py-1.5 text-left font-mono text-xs transition hover:bg-zinc-950 md:px-6"
      @click="emit('open', solve)"
    >
      <span class="text-zinc-700">{{ index + 1 }}</span>
      <span
        :class="solve.penalty === 'DNF' ? 'font-medium text-red-400' : 'font-medium text-zinc-100'"
      >
        {{ formatSolveTime(solve.ms, solve.penalty) }}
      </span>
      <span class="text-right text-[11px] text-zinc-500">
        {{
          series.ao5[index] == null
            ? "-"
            : Number.isFinite(series.ao5[index])
              ? formatSolveTime(series.ao5[index] as number)
              : "DNF"
        }}
      </span>
      <span class="text-right text-[11px] text-zinc-500">
        {{
          series.ao12[index] == null
            ? "-"
            : Number.isFinite(series.ao12[index])
              ? formatSolveTime(series.ao12[index] as number)
              : "DNF"
        }}
      </span>
      <span class="col-span-4 mt-1 hidden gap-1 group-hover:flex">
        <span
          role="button"
          tabindex="0"
          class="rounded border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-100"
          @click.stop="emit('penalty', solve.id, solve.penalty === '+2' ? 'OK' : '+2')"
        >
          +2
        </span>
        <span
          role="button"
          tabindex="0"
          class="rounded border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-100"
          @click.stop="emit('penalty', solve.id, solve.penalty === 'DNF' ? 'OK' : 'DNF')"
        >
          DNF
        </span>
        <span
          role="button"
          tabindex="0"
          class="rounded border border-white/10 px-2 py-0.5 text-[10px] text-red-400"
          @click.stop="emit('delete', solve.id)"
        >
          Delete
        </span>
      </span>
    </button>
  </div>
</template>
