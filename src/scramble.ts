import { randomScrambleForEvent } from "cubing/scramble";
import type { EventId } from "./types";

export async function generateScramble(eventId: EventId): Promise<string> {
  return (await randomScrambleForEvent(eventId)).toString();
}
