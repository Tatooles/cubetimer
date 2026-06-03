<script setup lang="ts">
import type { MobileSheetId } from "./types";

const props = defineProps<{
  active: MobileSheetId;
  disabled: {
    graph: boolean;
    draw: boolean;
    histogram: boolean;
  };
}>();

const emit = defineEmits<{
  select: [sheet: MobileSheetId];
}>();

const items: Array<{ id: Exclude<MobileSheetId, null>; label: string; icon: string }> = [
  { id: "session", label: "Session", icon: "#" },
  { id: "graph", label: "Graph", icon: "~" },
  { id: "draw", label: "Draw", icon: "[]" },
  { id: "histogram", label: "Hist", icon: "|" },
  { id: "settings", label: "Settings", icon: "*" },
];

function itemDisabled(id: Exclude<MobileSheetId, null>): boolean {
  return (
    (id === "graph" && props.disabled.graph) ||
    (id === "draw" && props.disabled.draw) ||
    (id === "histogram" && props.disabled.histogram)
  );
}
</script>

<template>
  <nav
    class="pointer-events-auto relative z-50 grid h-16 grid-cols-5 border-t border-white/[0.07] bg-[#0a0a0b] pb-[env(safe-area-inset-bottom,0px)] md:hidden"
  >
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :disabled="itemDisabled(item.id)"
      :class="[
        'flex flex-col items-center justify-center gap-0.5 text-[10px] transition',
        active === item.id ? 'text-indigo-300' : 'text-zinc-600',
        itemDisabled(item.id) ? 'opacity-35' : 'hover:text-zinc-100',
      ]"
      @click="emit('select', active === item.id ? null : item.id)"
    >
      <span class="font-mono text-base leading-none">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
