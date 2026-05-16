# Cube Timer Redesign Design

Date: 2026-05-16

## Source Of Truth

The Claude Design handoff is stored in `docs/claude-design/cube-timer/`.

Primary files:

- `docs/claude-design/cube-timer/chats/chat1.md`
- `docs/claude-design/cube-timer/project/studio.html`
- `docs/claude-design/cube-timer/project/studio.js`
- `docs/claude-design/cube-timer/project/engine.js`
- `docs/claude-design/cube-timer/project/screenshots/studio-preview.png`
- `docs/claude-design/cube-timer/project/screenshots/studio-mobile.png`

Implement the `A · Studio` direction with full feature parity. The current Vite starter UI can be removed. Preserve the Vite+ project setup, React, TypeScript, and Tailwind.

## Product Goal

Build a polished dark-mode Rubik's cube timer modeled on the Claude Studio design. The timer should make the active solve flow the main focus, while providing session history, stats, scramble visualization, progress charts, histogram, settings, mobile sheets, keyboard shortcuts, and CSV export.

The app should be useful as a real local timer, not only a static mockup.

## Non-Goals

- Do not preserve the current Vite starter UI.
- Do not copy the prototype's vanilla JS structure directly into production code.
- Do not implement official WCA competition scramble compliance beyond what `cubing` provides.
- Do not build separate desktop and mobile apps. Implement one responsive React app.
- Do not hand-roll scramble generation where `cubing` supports the event.

## Technology

- Vite+ remains the toolchain.
- React + TypeScript for app code.
- Tailwind for styling.
- Add the `cubing` npm package.
- Use localStorage for persistence in this implementation.
- Canvas is acceptable for charts and histogram.
- SVG is acceptable for scramble draw.

## Cubing Integration

Use `randomScrambleForEvent` from `cubing/scramble` in a dedicated scramble service.

```ts
import { randomScrambleForEvent } from "cubing/scramble";
```

The scramble service owns app-to-cubing event mapping, async loading state, fallback handling, and converting returned `Alg` values to strings.

Event mapping:

- `333` -> `333`
- `222` -> `222`
- `444` -> `444`
- `555` -> `555`
- `666` -> `666`
- `777` -> `777`
- `333oh` -> `333`
- `333bld` -> `333bf`
- `pyra` -> `pyram`
- `skewb` -> `skewb`
- `mega` -> `minx`
- `sq1` -> `sq1`
- `clock` -> `clock`

If a `cubing` event code fails, show a non-blocking error and keep the previous scramble visible.

## Visual Design

Match the Claude Studio direction:

- Minimal monochrome dark interface.
- Near-black background.
- Off-white primary text.
- Muted gray secondary text.
- Single indigo accent.
- Monospaced timer digits with tabular numeric behavior.
- Thin dividers and restrained panels.
- Desktop layout: top bar, left session sidebar, center timer, right module rail.
- Mobile layout: top event/scramble controls, timer-focused center, bottom nav for secondary views.

Use Tailwind utilities and CSS variables where useful for tokens. Avoid adding another component library unless required.

## Responsive Layout

Desktop:

- Top bar spans the app.
- Left sidebar shows session selector, stats grid, solve list, and session actions.
- Center column shows scramble bar and large timer.
- Right rail stacks progress graph, scramble draw, and histogram.
- Settings panel floats from the lower right.

Mobile:

- Preserve one responsive app shell.
- Primary screen shows only essential controls, scramble, and timer.
- Bottom nav opens secondary content:
  - Session
  - Graph
  - Draw
  - Histogram
  - Settings
- Session opens as a slide-in panel.
- Graph, draw, histogram, and settings open as bottom sheets.
- Hidden modules disabled in settings should appear disabled in the bottom nav.

## Functional Requirements

Timer:

- Spacebar hold enters preparing state.
- Holding long enough enters ready state.
- Releasing from ready starts the timer.
- Pressing a key while running stops the timer.
- Mobile pointer/tap supports the same start/stop flow.
- Timer display resets after solve completion and records the solve.

Scrambles:

- Show current scramble above the timer.
- Support event switching.
- Generate a new scramble after each solve.
- Provide a "next scramble" action.
- Provide a copy scramble action when clipboard is available.
- Show event and move count metadata where practical.

Sessions:

- Support multiple named sessions.
- Include seeded demo data for the initial main session.
- Support new session creation.
- Support clearing the current session.
- Persist sessions, selected event, selected session, current scramble, and settings to localStorage.

Solve Management:

- Record time, event, scramble, timestamp, penalty, and comment.
- Show solve list newest-first.
- Allow marking +2.
- Allow marking DNF.
- Allow deleting a solve.
- Allow opening solve detail modal.
- Allow editing comments/notes in solve detail.

Stats:

- Current single, ao5, ao12, ao50, ao100.
- Best single, ao5, ao12, ao50, ao100.
- Session count and mean.
- Rolling average calculations should follow cubing timer conventions:
  - ao5 trims best and worst.
  - Larger averages trim approximately 5% from each side.
  - DNF should make an average DNF when more DNFs remain than can be trimmed.

Analytics Modules:

- Progress chart plots individual times, rolling ao5, and rolling ao12.
- Histogram buckets solve times.
- Scramble draw shows a cube net for 2x2 and 3x3-style events.
- For unsupported draw events, show a polished event-specific placeholder rather than an inaccurate cube net.
- Graph, histogram, and draw can be enabled or disabled in settings.

Settings:

- Density toggle: comfortable / compact.
- Show/hide graph.
- Show/hide histogram.
- Show/hide scramble draw.
- Inspection toggle may be present if implemented in parity with the prototype, but inspection behavior should not destabilize the core timer.

Keyboard Shortcuts:

- Space: timer hold/start.
- Running state: keypress stops timer.
- `N`: new scramble.
- `+` or `=`: toggle +2 on last solve.
- `D`: toggle DNF on last solve.
- `?`: show keyboard shortcuts.
- Escape: close modals, sheets, and panels.

Export:

- Export current session to CSV.
- Include solve number, time, penalty, scramble, comment, timestamp, and event.

## Architecture

Use feature directories. Keep domain logic independent from rendering where practical.

```txt
src/
  App.tsx
  index.css

  features/
    timer/
      TimerSurface.tsx
      useTimerController.ts
      timerFormat.ts

    scrambles/
      ScrambleBar.tsx
      ScrambleDraw.tsx
      scrambleService.ts
      eventMap.ts

    sessions/
      SessionSidebar.tsx
      SolveList.tsx
      SolveDetailModal.tsx
      sessionStore.ts
      solveStats.ts
      csvExport.ts
      types.ts

    analytics/
      ProgressChart.tsx
      Histogram.tsx
      chartSeries.ts

    settings/
      SettingsPanel.tsx
      settingsStore.ts

    mobile/
      MobileNav.tsx
      MobileSheet.tsx

  shared/
    components/
      IconButton.tsx
      Toggle.tsx
      SegmentedControl.tsx
    storage/
      localStorageStore.ts
```

The exact file split may adapt during implementation, but the boundaries should remain:

- Timer state machine does not own sessions.
- Scramble generation does not own UI rendering.
- Stats calculations are testable pure functions.
- Chart data preparation is separate from canvas drawing.
- Storage adapters are isolated from feature components.

## State Model

Core types should include:

- `PuzzleEvent`
- `Solve`
- `Session`
- `TimerSettings`
- `AppState`
- `Penalty`

Minimal solve shape:

```ts
type Penalty = "OK" | "+2" | "DNF";

type Solve = {
  id: string;
  ms: number;
  eventId: string;
  scramble: string;
  timestamp: number;
  penalty: Penalty;
  comment?: string;
};
```

## Testing And Verification

Add focused tests for pure logic where possible:

- time formatting
- effective time with penalties
- average calculations
- rolling series
- CSV export escaping
- event mapping

Run:

- `vp install` after dependency changes.
- `vp check`
- `vp test`

After implementation, run the app locally with `vp dev` and verify:

- Desktop layout matches Studio reference.
- Mobile layout matches Studio mobile reference.
- Spacebar timer flow works.
- Mobile tap timer flow works.
- Scramble generation works for primary events.
- Solve management actions update stats and charts.
- Settings hide/show modules and affect mobile nav disabled states.
- CSV export downloads a usable file.

## Open Implementation Notes

- The Claude prototype uses placeholder scramble generation and custom canvas/SVG code. Production should keep the visual behavior but use `cubing` for scrambles.
- The scramble draw should be accurate for 2x2 and 3x3-style events first. Other events should get clear placeholders unless accurate rendering is added.
- The current app has uncommitted starter-file edits. They can be replaced during implementation because the existing UI is disposable.

## Manual Browser Verification

After automated checks pass, attempt manual testing with the Codex in-app browser and browser-use tooling.

Manual verification should include:

- Load the local dev server.
- Check desktop layout at a wide viewport.
- Check mobile layout at a narrow viewport.
- Start and stop a solve with the spacebar.
- Start and stop a solve with pointer/tap interaction.
- Change events and generate a new scramble.
- Open session, graph, draw, histogram, and settings on mobile.
- Toggle graph, histogram, draw, and density settings.
- Open a solve detail modal and apply +2, DNF, comment, and delete flows.
- Confirm no obvious console errors appear during core flows.
