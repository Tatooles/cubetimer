<script setup lang="ts">
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { MobileSheetId } from "./types";

const props = defineProps<{
  active: MobileSheetId;
  title: string;
  sheetId: Exclude<MobileSheetId, null>;
}>();

const emit = defineEmits<{
  close: [];
}>();

function updateOpen(open: boolean) {
  if (!open && props.active === props.sheetId) {
    emit("close");
  }
}
</script>

<template>
  <Drawer
    :open="active === sheetId"
    :modal="false"
    :should-scale-background="false"
    @update:open="updateOpen"
  >
    <DrawerContent
      class="bottom-16 z-30 max-h-[72vh] overflow-hidden rounded-t-[22px] border-white/10 bg-zinc-950 px-5 pb-6 pt-5 shadow-2xl shadow-black/80 md:hidden"
    >
      <DrawerHeader class="mb-4 flex flex-col gap-1 p-0 text-left">
        <DrawerTitle class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          {{ title }}
        </DrawerTitle>
        <DrawerDescription class="sr-only">{{ title }} panel</DrawerDescription>
      </DrawerHeader>
      <slot />
    </DrawerContent>
  </Drawer>
</template>
