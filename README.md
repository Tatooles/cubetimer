# CubeTimer

A local-first Rubik's cube timer built with React, TypeScript, and Vite for deployment on Vercel.

## Features

- Spacebar hold-to-ready timing flow: hold space, release to start, press any key to stop.
- Multiple local sessions with per-session event selection.
- Scrambles for 2x2 through 7x7, 3x3 OH, 3BLD, Pyraminx, Skewb, Megaminx, Square-1, Clock, and 3x3 LSLL training.
- Solve history with penalties, delete controls, best/mean/Ao5/Ao12 stats.
- Local persistence through `localStorage`.
- JSON import/export for full app data and CSV export for the active session.

## Development

```bash
pnpm install
pnpm dev
```

## Verification

```bash
pnpm test
pnpm build
```

## Vercel

The app is static. Vercel should use:

- Build command: `pnpm build`
- Output directory: `dist`
