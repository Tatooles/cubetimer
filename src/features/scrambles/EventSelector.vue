<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { PuzzleEvent } from "../sessions/types";
import { PUZZLE_EVENTS } from "./eventMap";

const minTabWidth = 74;
const moreWidth = 104;
const overflowTabValue = "__event_overflow__";

const props = withDefaults(
  defineProps<{
    eventId: PuzzleEvent;
    disabled?: boolean;
    mode: "tabs" | "select";
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  eventChange: [eventId: PuzzleEvent];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const visibleCount = ref(4);
let observer: ResizeObserver | null = null;

const visibleEvents = computed(() => PUZZLE_EVENTS.slice(0, visibleCount.value));
const overflowEvents = computed(() => PUZZLE_EVENTS.slice(visibleCount.value));
const activeOverflow = computed(() =>
  overflowEvents.value.some((event) => event.id === props.eventId),
);
const selectValue = computed(() => props.eventId);
const moreValue = computed(() => (activeOverflow.value ? props.eventId : ""));
const tabValue = computed(() => (activeOverflow.value ? overflowTabValue : props.eventId));

function changeEvent(value: string) {
  if (!value || value === overflowTabValue) {
    return;
  }

  emit("eventChange", value as PuzzleEvent);
}

function fit(width: number) {
  const maxWithoutOverflow = Math.floor(width / minTabWidth);
  if (maxWithoutOverflow >= PUZZLE_EVENTS.length) {
    visibleCount.value = PUZZLE_EVENTS.length;
    return;
  }

  visibleCount.value = Math.max(1, Math.floor((width - moreWidth) / minTabWidth));
}

function fitContainer() {
  const container = containerRef.value;
  if (!container) {
    return;
  }

  fit(container.clientWidth);
}

onMounted(() => {
  const container = containerRef.value;
  if (!container || props.mode !== "tabs") {
    return;
  }

  fitContainer();
  if (typeof ResizeObserver === "undefined") {
    window.addEventListener("resize", fitContainer);
    return;
  }

  observer = new ResizeObserver((entries) => {
    fit(entries[0]?.contentRect.width ?? container.clientWidth);
  });
  observer.observe(container);
});

onUnmounted(() => {
  observer?.disconnect();
  window.removeEventListener("resize", fitContainer);
});
</script>

<template>
  <select
    v-if="mode === 'select'"
    data-slot="select-trigger"
    data-global-shortcuts="ignore"
    :value="selectValue"
    :disabled="disabled"
    class="event-select-trigger event-select-toolbar-trigger h-9 min-w-28 justify-center rounded-md border-transparent bg-transparent px-2.5 font-mono text-sm text-zinc-300 shadow-none hover:border-white/[0.07] hover:bg-white/[0.03] hover:text-zinc-100 focus:border-white/10 focus:bg-white/[0.04] focus:ring-1 focus:ring-white/10"
    @change="changeEvent(($event.target as HTMLSelectElement).value)"
  >
    <option v-for="event in PUZZLE_EVENTS" :key="event.id" :value="event.id">
      {{ event.label }}
    </option>
  </select>

  <div v-else ref="containerRef" class="event-tabs-wrap min-w-0 flex-1">
    <div class="flex h-14 w-full min-w-0 items-stretch">
      <div data-slot="tabs" class="w-full">
        <div data-slot="tabs-list" class="event-tabs-list event-tabs-strip flex w-full">
          <button
            v-for="event in visibleEvents"
            :key="event.id"
            type="button"
            data-slot="tabs-trigger"
            data-global-shortcuts="ignore"
            :disabled="disabled"
            :data-state="tabValue === event.id ? 'active' : 'inactive'"
            :class="[
              'event-tabs-trigger font-mono relative inline-flex h-full min-w-16 items-center justify-center px-4 text-sm font-medium outline-none transition hover:text-zinc-200 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-indigo-400 disabled:pointer-events-none disabled:opacity-50 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5',
              tabValue === event.id ? 'text-indigo-200 after:bg-indigo-300' : 'text-zinc-500',
            ]"
            @click="changeEvent(event.id)"
          >
            {{ event.label }}
          </button>
          <select
            v-if="overflowEvents.length > 0"
            data-slot="select-trigger"
            data-global-shortcuts="ignore"
            :value="moreValue"
            :disabled="disabled"
            :data-value="activeOverflow ? overflowTabValue : undefined"
            :class="[
              'event-more-trigger relative h-full w-auto min-w-20 justify-center rounded-none border-0 bg-transparent px-4 font-mono text-sm shadow-none hover:bg-transparent hover:text-zinc-200 focus:border-transparent focus:ring-0 focus:ring-offset-0 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5',
              activeOverflow ? 'text-indigo-200 after:bg-indigo-300' : 'text-zinc-500',
            ]"
            @change="changeEvent(($event.target as HTMLSelectElement).value)"
          >
            <option value="">more</option>
            <option v-for="event in overflowEvents" :key="event.id" :value="event.id">
              {{ event.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>
