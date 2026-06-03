<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatSolveTime } from "../timer/timerFormat";
import type { Solve } from "./types";

const props = defineProps<{
  solve: Solve | null;
}>();

const emit = defineEmits<{
  close: [];
  penalty: [solveId: string, penalty: Solve["penalty"]];
  comment: [solveId: string, comment: string];
  delete: [solveId: string];
}>();

function updateOpen(open: boolean) {
  if (!open && props.solve) {
    emit("close");
  }
}
</script>

<template>
  <Dialog :open="solve != null" @update:open="updateOpen">
    <DialogContent
      v-if="solve"
      class="max-w-[480px] border-white/10 bg-zinc-950 p-5 text-zinc-100 shadow-2xl"
    >
      <DialogTitle class="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
        Solve detail
      </DialogTitle>
      <DialogDescription class="sr-only"
        >Solve time, scramble, notes, and penalty controls.</DialogDescription
      >
      <div class="mt-3 font-mono text-5xl font-light text-zinc-100">
        {{ formatSolveTime(solve.ms, solve.penalty) }}
      </div>
      <div class="mt-2 font-mono text-xs text-zinc-500">
        {{ new Date(solve.timestamp).toLocaleString() }}
      </div>
      <p class="mt-4 rounded-md bg-black p-3 font-mono text-xs leading-relaxed text-zinc-300">
        {{ solve.scramble }}
      </p>
      <textarea
        :value="solve.comment ?? ''"
        placeholder="Notes"
        class="mt-4 min-h-20 w-full rounded-md border border-white/10 bg-black p-3 text-sm text-zinc-100 outline-none focus:border-indigo-400"
        @blur="emit('comment', solve.id, ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          :class="['modal-button h-auto', solve.penalty === 'OK' ? 'modal-button-on' : '']"
          @click="emit('penalty', solve.id, 'OK')"
        >
          OK
        </Button>
        <Button
          type="button"
          variant="outline"
          :class="['modal-button h-auto', solve.penalty === '+2' ? 'modal-button-on' : '']"
          @click="emit('penalty', solve.id, solve.penalty === '+2' ? 'OK' : '+2')"
        >
          +2
        </Button>
        <Button
          type="button"
          variant="outline"
          :class="['modal-button h-auto', solve.penalty === 'DNF' ? 'modal-button-on' : '']"
          @click="emit('penalty', solve.id, solve.penalty === 'DNF' ? 'OK' : 'DNF')"
        >
          DNF
        </Button>
        <Button
          type="button"
          variant="outline"
          class="modal-button h-auto text-red-300"
          @click="emit('delete', solve.id)"
        >
          Delete
        </Button>
      </div>
      <div class="mt-4 flex justify-end">
        <Button
          type="button"
          class="rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
          @click="emit('close')"
        >
          Close
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
