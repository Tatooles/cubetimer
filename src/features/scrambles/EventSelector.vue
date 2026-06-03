<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
const moreValue = computed(() => (activeOverflow.value ? props.eventId : ""));
const tabValue = computed(() => (activeOverflow.value ? overflowTabValue : props.eventId));

function changeEvent(value: unknown) {
  if (typeof value !== "string" || !value || value === overflowTabValue) {
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
  <Select
    v-if="mode === 'select'"
    :model-value="eventId"
    :disabled="disabled"
    @update:model-value="changeEvent"
  >
    <SelectTrigger
      data-global-shortcuts="ignore"
      class="event-select-trigger event-select-toolbar-trigger h-9 min-w-28 justify-center rounded-md border-transparent bg-transparent px-2.5 font-mono text-sm text-zinc-300 shadow-none hover:border-white/[0.07] hover:bg-white/[0.03] hover:text-zinc-100 focus:border-white/10 focus:bg-white/[0.04] focus:ring-1 focus:ring-white/10"
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="event in PUZZLE_EVENTS"
        :key="event.id"
        :value="event.id"
        class="font-mono text-xs"
      >
        {{ event.label }}
      </SelectItem>
    </SelectContent>
  </Select>

  <div v-else ref="containerRef" class="event-tabs-wrap min-w-0 flex-1">
    <div class="flex h-14 w-full min-w-0 items-stretch">
      <Tabs :model-value="tabValue" class="w-full" @update:model-value="changeEvent">
        <TabsList class="event-tabs-list event-tabs-strip flex h-full w-full bg-transparent p-0">
          <TabsTrigger
            v-for="event in visibleEvents"
            :key="event.id"
            data-global-shortcuts="ignore"
            :value="event.id"
            :disabled="disabled"
            :class="[
              'event-tabs-trigger font-mono h-full min-w-16 flex-none rounded-none border-0 bg-transparent px-4 shadow-none after:bottom-0',
              tabValue === event.id ? 'text-indigo-200 after:bg-indigo-300' : 'text-zinc-500',
            ]"
          >
            {{ event.label }}
          </TabsTrigger>
          <Select
            v-if="overflowEvents.length > 0"
            :model-value="moreValue"
            :disabled="disabled"
            @update:model-value="changeEvent"
          >
            <SelectTrigger
              data-global-shortcuts="ignore"
              :data-value="activeOverflow ? overflowTabValue : undefined"
              :class="[
                'event-more-trigger relative h-full w-auto min-w-20 justify-center rounded-none border-0 bg-transparent px-4 font-mono text-sm shadow-none hover:bg-transparent hover:text-zinc-200 focus:border-transparent focus:ring-0 focus:ring-offset-0 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5',
                activeOverflow ? 'text-indigo-200 after:bg-indigo-300' : 'text-zinc-500',
              ]"
            >
              <SelectValue placeholder="more" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="event in overflowEvents"
                :key="event.id"
                :value="event.id"
                class="font-mono text-xs"
              >
                {{ event.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </TabsList>
      </Tabs>
    </div>
  </div>
</template>
