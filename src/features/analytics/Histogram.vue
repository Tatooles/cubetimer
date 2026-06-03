<script setup lang="ts">
import { computed } from "vue";
import type { Solve } from "../sessions/types";
import { histogramBuckets } from "./chartSeries";

const props = defineProps<{
  solves: Solve[];
}>();

const buckets = computed(() => histogramBuckets(props.solves));
const max = computed(() => Math.max(1, ...buckets.value.map((bucket) => bucket.count)));
</script>

<template>
  <div v-if="buckets.length === 0" class="flex h-[150px] items-center text-xs text-zinc-600">
    No solve data yet
  </div>
  <div v-else class="flex h-[150px] items-end gap-1">
    <div
      v-for="bucket in buckets"
      :key="bucket.label"
      class="flex min-w-0 flex-1 flex-col items-center gap-2"
    >
      <div
        class="w-full rounded-t-sm bg-indigo-400/80"
        :style="{ height: `${Math.max(6, (bucket.count / max) * 118)}px` }"
        :title="`${bucket.label}: ${bucket.count}`"
      />
      <span class="truncate font-mono text-[9px] text-zinc-700">{{ bucket.min }}</span>
    </div>
  </div>
</template>
