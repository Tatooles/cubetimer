<script setup lang="ts">
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
      <button
        v-if="closable"
        type="button"
        class="text-sm text-zinc-500 hover:text-zinc-100"
        @click="emit('close')"
      >
        x
      </button>
    </div>
    <div class="space-y-4 text-sm text-zinc-300">
      <div class="flex items-center justify-between gap-3">
        <span>Density</span>
        <div
          aria-label="Density"
          class="inline-flex rounded-md border border-white/10 bg-black p-0.5"
        >
          <button
            type="button"
            :class="[
              'rounded px-2.5 py-1 text-[11px] transition',
              settings.density === 'comfortable'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-200',
            ]"
            @click="update('density', 'comfortable')"
          >
            Comfy
          </button>
          <button
            type="button"
            :class="[
              'rounded px-2.5 py-1 text-[11px] transition',
              settings.density === 'compact'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-200',
            ]"
            @click="update('density', 'compact')"
          >
            Compact
          </button>
        </div>
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
        <button
          type="button"
          :aria-label="option.aria"
          :aria-pressed="settings[option.key as keyof TimerSettings] as boolean"
          :class="[
            'relative h-[18px] w-8 rounded-full border transition',
            settings[option.key as keyof TimerSettings]
              ? 'border-indigo-400 bg-indigo-500/20'
              : 'border-white/10 bg-black',
          ]"
          @click="
            update(
              option.key as keyof TimerSettings,
              !settings[option.key as keyof TimerSettings] as never,
            )
          "
        >
          <span
            :class="[
              'absolute top-0.5 h-3 w-3 rounded-full transition',
              settings[option.key as keyof TimerSettings]
                ? 'left-[17px] bg-indigo-300'
                : 'left-0.5 bg-zinc-500',
            ]"
          />
        </button>
      </div>
    </div>
  </section>
</template>
