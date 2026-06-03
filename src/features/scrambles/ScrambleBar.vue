<script setup lang="ts">
import { computed } from "vue";
import type { PuzzleEvent } from "../sessions/types";
import { puzzleEventLabel } from "./eventMap";

const props = withDefaults(
  defineProps<{
    eventId: PuzzleEvent;
    scramble: string;
    isLoading: boolean;
    error: string | null;
    copied?: boolean;
    disabled?: boolean;
  }>(),
  {
    copied: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  next: [];
  copy: [];
}>();

const moves = computed(() => props.scramble.split(/\s+/).filter(Boolean).length);
</script>

<template>
  <section class="border-b border-white/[0.07] px-4 py-4 text-center md:px-6 md:py-5">
    <div
      class="mx-auto mb-3 flex max-w-3xl items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700"
    >
      <span>{{ puzzleEventLabel(eventId) }} / WCA</span>
      <span class="h-1 w-1 rounded-full bg-indigo-400" />
      <span>{{ isLoading ? "Loading" : `${moves} moves` }}</span>
    </div>
    <button
      type="button"
      aria-label="Copy scramble"
      class="scramble-copy-target mx-auto block max-w-4xl whitespace-pre-wrap text-balance rounded-md px-3 py-1 font-mono text-base leading-relaxed tracking-normal text-zinc-100 md:text-[22px]"
      @click="emit('copy')"
    >
      {{ scramble }}
    </button>
    <div
      aria-live="polite"
      class="mt-1 h-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300"
    >
      {{ copied ? "Copied" : "" }}
    </div>
    <p v-if="error" class="mt-2 text-xs text-amber-300">{{ error }}</p>
    <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
      <button type="button" :disabled="disabled" class="scramble-action" @click="emit('next')">
        Next
      </button>
    </div>
  </section>
</template>
