<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSolveTime } from "../timer/timerFormat";
import SolveList from "./SolveList.vue";
import { sessionStats } from "./solveStats";
import type { Session, Solve, StatKey } from "./types";

const newSessionValue = "__new_session__";
const statKeys: StatKey[] = ["single", "ao5", "ao12", "ao50", "ao100"];

const props = withDefaults(
  defineProps<{
    sessions: Session[];
    activeSessionId: string;
    disabled?: boolean;
    className?: string;
  }>(),
  {
    disabled: false,
    className: "",
  },
);

const emit = defineEmits<{
  sessionChange: [sessionId: string];
  newSession: [];
  clear: [];
  export: [];
  openSolve: [solve: Solve];
  penalty: [solveId: string, penalty: Solve["penalty"]];
  delete: [solveId: string];
}>();

const activeSession = computed(
  () => props.sessions.find((session) => session.id === props.activeSessionId) ?? props.sessions[0],
);
const stats = computed(() => sessionStats(activeSession.value.solves));

function changeSession(value: unknown) {
  if (typeof value !== "string") {
    return;
  }

  if (value === newSessionValue) {
    emit("newSession");
    return;
  }

  emit("sessionChange", value);
}

function statValue(value: number | null): string {
  if (value == null) {
    return "-";
  }

  return Number.isFinite(value) ? formatSolveTime(value) : "DNF";
}
</script>

<template>
  <aside :class="['flex min-h-0 flex-col border-white/[0.07] bg-[#0a0a0b]', className]">
    <div class="border-b border-white/[0.07] px-5 py-4 md:px-6">
      <div class="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
        Session
      </div>
      <Select
        :model-value="activeSessionId"
        :disabled="disabled"
        @update:model-value="changeSession"
      >
        <SelectTrigger
          data-global-shortcuts="ignore"
          class="session-select-trigger h-11 w-full border-white/15 bg-zinc-900/80 text-sm font-semibold text-zinc-100 shadow-[inset_0_1px_0_rgb(255_255_255_/_4%),0_0_0_1px_rgb(0_0_0_/_35%)] hover:border-white/25 hover:bg-zinc-800/70"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="session in sessions" :key="session.id" :value="session.id">
            {{ session.name }}
          </SelectItem>
          <SelectItem :value="newSessionValue">+ New session...</SelectItem>
        </SelectContent>
      </Select>
      <div class="mt-2 flex gap-4 font-mono text-[11px] text-zinc-600">
        <span
          ><b class="text-zinc-300">{{ stats.count }}</b> solves</span
        >
        <span>
          mean
          <b class="text-zinc-300">{{ stats.mean == null ? "-" : formatSolveTime(stats.mean) }}</b>
        </span>
      </div>
    </div>
    <div
      class="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 border-b border-white/[0.07] px-5 py-4 font-mono text-xs md:px-6"
    >
      <span class="text-[10px] uppercase tracking-[0.16em] text-zinc-700">Avg</span>
      <span class="text-right text-[10px] uppercase tracking-[0.16em] text-zinc-700">Now</span>
      <span class="text-right text-[10px] uppercase tracking-[0.16em] text-zinc-700">Best</span>
      <template v-for="key in statKeys" :key="key">
        <span class="text-zinc-500">{{ key }}</span>
        <span class="text-right text-zinc-100">{{ statValue(stats.current[key]) }}</span>
        <span class="text-right text-indigo-300">
          {{ stats.best[key] == null ? "-" : formatSolveTime(stats.best[key] as number) }}
        </span>
      </template>
    </div>
    <div
      class="grid grid-cols-[2.25rem_1fr_3.5rem_3.5rem] px-5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 md:px-6"
    >
      <span>#</span>
      <span>Time</span>
      <span class="text-right">ao5</span>
      <span class="text-right">ao12</span>
    </div>
    <SolveList
      :solves="activeSession.solves"
      @open="emit('openSolve', $event)"
      @penalty="(solveId, penalty) => emit('penalty', solveId, penalty)"
      @delete="emit('delete', $event)"
    />
    <div class="flex gap-2 border-t border-white/[0.07] px-5 py-3 md:px-6">
      <Button
        type="button"
        :disabled="disabled"
        variant="outline"
        class="sidebar-button h-auto"
        @click="emit('newSession')"
      >
        New
      </Button>
      <Button type="button" variant="outline" class="sidebar-button h-auto" @click="emit('export')">
        Export
      </Button>
      <Button
        type="button"
        :disabled="disabled"
        variant="outline"
        class="sidebar-button text-red-300"
        @click="emit('clear')"
      >
        Clear
      </Button>
    </div>
  </aside>
</template>
