import { getEvent } from "../events";
import type { EventId } from "../types";

type BrandMarkProps = {
  eventId: EventId;
};

export function BrandMark({ eventId }: BrandMarkProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid flex-none grid-cols-2 gap-[3px]" aria-hidden="true">
        <span className="size-3.5 rounded-[3px] bg-rose-600" />
        <span className="size-3.5 rounded-[3px] bg-blue-500" />
        <span className="size-3.5 rounded-[3px] bg-green-500" />
        <span className="size-3.5 rounded-[3px] bg-amber-500" />
      </span>
      <div>
        <h1 className="text-[1.04rem] leading-[1.1] text-slate-50">CubeTimer</h1>
        <p className="text-[0.86rem] text-[#8d99aa]">{getEvent(eventId).name}</p>
      </div>
    </div>
  );
}
