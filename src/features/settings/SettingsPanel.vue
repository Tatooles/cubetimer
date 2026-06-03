<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TimerSettings } from "../sessions/types";

const props = withDefaults(
  defineProps<{
    settings: TimerSettings;
    floating?: boolean;
    closable?: boolean;
  }>(),
  {
    floating: false,
    closable: false,
  },
);

const emit = defineEmits<{
  change: [settings: TimerSettings];
  close: [];
}>();

function update<Key extends keyof TimerSettings>(key: Key, value: TimerSettings[Key]) {
  emit("change", { ...props.settings, [key]: value });
}
</script>

<template>
  <section
    :class="[
      'border border-white/10 bg-zinc-950 p-4 shadow-2xl shadow-black/50',
      floating ? 'fixed bottom-6 right-6 z-40 w-72 rounded-xl' : 'rounded-xl',
    ]"
  >
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">Settings</h2>
      <Button
        v-if="closable"
        type="button"
        variant="ghost"
        size="sm"
        class="text-sm text-zinc-500 hover:text-zinc-100"
        @click="emit('close')"
      >
        x
      </Button>
    </div>
    <div class="space-y-4 text-sm text-zinc-300">
      <div class="flex items-center justify-between gap-3">
        <span>Density</span>
        <ToggleGroup
          aria-label="Density"
          :model-value="settings.density"
          type="single"
          class="inline-flex rounded-md border border-white/10 bg-black p-0.5"
          @update:model-value="
            (value) => {
              if (value === 'comfortable' || value === 'compact') {
                update('density', value);
              }
            }
          "
        >
          <ToggleGroupItem
            value="comfortable"
            class="h-auto rounded px-2.5 py-1 text-[11px] data-active:bg-zinc-800 data-active:text-zinc-100"
          >
            Comfy
          </ToggleGroupItem>
          <ToggleGroupItem
            value="compact"
            class="h-auto rounded px-2.5 py-1 text-[11px] data-active:bg-zinc-800 data-active:text-zinc-100"
          >
            Compact
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div
        v-for="option in [
          { key: 'showGraph', label: 'Graph', aria: 'Toggle graph' },
          { key: 'showHistogram', label: 'Histogram', aria: 'Toggle histogram' },
          { key: 'showDraw', label: 'Scramble draw', aria: 'Toggle scramble draw' },
          { key: 'inspection', label: 'Inspection', aria: 'Toggle inspection' },
        ]"
        :key="option.key"
        class="flex items-center justify-between"
      >
        <span>{{ option.label }}</span>
        <Switch
          :aria-label="option.aria"
          :model-value="settings[option.key as keyof TimerSettings] as boolean"
          class="data-checked:border-indigo-400 data-checked:bg-indigo-500/20 data-unchecked:border-white/10 data-unchecked:bg-black"
          @update:model-value="
            update(option.key as keyof TimerSettings, $event as TimerSettings[keyof TimerSettings])
          "
        />
      </div>
    </div>
  </section>
</template>
