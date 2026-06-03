<script setup lang="ts">
import { computed } from "vue";
import { formatTimerTime } from "./timerFormat";
import type { TimerStage } from "./useTimerController";

const props = defineProps<{
  stage: TimerStage;
  elapsedMs: number;
  bests: Array<{ label: string; value: string }>;
  inputEnabled: boolean;
}>();

const emit = defineEmits<{
  press: [];
  release: [];
}>();

const stageClass: Record<TimerStage, string> = {
  idle: "text-zinc-100",
  holding: "text-red-400",
  ready: "text-emerald-300",
  running: "text-zinc-50",
};

const time = computed(() => {
  const value = formatTimerTime(props.elapsedMs);
  const index = value.lastIndexOf(".");
  if (index === -1) {
    return { main: value, decimal: "" };
  }

  return { main: value.slice(0, index), decimal: value.slice(index) };
});

function releasePointer(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }

  emit("release");
}

function pressPointer(event: PointerEvent) {
  if ((event.target as HTMLElement).closest("button")) {
    return;
  }

  if (!props.inputEnabled) {
    return;
  }

  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  emit("press");
}
</script>

<template>
  <section
    :class="[
      'relative flex flex-1 select-none flex-col items-center justify-center overflow-hidden transition',
      stage === 'holding' ? 'bg-red-500/5' : stage === 'ready' ? 'bg-emerald-500/5' : '',
      inputEnabled ? 'cursor-pointer' : 'cursor-default',
    ]"
    @pointerdown="pressPointer"
    @pointerup="releasePointer"
    @pointercancel="releasePointer"
  >
    <div
      :class="[
        'font-mono text-[clamp(5rem,15vw,12rem)] font-light leading-none tracking-normal tabular-nums transition',
        stageClass[stage],
      ]"
    >
      {{ time.main }}<span class="text-zinc-500">{{ time.decimal }}</span>
    </div>
    <div
      :class="[
        'mt-8 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-700 transition',
        stage === 'idle' ? 'opacity-100' : 'opacity-0',
      ]"
    >
      <kbd
        class="hidden rounded border border-white/10 px-2 py-1 font-mono normal-case tracking-normal text-zinc-500 md:inline-block"
      >
        Space
      </kbd>
      <span class="hidden md:inline">Hold to start</span>
      <span class="md:hidden">Hold screen to start</span>
    </div>
    <div
      :class="[
        'absolute bottom-7 left-1/2 hidden -translate-x-1/2 gap-7 font-mono text-xs transition md:flex',
        stage === 'idle' ? 'opacity-100' : 'opacity-0',
      ]"
    >
      <div v-for="best in bests" :key="best.label" class="flex flex-col items-center gap-1">
        <span class="text-[10px] uppercase tracking-[0.16em] text-zinc-700">
          {{ best.label }}
        </span>
        <span class="text-sm font-medium text-zinc-200">{{ best.value }}</span>
      </div>
    </div>
  </section>
</template>
