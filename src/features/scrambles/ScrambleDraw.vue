<script setup lang="ts">
import { computed } from "vue";
import type { PuzzleEvent } from "../sessions/types";
import { scrambledCubeNet } from "./cubeNet";
import { PUZZLE_EVENTS, puzzleEventLabel } from "./eventMap";

const colors = {
  U: "#f4f4f0",
  R: "#ef4444",
  F: "#22c55e",
  D: "#facc15",
  L: "#f97316",
  B: "#3b82f6",
};

type Face = keyof typeof colors;

const props = defineProps<{
  eventId: PuzzleEvent;
  scramble: string;
}>();

const drawType = computed(
  () => PUZZLE_EVENTS.find((event) => event.id === props.eventId)?.draw ?? "placeholder",
);
const cubeSize = computed(() => (drawType.value === "cube2" ? 2 : 3));
const net = computed(() => scrambledCubeNet(props.scramble, cubeSize.value));
const positions = computed<Record<Face, { x: number; y: number }>>(() => ({
  U: { x: cubeSize.value * 16, y: 0 },
  L: { x: 0, y: cubeSize.value * 16 },
  F: { x: cubeSize.value * 16, y: cubeSize.value * 16 },
  R: { x: cubeSize.value * 32, y: cubeSize.value * 16 },
  B: { x: cubeSize.value * 48, y: cubeSize.value * 16 },
  D: { x: cubeSize.value * 16, y: cubeSize.value * 32 },
}));
const faces: Face[] = ["U", "L", "F", "R", "B", "D"];
</script>

<template>
  <div v-if="drawType === 'cube2' || drawType === 'cube3'" class="flex flex-col items-center gap-2">
    <svg
      :viewBox="`0 0 ${cubeSize * 64} ${cubeSize * 48}`"
      class="h-40 w-full max-w-67.5"
      role="img"
      aria-label="Cube net"
    >
      <g
        v-for="face in faces"
        :key="face"
        :transform="`translate(${positions[face].x} ${positions[face].y})`"
      >
        <rect
          v-for="(_, index) in cubeSize * cubeSize"
          :key="`${face}-${index}`"
          :x="(index % cubeSize) * 16"
          :y="Math.floor(index / cubeSize) * 16"
          width="14"
          height="14"
          rx="2"
          :fill="colors[net[face][index]]"
          opacity="0.92"
        />
      </g>
    </svg>
    <span class="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700">
      {{ drawType === "cube2" ? "2x2" : "3x3" }} net
    </span>
  </div>
  <div
    v-else
    class="flex h-40 flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-black/40 text-center"
  >
    <div class="font-mono text-sm text-zinc-300">{{ puzzleEventLabel(eventId) }}</div>
    <div class="mt-2 max-w-48 text-xs leading-relaxed text-zinc-600">
      Scramble draw placeholder for this event
    </div>
  </div>
</template>
