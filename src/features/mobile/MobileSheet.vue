<script setup lang="ts">
import type { MobileSheetId } from "./types";

defineProps<{
  active: MobileSheetId;
  title: string;
  sheetId: Exclude<MobileSheetId, null>;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="active === sheetId" data-slot="drawer">
      <button
        type="button"
        aria-label="Close panel"
        class="fixed inset-x-0 top-0 bottom-16 z-20 bg-black/45 md:hidden"
        data-slot="drawer-overlay"
        @click="emit('close')"
      />
      <section
        data-slot="drawer-content"
        class="fixed inset-x-0 bottom-16 z-30 max-h-[72vh] overflow-hidden rounded-t-[22px] border-t border-white/10 bg-zinc-950 px-5 pb-6 pt-5 shadow-2xl shadow-black/80 outline-none md:hidden"
      >
        <div class="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-white/20" />
        <div data-slot="drawer-header" class="mb-4 flex flex-col gap-1 text-left">
          <h2
            data-slot="drawer-title"
            class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700"
          >
            {{ title }}
          </h2>
          <p data-slot="drawer-description" class="sr-only">{{ title }} panel</p>
        </div>
        <slot />
      </section>
    </div>
  </Teleport>
</template>
