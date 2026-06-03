<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import Histogram from "./features/analytics/Histogram.vue";
import ProgressChart from "./features/analytics/ProgressChart.vue";
import MobileNav from "./features/mobile/MobileNav.vue";
import MobileSheet from "./features/mobile/MobileSheet.vue";
import type { MobileSheetId } from "./features/mobile/types";
import EventSelector from "./features/scrambles/EventSelector.vue";
import ScrambleBar from "./features/scrambles/ScrambleBar.vue";
import ScrambleDraw from "./features/scrambles/ScrambleDraw.vue";
import { generateScramble } from "./features/scrambles/scrambleService";
import { applyScrambleResult } from "./features/scrambles/scrambleState";
import SettingsPanel from "./features/settings/SettingsPanel.vue";
import SessionSidebar from "./features/sessions/SessionSidebar.vue";
import SolveDetailModal from "./features/sessions/SolveDetailModal.vue";
import { downloadCsv, solvesToCsv } from "./features/sessions/csvExport";
import {
  APP_STORAGE_KEY,
  activeSession,
  createDemoAppState,
  defaultAppState,
  recordSolveInState,
  sanitizeState,
} from "./features/sessions/sessionStore";
import { sessionStats } from "./features/sessions/solveStats";
import type {
  AppState,
  Penalty,
  PuzzleEvent,
  Solve,
  TimerSettings,
} from "./features/sessions/types";
import TimerSurface from "./features/timer/TimerSurface.vue";
import { formatSolveTime } from "./features/timer/timerFormat";
import { useTimerController } from "./features/timer/useTimerController";
import { copyTextToClipboard } from "./shared/clipboard/copyTextToClipboard";
import { readJson, writeJson } from "./shared/storage/localStorageStore";

function updateSolveInState(state: AppState, solveId: string, patch: Partial<Solve>): AppState {
  return {
    ...state,
    sessions: state.sessions.map((session) => ({
      ...session,
      solves: session.solves.map((solve) =>
        solve.id === solveId ? { ...solve, ...patch } : solve,
      ),
    })),
  };
}

function deleteSolveInState(state: AppState, solveId: string): AppState {
  return {
    ...state,
    sessions: state.sessions.map((session) => ({
      ...session,
      solves: session.solves.filter((solve) => solve.id !== solveId),
    })),
  };
}

function initialAppState(): AppState {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("demo") === "1") {
    return createDemoAppState();
  }

  return sanitizeState(readJson(APP_STORAGE_KEY, defaultAppState()));
}

const state = ref<AppState>(initialAppState());
const scrambleError = ref<string | null>(null);
const scrambleLoading = ref(false);
const selectedSolveId = ref<string | null>(null);
const settingsOpen = ref(false);
const shortcutsOpen = ref(false);
const activeSheet = ref<MobileSheetId>(null);
const scrambleCopied = ref(false);
let scrambleRequestId = 0;

const session = computed(() => activeSession(state.value));
const stats = computed(() => sessionStats(session.value.solves));
const selectedSolve = computed(
  () => session.value.solves.find((solve) => solve.id === selectedSolveId.value) ?? null,
);
const bests = computed(() =>
  (["single", "ao5", "ao12", "ao50", "ao100"] as const).map((key) => ({
    label: key,
    value: stats.value.best[key] == null ? "-" : formatSolveTime(stats.value.best[key]),
  })),
);
const densityClass = computed(() =>
  state.value.settings.density === "compact"
    ? "md:grid-cols-[264px_1fr_296px]"
    : "md:grid-cols-[296px_1fr_332px]",
);

function setState(updater: (current: AppState) => AppState) {
  state.value = updater(state.value);
}

watch(
  state,
  (current) => {
    writeJson(APP_STORAGE_KEY, current);
  },
  { deep: true },
);

watch(scrambleCopied, (copied) => {
  if (!copied) {
    return;
  }

  window.setTimeout(() => {
    scrambleCopied.value = false;
  }, 1_500);
});

async function requestScramble(eventId: PuzzleEvent) {
  const requestId = scrambleRequestId + 1;
  scrambleRequestId = requestId;

  scrambleLoading.value = true;
  scrambleError.value = null;
  const result = await generateScramble(eventId);

  if (requestId !== scrambleRequestId) {
    return;
  }

  scrambleLoading.value = false;
  scrambleError.value = result.error ?? null;
  setState((current) => applyScrambleResult(current, result));
}

function recordSolve(ms: number) {
  const currentScramble = state.value.currentScramble;
  const eventId = state.value.eventId;
  setState((current) => recordSolveInState(current, ms));
  if (currentScramble.trim()) {
    void requestScramble(eventId);
  }
}

const timer = useTimerController(recordSolve);
const timerStage = computed(() => timer.stage.value);
const timerElapsedMs = computed(() => timer.elapsedMs.value);
const timerInputEnabled = computed(
  () => state.value.currentScramble.trim().length > 0 && !scrambleLoading.value,
);
const timerLocked = computed(() => timerStage.value === "running");

function setEvent(eventId: PuzzleEvent) {
  if (timerLocked.value) {
    return;
  }

  setState((current) => ({ ...current, eventId }));
  void requestScramble(eventId);
}

async function copyScramble() {
  const scramble = state.value.currentScramble.trim();
  if (!scramble) {
    return;
  }

  scrambleCopied.value = await copyTextToClipboard(scramble);
}

function toggleLastPenalty(penalty: Penalty) {
  setState((current) => {
    const currentSession = activeSession(current);
    const last = currentSession.solves[currentSession.solves.length - 1];
    if (!last) {
      return current;
    }

    const nextPenalty = last.penalty === penalty ? "OK" : penalty;
    return updateSolveInState(current, last.id, { penalty: nextPenalty });
  });
}

function updatePenalty(solveId: string, penalty: Penalty) {
  setState((current) => updateSolveInState(current, solveId, { penalty }));
}

function deleteSolve(solveId: string) {
  setState((current) => deleteSolveInState(current, solveId));
  selectedSolveId.value = null;
}

function updateComment(solveId: string, comment: string) {
  setState((current) => updateSolveInState(current, solveId, { comment }));
}

function createSession() {
  if (timerLocked.value) {
    return;
  }

  const name = window.prompt("Session name", "New session");
  if (!name) {
    return;
  }

  const id = `session-${Date.now()}`;
  setState((current) => ({
    ...current,
    selectedSessionId: id,
    sessions: [...current.sessions, { id, name, solves: [] }],
  }));
}

function selectSession(sessionId: string) {
  if (timerLocked.value) {
    return;
  }

  setState((current) => ({ ...current, selectedSessionId: sessionId }));
}

function clearSession() {
  if (timerLocked.value) {
    return;
  }

  if (!window.confirm("Clear all solves in this session?")) {
    return;
  }

  setState((current) => ({
    ...current,
    sessions: current.sessions.map((candidate) =>
      candidate.id === current.selectedSessionId ? { ...candidate, solves: [] } : candidate,
    ),
  }));
}

function exportSession() {
  downloadCsv(
    `${session.value.name.toLowerCase().replaceAll(/\s+/g, "-")}.csv`,
    solvesToCsv(session.value.solves),
  );
}

function setSettings(settings: TimerSettings) {
  setState((current) => ({ ...current, settings }));
}

function closePanels() {
  activeSheet.value = null;
  settingsOpen.value = false;
  shortcutsOpen.value = false;
  selectedSolveId.value = null;
}

function onKeyDown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;

  if (event.key === "Escape") {
    closePanels();
    return;
  }

  if (
    target.closest(
      "input, textarea, select, [contenteditable='true'], [data-global-shortcuts='ignore']",
    )
  ) {
    return;
  }

  if (timerStage.value === "running") {
    event.preventDefault();
    timer.stop();
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat && timerInputEnabled.value) {
      timer.press();
    }
  } else if (event.key === "n" || event.key === "N") {
    void requestScramble(state.value.eventId);
  } else if (event.key === "+" || event.key === "=") {
    toggleLastPenalty("+2");
  } else if (event.key === "d" || event.key === "D") {
    toggleLastPenalty("DNF");
  } else if (event.key === "?") {
    shortcutsOpen.value = true;
  }
}

function onKeyUp(event: KeyboardEvent) {
  if (event.code === "Space") {
    event.preventDefault();
    timer.release();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  if (!state.value.currentScramble && !scrambleLoading.value && !scrambleError.value) {
    void requestScramble(state.value.eventId);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
});
</script>

<template>
  <div class="min-h-svh bg-[#0a0a0b] text-zinc-100">
    <div
      :class="[
        'grid h-svh grid-rows-[56px_1fr_64px] overflow-hidden md:grid-rows-[56px_1fr]',
        densityClass,
      ]"
    >
      <header
        :class="[
          'col-span-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-white/[0.07] px-4 md:grid-cols-subgrid md:gap-0 md:px-0',
          densityClass,
        ]"
      >
        <div
          class="flex min-w-0 shrink-0 items-center gap-2 overflow-hidden font-mono text-sm font-semibold md:col-start-1 md:row-start-1 md:px-6"
        >
          <span class="grid h-4.5 w-4.5 grid-cols-2 gap-px rounded bg-zinc-100 p-px">
            <span class="rounded-[1px] bg-indigo-400" />
            <span class="rounded-[1px] bg-black" />
            <span class="rounded-[1px] bg-black" />
            <span class="rounded-[1px] bg-black" />
          </span>
          <span>cube<span class="text-zinc-600">timer</span></span>
        </div>
        <div class="min-w-0 justify-self-center md:hidden">
          <EventSelector
            :event-id="state.eventId"
            :disabled="timerLocked"
            mode="select"
            @event-change="setEvent"
          />
        </div>
        <div class="hidden min-w-0 md:col-start-2 md:row-start-1 md:flex">
          <div class="w-full">
            <EventSelector
              :event-id="state.eventId"
              :disabled="timerLocked"
              mode="tabs"
              @event-change="setEvent"
            />
          </div>
        </div>
        <div
          class="ml-auto flex shrink-0 items-center gap-1 justify-self-end md:col-start-3 md:row-start-1 md:px-6"
        >
          <button type="button" class="topbar-button" @click="shortcutsOpen = true">?</button>
          <button type="button" class="topbar-button" @click="settingsOpen = !settingsOpen">
            set
          </button>
        </div>
      </header>

      <SessionSidebar
        :sessions="state.sessions"
        :active-session-id="state.selectedSessionId"
        :disabled="timerLocked"
        class-name="hidden md:col-start-1 md:flex md:border-r"
        @session-change="selectSession"
        @new-session="createSession"
        @clear="clearSession"
        @export="exportSession"
        @open-solve="(solve) => (selectedSolveId = solve.id)"
        @penalty="updatePenalty"
        @delete="deleteSolve"
      />

      <main class="min-w-0 overflow-hidden md:col-start-2">
        <div class="flex h-full flex-col">
          <ScrambleBar
            :event-id="state.eventId"
            :scramble="state.currentScramble"
            :is-loading="scrambleLoading"
            :error="scrambleError"
            :copied="scrambleCopied"
            :disabled="timerLocked"
            @next="
              () => {
                if (!timerLocked) {
                  void requestScramble(state.eventId);
                }
              }
            "
            @copy="() => void copyScramble()"
          />
          <TimerSurface
            :stage="timerStage"
            :elapsed-ms="timerElapsedMs"
            :bests="bests"
            :input-enabled="timerInputEnabled"
            @press="timer.press"
            @release="timer.release"
          />
        </div>
      </main>

      <aside
        class="hidden overflow-y-auto border-l border-white/[0.07] md:col-start-3 md:flex md:flex-col"
      >
        <section v-if="state.settings.showGraph" class="border-b border-white/[0.07] px-6 py-4">
          <div
            class="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700"
          >
            <span>Progress</span>
          </div>
          <ProgressChart :solves="session.solves" />
          <div class="mt-2 flex gap-3 font-mono text-[10px] text-zinc-600">
            <span>single</span>
            <span class="text-red-300">ao5</span>
            <span class="text-indigo-300">ao12</span>
          </div>
        </section>
        <section v-if="state.settings.showDraw" class="border-b border-white/[0.07] px-6 py-4">
          <div
            class="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700"
          >
            <span>Scramble draw</span>
          </div>
          <ScrambleDraw :event-id="state.eventId" :scramble="state.currentScramble" />
        </section>
        <section v-if="state.settings.showHistogram" class="border-b border-white/[0.07] px-6 py-4">
          <div
            class="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700"
          >
            <span>Histogram</span>
          </div>
          <Histogram :solves="session.solves" />
        </section>
      </aside>

      <MobileNav
        :active="activeSheet"
        :disabled="{
          graph: !state.settings.showGraph,
          draw: !state.settings.showDraw,
          histogram: !state.settings.showHistogram,
        }"
        @select="(sheet) => (activeSheet = sheet)"
      />
    </div>

    <Sheet
      :open="activeSheet === 'session'"
      :modal="false"
      @update:open="
        (open) => {
          if (!open) {
            activeSheet = null;
          }
        }
      "
    >
      <SheetContent
        side="left"
        :show-close-button="false"
        class="mobile-session-sheet w-[min(320px,88vw)] overflow-hidden border-white/[0.07] bg-[#0a0a0b] p-0 shadow-2xl shadow-black/70 md:hidden"
      >
        <SheetTitle class="sr-only">Session</SheetTitle>
        <SheetDescription class="sr-only">
          Session stats, solve history, and session actions.
        </SheetDescription>
        <SessionSidebar
          :sessions="state.sessions"
          :active-session-id="state.selectedSessionId"
          :disabled="timerLocked"
          class-name="h-full"
          @session-change="selectSession"
          @new-session="createSession"
          @clear="clearSession"
          @export="exportSession"
          @open-solve="(solve) => (selectedSolveId = solve.id)"
          @penalty="updatePenalty"
          @delete="deleteSolve"
        />
      </SheetContent>
    </Sheet>

    <MobileSheet
      :active="activeSheet"
      sheet-id="graph"
      title="Progress"
      @close="activeSheet = null"
    >
      <ProgressChart :solves="session.solves" />
    </MobileSheet>
    <MobileSheet
      :active="activeSheet"
      sheet-id="draw"
      title="Scramble draw"
      @close="activeSheet = null"
    >
      <ScrambleDraw :event-id="state.eventId" :scramble="state.currentScramble" />
    </MobileSheet>
    <MobileSheet
      :active="activeSheet"
      sheet-id="histogram"
      title="Histogram"
      @close="activeSheet = null"
    >
      <Histogram :solves="session.solves" />
    </MobileSheet>
    <MobileSheet
      :active="activeSheet"
      sheet-id="settings"
      title="Settings"
      @close="activeSheet = null"
    >
      <SettingsPanel :settings="state.settings" @change="setSettings" />
    </MobileSheet>

    <SettingsPanel
      v-if="settingsOpen"
      :settings="state.settings"
      floating
      closable
      @change="setSettings"
      @close="settingsOpen = false"
    />

    <Dialog v-model:open="shortcutsOpen">
      <DialogContent
        :show-close-button="false"
        class="max-w-80 border-white/10 bg-zinc-950 p-5 text-zinc-500"
      >
        <DialogTitle
          class="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700"
        >
          Keyboard shortcuts
        </DialogTitle>
        <DialogDescription class="sr-only">Keyboard shortcut reference.</DialogDescription>
        <dl class="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm text-zinc-500">
          <dt class="font-mono text-zinc-200">Space</dt>
          <dd>Hold, release, stop</dd>
          <dt class="font-mono text-zinc-200">N</dt>
          <dd>Next scramble</dd>
          <dt class="font-mono text-zinc-200">+ / =</dt>
          <dd>Toggle +2 on last solve</dd>
          <dt class="font-mono text-zinc-200">D</dt>
          <dd>Toggle DNF on last solve</dd>
          <dt class="font-mono text-zinc-200">Esc</dt>
          <dd>Close panels</dd>
        </dl>
      </DialogContent>
    </Dialog>

    <SolveDetailModal
      :solve="selectedSolve"
      @close="selectedSolveId = null"
      @penalty="updatePenalty"
      @comment="updateComment"
      @delete="deleteSolve"
    />
  </div>
</template>
