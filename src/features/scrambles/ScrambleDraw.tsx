import type { ReactElement } from "react";
import type { PuzzleEvent } from "../sessions/types";
import { scrambledCubeNet } from "./cubeNet";
import { PUZZLE_EVENTS, puzzleEventLabel } from "./eventMap";

const COLORS = {
  U: "#f4f4f0",
  R: "#ef4444",
  F: "#22c55e",
  D: "#facc15",
  L: "#f97316",
  B: "#3b82f6",
};

type Face = keyof typeof COLORS;

type ScrambleDrawProps = {
  eventId: PuzzleEvent;
  scramble: string;
};

function faceCells(face: Face, size: number, stickers: Face[]): ReactElement[] {
  return Array.from({ length: size * size }, (_, index) => (
    <rect
      key={`${face}-${index}`}
      x={(index % size) * 16}
      y={Math.floor(index / size) * 16}
      width="14"
      height="14"
      rx="2"
      fill={COLORS[stickers[index]]}
      opacity="0.92"
    />
  ));
}

function FaceNet({ size, scramble }: { size: 2 | 3; scramble: string }) {
  const net = scrambledCubeNet(scramble, size);
  const positions: Record<Face, { x: number; y: number }> = {
    U: { x: size * 16, y: 0 },
    L: { x: 0, y: size * 16 },
    F: { x: size * 16, y: size * 16 },
    R: { x: size * 32, y: size * 16 },
    B: { x: size * 48, y: size * 16 },
    D: { x: size * 16, y: size * 32 },
  };
  const width = size * 64;
  const height = size * 48;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-40 w-full max-w-[270px]"
      role="img"
      aria-label="Cube net"
    >
      {(Object.keys(positions) as Face[]).map((face) => (
        <g key={face} transform={`translate(${positions[face].x} ${positions[face].y})`}>
          {faceCells(face, size, net[face])}
        </g>
      ))}
    </svg>
  );
}

export function ScrambleDraw({ eventId, scramble }: ScrambleDrawProps) {
  const drawType = PUZZLE_EVENTS.find((event) => event.id === eventId)?.draw ?? "placeholder";

  if (drawType === "cube2" || drawType === "cube3") {
    return (
      <div className="flex flex-col items-center gap-2">
        <FaceNet size={drawType === "cube2" ? 2 : 3} scramble={scramble} />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700">
          {drawType === "cube2" ? "2x2" : "3x3"} net
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-black/40 text-center">
      <div className="font-mono text-sm text-zinc-300">{puzzleEventLabel(eventId)}</div>
      <div className="mt-2 max-w-48 text-xs leading-relaxed text-zinc-600">
        Scramble draw placeholder for this event
      </div>
    </div>
  );
}
