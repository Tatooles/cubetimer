type Face = "U" | "R" | "F" | "D" | "L" | "B";
type Axis = "x" | "y" | "z";

type Vector = {
  x: number;
  y: number;
  z: number;
};

type Sticker = {
  position: Vector;
  normal: Vector;
  face: Face;
};

type ParsedMove = {
  axis: Axis;
  layers: number[];
  turns: number;
};

export type CubeNet = Record<Face, Face[]>;

const FACES: Face[] = ["U", "R", "F", "D", "L", "B"];

function rotateVector(vector: Vector, axis: Axis, clockwiseQuarterTurns: number): Vector {
  let next = { ...vector };
  const turns = ((clockwiseQuarterTurns % 4) + 4) % 4;

  for (let turn = 0; turn < turns; turn += 1) {
    if (axis === "x") {
      next = { x: next.x, y: -next.z, z: next.y };
    } else if (axis === "y") {
      next = { x: next.z, y: next.y, z: -next.x };
    } else {
      next = { x: -next.y, y: next.x, z: next.z };
    }
  }

  return next;
}

function moveInfo(face: Face, size: number): { axis: Axis; layer: number; turns: number } {
  const max = size - 1;
  const min = 0;
  const info: Record<Face, { axis: Axis; layer: number; turns: number }> = {
    U: { axis: "y", layer: max, turns: -1 },
    D: { axis: "y", layer: min, turns: 1 },
    R: { axis: "x", layer: max, turns: -1 },
    L: { axis: "x", layer: min, turns: 1 },
    F: { axis: "z", layer: max, turns: -1 },
    B: { axis: "z", layer: min, turns: 1 },
  };
  return info[face];
}

function suffixTurns(suffix: string): number {
  return suffix === "2" ? 2 : suffix === "'" ? -1 : 1;
}

function wideLayers(face: Face, size: number): number[] {
  const max = size - 1;
  if (size === 2) {
    return [0, 1];
  }

  if (face === "U" || face === "R" || face === "F") {
    return [max, max - 1];
  }

  return [0, 1];
}

function rotationInfo(axis: Axis, size: number): ParsedMove {
  const referenceFace: Record<Axis, Face> = {
    x: "R",
    y: "U",
    z: "F",
  };
  const info = moveInfo(referenceFace[axis], size);

  return {
    axis,
    layers: Array.from({ length: size }, (_, index) => index),
    turns: info.turns,
  };
}

function layerValue(sticker: Sticker, axis: Axis): number {
  return sticker.position[axis];
}

function createStickers(size: number): Sticker[] {
  const stickers: Sticker[] = [];
  const max = size - 1;

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      stickers.push({
        face: "U",
        normal: { x: 0, y: 1, z: 0 },
        position: { x: col, y: max, z: row },
      });
      stickers.push({
        face: "D",
        normal: { x: 0, y: -1, z: 0 },
        position: { x: col, y: 0, z: max - row },
      });
      stickers.push({
        face: "F",
        normal: { x: 0, y: 0, z: 1 },
        position: { x: col, y: max - row, z: max },
      });
      stickers.push({
        face: "B",
        normal: { x: 0, y: 0, z: -1 },
        position: { x: max - col, y: max - row, z: 0 },
      });
      stickers.push({
        face: "R",
        normal: { x: 1, y: 0, z: 0 },
        position: { x: max, y: max - row, z: max - col },
      });
      stickers.push({
        face: "L",
        normal: { x: -1, y: 0, z: 0 },
        position: { x: 0, y: max - row, z: col },
      });
    }
  }

  return stickers;
}

function rotateSticker(sticker: Sticker, axis: Axis, turns: number, size: number): Sticker {
  const center = (size - 1) / 2;
  const centered = {
    x: sticker.position.x - center,
    y: sticker.position.y - center,
    z: sticker.position.z - center,
  };
  const rotatedPosition = rotateVector(centered, axis, turns);
  const rotatedNormal = rotateVector(sticker.normal, axis, turns);

  return {
    ...sticker,
    position: {
      x: Math.round(rotatedPosition.x + center),
      y: Math.round(rotatedPosition.y + center),
      z: Math.round(rotatedPosition.z + center),
    },
    normal: rotatedNormal,
  };
}

function normalFace(normal: Vector): Face {
  if (normal.y === 1) {
    return "U";
  }
  if (normal.y === -1) {
    return "D";
  }
  if (normal.z === 1) {
    return "F";
  }
  if (normal.z === -1) {
    return "B";
  }
  if (normal.x === 1) {
    return "R";
  }
  return "L";
}

function faceIndex(face: Face, position: Vector, size: number): number {
  const max = size - 1;
  if (face === "U") {
    return position.z * size + position.x;
  }
  if (face === "D") {
    return (max - position.z) * size + position.x;
  }
  if (face === "F") {
    return (max - position.y) * size + position.x;
  }
  if (face === "B") {
    return (max - position.y) * size + (max - position.x);
  }
  if (face === "R") {
    return (max - position.y) * size + (max - position.z);
  }
  return (max - position.y) * size + position.z;
}

function parseToken(token: string, size: 2 | 3): ParsedMove | null {
  const faceMatch = /^([URFDLB])([2']?)$/.exec(token);
  if (faceMatch) {
    const info = moveInfo(faceMatch[1] as Face, size);
    return {
      axis: info.axis,
      layers: [info.layer],
      turns: info.turns * suffixTurns(faceMatch[2]),
    };
  }

  const wideMatch = /^([URFDLB])w([2']?)$/.exec(token);
  if (wideMatch) {
    const face = wideMatch[1] as Face;
    const info = moveInfo(face, size);
    return {
      axis: info.axis,
      layers: wideLayers(face, size),
      turns: info.turns * suffixTurns(wideMatch[2]),
    };
  }

  const rotationMatch = /^([xyz])([2']?)$/.exec(token);
  if (rotationMatch) {
    const info = rotationInfo(rotationMatch[1] as Axis, size);
    return {
      ...info,
      turns: info.turns * suffixTurns(rotationMatch[2]),
    };
  }

  return null;
}

export function scrambledCubeNet(scramble: string, size: 2 | 3): CubeNet {
  let stickers = createStickers(size);

  scramble
    .split(/\s+/)
    .map((token) => parseToken(token, size))
    .filter((move): move is ParsedMove => move != null)
    .forEach((move) => {
      stickers = stickers.map((sticker) =>
        move.layers.includes(layerValue(sticker, move.axis))
          ? rotateSticker(sticker, move.axis, move.turns, size)
          : sticker,
      );
    });

  const net = FACES.reduce<CubeNet>((record, face) => {
    record[face] = Array.from({ length: size * size }, () => face);
    return record;
  }, {} as CubeNet);

  stickers.forEach((sticker) => {
    const face = normalFace(sticker.normal);
    net[face][faceIndex(face, sticker.position, size)] = sticker.face;
  });

  return net;
}
