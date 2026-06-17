import type { AlgorithmSetId } from "./types";

export type AlgorithmCase = {
  id: string;
  group: string;
  name: string;
  description: string;
  algorithm: string;
};

export type AlgorithmSet = {
  id: AlgorithmSetId;
  group: "last-layer" | "two-look" | "advanced";
  name: string;
  description: string;
  caseCount: number;
  cases: AlgorithmCase[];
};

export const ALGORITHM_SETS: AlgorithmSet[] = [
  {
    id: "OLL",
    group: "last-layer",
    name: "OLL",
    description:
      "Orient the last layer after F2L with common dot, line, L, T, and edge-control cases.",
    caseCount: 57,
    cases: [
      {
        id: "oll-21",
        group: "cross",
        name: "OLL 21",
        description: "Sune-style all corners oriented case.",
        algorithm: "R U R' U R U' R' U R U2 R'",
      },
      {
        id: "oll-22",
        group: "cross",
        name: "OLL 22",
        description: "Headlights with solved edge orientation.",
        algorithm: "R U2 R2 U' R2 U' R2 U2 R",
      },
      {
        id: "oll-23",
        group: "cross",
        name: "OLL 23",
        description: "No headlights corner orientation case.",
        algorithm: "R2 D R' U2 R D' R' U2 R'",
      },
      {
        id: "oll-24",
        group: "cross",
        name: "OLL 24",
        description: "T-shape corner orientation case.",
        algorithm: "r U R' U' r' F R F'",
      },
      {
        id: "oll-25",
        group: "cross",
        name: "OLL 25",
        description: "Bowtie corner orientation case.",
        algorithm: "F' r U R' U' r' F R",
      },
      {
        id: "oll-26",
        group: "cross",
        name: "OLL 26",
        description: "Anti-sune corner orientation case.",
        algorithm: "R U2 R' U' R U' R'",
      },
      {
        id: "oll-27",
        group: "cross",
        name: "OLL 27",
        description: "Sune corner orientation case.",
        algorithm: "R U R' U R U2 R'",
      },
      {
        id: "oll-45",
        group: "t-shape",
        name: "OLL 45",
        description: "T-shape edge-control case.",
        algorithm: "F R U R' U' F'",
      },
    ],
  },
  {
    id: "PLL",
    group: "last-layer",
    name: "PLL",
    description: "Permute the last layer with the common 21 PLL cases.",
    caseCount: 21,
    cases: [
      {
        id: "Aa",
        group: "a-perms",
        name: "Aa Perm",
        description: "Adjacent corner cycle with solved edges.",
        algorithm: "x R' U R' D2 R U' R' D2 R2 x'",
      },
      {
        id: "Ab",
        group: "a-perms",
        name: "Ab Perm",
        description: "Opposite direction adjacent corner cycle.",
        algorithm: "x R2 D2 R U R' D2 R U' R x'",
      },
      {
        id: "E",
        group: "e-perm",
        name: "E Perm",
        description: "Diagonal corner swap with solved edges.",
        algorithm: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
      },
      {
        id: "F",
        group: "f-perm",
        name: "F Perm",
        description: "Adjacent corner and edge swap.",
        algorithm: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
      },
      {
        id: "Ga",
        group: "g-perms",
        name: "Ga Perm",
        description: "G permutation with adjacent headlights.",
        algorithm: "R2 U R' U R' U' R U' R2 D U' R' U R D'",
      },
      {
        id: "Gb",
        group: "g-perms",
        name: "Gb Perm",
        description: "G permutation with clockwise edge cycle.",
        algorithm: "R' U' R U D' R2 U R' U R U' R U' R2 D",
      },
      {
        id: "Gc",
        group: "g-perms",
        name: "Gc Perm",
        description: "G permutation with counter-clockwise edge cycle.",
        algorithm: "R2 U' R U' R U R' U R2 D' U R U' R' D",
      },
      {
        id: "Gd",
        group: "g-perms",
        name: "Gd Perm",
        description: "G permutation with opposite AUF feel.",
        algorithm: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
      },
      {
        id: "H",
        group: "edge-only",
        name: "H Perm",
        description: "Opposite edge swaps.",
        algorithm: "M2 U M2 U2 M2 U M2",
      },
      {
        id: "Ja",
        group: "j-perms",
        name: "Ja Perm",
        description: "Adjacent corner and edge swap.",
        algorithm: "x R2 F R F' R U2 r' U r U2 x'",
      },
      {
        id: "Jb",
        group: "j-perms",
        name: "Jb Perm",
        description: "Fast adjacent corner and edge swap.",
        algorithm: "R U R' F' R U R' U' R' F R2 U' R'",
      },
      {
        id: "Na",
        group: "n-perms",
        name: "Na Perm",
        description: "Diagonal corner and edge swap.",
        algorithm: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
      },
      {
        id: "Nb",
        group: "n-perms",
        name: "Nb Perm",
        description: "Opposite diagonal corner and edge swap.",
        algorithm: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
      },
      {
        id: "Ra",
        group: "r-perms",
        name: "Ra Perm",
        description: "Adjacent corner swap with edge cycle.",
        algorithm: "R U' R' U' R U R D R' U' R D' R' U2 R'",
      },
      {
        id: "Rb",
        group: "r-perms",
        name: "Rb Perm",
        description: "Mirror adjacent corner swap with edge cycle.",
        algorithm: "R' U2 R U2 R' F R U R' U' R' F' R2",
      },
      {
        id: "T",
        group: "t-perm",
        name: "T Perm",
        description: "Adjacent corner and adjacent edge swap.",
        algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'",
      },
      {
        id: "Ua",
        group: "edge-only",
        name: "Ua Perm",
        description: "Clockwise three-edge cycle.",
        algorithm: "M2 U M U2 M' U M2",
      },
      {
        id: "Ub",
        group: "edge-only",
        name: "Ub Perm",
        description: "Counter-clockwise three-edge cycle.",
        algorithm: "M2 U' M U2 M' U' M2",
      },
      {
        id: "V",
        group: "v-perm",
        name: "V Perm",
        description: "Diagonal corner swap with adjacent edge swap.",
        algorithm: "R' U R' U' y R' F' R2 U' R' U R' F R F",
      },
      {
        id: "Y",
        group: "y-perm",
        name: "Y Perm",
        description: "Diagonal corner swap with edge swap.",
        algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
      },
      {
        id: "Z",
        group: "edge-only",
        name: "Z Perm",
        description: "Adjacent edge swaps.",
        algorithm: "M' U M2 U M2 U M' U2 M2",
      },
    ],
  },
  {
    id: "COLL",
    group: "advanced",
    name: "COLL",
    description: "Orient and permute last-layer corners while preserving solved edge orientation.",
    caseCount: 42,
    cases: [
      {
        id: "coll-sune",
        group: "sune",
        name: "Sune COLL",
        description: "Sune shape with corner permutation.",
        algorithm: "R U R' U R U2 R'",
      },
      {
        id: "coll-anti-sune",
        group: "anti-sune",
        name: "Anti-Sune COLL",
        description: "Anti-sune shape with corner permutation.",
        algorithm: "R U2 R' U' R U' R'",
      },
      {
        id: "coll-t",
        group: "t",
        name: "T COLL",
        description: "T-shape COLL recognition sample.",
        algorithm: "R U R' U' R' F R F'",
      },
    ],
  },
  {
    id: "ZBLL",
    group: "advanced",
    name: "ZBLL",
    description: "One-look last-layer cases when all last-layer edges are oriented.",
    caseCount: 493,
    cases: [
      {
        id: "zbll-t-1",
        group: "t",
        name: "ZBLL T 1",
        description: "T-shape ZBLL sample with adjacent corner permutation.",
        algorithm: "R U R' U R U2 R' U' R U2 R'",
      },
      {
        id: "zbll-u-1",
        group: "u",
        name: "ZBLL U 1",
        description: "U-shape ZBLL sample for recognition practice.",
        algorithm: "R2 D R' U2 R D' R' U2 R'",
      },
      {
        id: "zbll-l-1",
        group: "l",
        name: "ZBLL L 1",
        description: "L-shape ZBLL sample case.",
        algorithm: "F R U R' U' R U R' U' F'",
      },
    ],
  },
  {
    id: "LSLL",
    group: "two-look",
    name: "LSLL",
    description: "Last-slot last-layer practice cases for transitioning from F2L into LL.",
    caseCount: 32,
    cases: [
      {
        id: "lsll-split-pair",
        group: "last-slot",
        name: "Split Pair",
        description: "Last slot insert that preserves a favorable last layer.",
        algorithm: "U R U' R' U' F' U F",
      },
      {
        id: "lsll-edge-oriented",
        group: "last-slot",
        name: "Edge Oriented",
        description: "Last slot case with oriented LL edges.",
        algorithm: "R U R' U' R U R'",
      },
      {
        id: "lsll-corner-twist",
        group: "last-slot",
        name: "Corner Twist",
        description: "Last slot case that controls corner orientation.",
        algorithm: "R U' R' U2 R U R'",
      },
    ],
  },
  {
    id: "CLL2",
    group: "two-look",
    name: "2x2 CLL",
    description: "Corner last-layer algorithms for 2x2 solves.",
    caseCount: 42,
    cases: [
      {
        id: "cll2-sune",
        group: "sune",
        name: "2x2 Sune",
        description: "Sune family 2x2 CLL sample.",
        algorithm: "R U R' U R U2 R'",
      },
      {
        id: "cll2-anti-sune",
        group: "anti-sune",
        name: "2x2 Anti-Sune",
        description: "Anti-sune family 2x2 CLL sample.",
        algorithm: "R U2 R' U' R U' R'",
      },
      {
        id: "cll2-t",
        group: "t",
        name: "2x2 T",
        description: "T family 2x2 CLL sample.",
        algorithm: "R U R' U' R' F R F'",
      },
    ],
  },
  {
    id: "PLL4",
    group: "two-look",
    name: "4-Look PLL",
    description: "Compact two-step PLL subset for beginners and refresh drills.",
    caseCount: 6,
    cases: [
      {
        id: "pll4-ua",
        group: "edge-cycle",
        name: "Ua Perm",
        description: "Clockwise edge cycle for two-look PLL.",
        algorithm: "M2 U M U2 M' U M2",
      },
      {
        id: "pll4-ub",
        group: "edge-cycle",
        name: "Ub Perm",
        description: "Counter-clockwise edge cycle for two-look PLL.",
        algorithm: "M2 U' M U2 M' U' M2",
      },
      {
        id: "pll4-h",
        group: "edge-swap",
        name: "H Perm",
        description: "Opposite edge swap for two-look PLL.",
        algorithm: "M2 U M2 U2 M2 U M2",
      },
      {
        id: "pll4-z",
        group: "edge-swap",
        name: "Z Perm",
        description: "Adjacent edge swap for two-look PLL.",
        algorithm: "M' U M2 U M2 U M' U2 M2",
      },
    ],
  },
];
