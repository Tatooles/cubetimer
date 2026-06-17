# Training Section Implementation Design

Date: 2026-06-17

## Goal

Implement the Claude Design Training section as a native React feature in the current cube timer app. The existing Timer/session page remains the source of truth for all already-implemented behavior and visual treatment.

The only intended change to the Timer page is adding top-level navigation so users can switch between Timer and Training. All new product behavior, layout work, and training-specific state lives behind the Training tab.

## Source Material

- Primary design source: `claude-design-bundle/cube-timer/project/training.html`
- Supporting design logic: `training-engine.js` and `training-ui.js`
- Design transcript decision: Workbench is the selected Training layout; Focus was rejected and should not be implemented.
- Current app source: React, TypeScript, Tailwind, Vite+, Radix/Vaul components, existing mobile sheet/nav patterns, existing scramble draw and timer controller utilities.

## Scope

### In Scope

- Add a top-level app mode for `Timer` and `Training`.
- Preserve the existing Timer/session page except for the tab affordance.
- Build a new Training feature surface using existing app patterns and components.
- Implement the Workbench desktop layout:
  - left rail for cross history or algorithm rotation
  - center trainer content
  - right rail for settings and keyboard hints
- Implement the mobile Training layout:
  - compact top bar
  - Training mode switch
  - history/rotation side sheet
  - settings bottom sheet
  - no horizontal overflow
- Ship two trainer modes:
  - Cross/XCross trainer
  - Algorithm/subset trainer
- Store Training data separately from normal solve sessions.

### Out of Scope

- A real cross solver.
- Integrating algorithm training as a special event/session type inside the main Timer page.
- Changing normal session PB charts or solve history to include Training attempts.
- Reworking the existing Timer page layout, mobile nav, session rail, graph, histogram, scramble draw, or settings behavior.
- Shipping production-perfect algorithm databases for every advanced set.

## Navigation And Shell

`App.tsx` should be split enough to keep the Timer and Training surfaces isolated. The top-level app state will track the active section as `"timer"` or `"training"`.

The Timer section should continue rendering the current application shell with the same state, keyboard shortcuts, desktop rails, mobile nav, modals, and storage behavior. The header gains top-level tabs matching the design language:

- `Timer`: active when the existing session timer is visible
- `Training`: active when the new Training page is visible

The `Profile soon` placeholder from the prototype is not part of this implementation. The top-level navigation should expose only Timer and Training for this phase.

Keyboard handlers should be section-aware:

- Timer shortcuts only operate while the Timer section is active.
- Training shortcuts only operate while the Training section is active.
- Escape should close active overlays in the current section.

## Training Architecture

Create a focused feature directory:

```text
src/features/training/
```

Suggested modules:

- `types.ts`: Training state, settings, attempt, algorithm set, trainer mode types.
- `trainingStore.ts`: default state, demo/seed state, sanitizer, localStorage key, state update helpers.
- `crossTrainer.ts`: cross settings, scramble generation helpers, deterministic mocked cross solution.
- `algorithmCatalog.ts`: algorithm set catalog and subset defaults.
- `algorithmTrainer.ts`: algorithm rotation, subset helpers, timing record helpers, per-case stats.
- `TrainingPage.tsx`: top-level Training layout and mode coordination.
- `TrainingHeader.tsx`: Training sub-mode picker.
- `TrainingSidebar.tsx`: cross history or algorithm rotation list.
- `CrossTrainer.tsx`: center Cross/XCross surface.
- `CrossSettings.tsx`: right-rail/mobile-sheet controls for cross mode.
- `AlgorithmTrainer.tsx`: center algorithm trainer surface.
- `AlgorithmSettings.tsx`: right-rail/mobile-sheet controls for algorithm mode.
- `SubsetEditor.tsx`: modal or drawer for selecting subset cases.
- `TrainingMobileNav.tsx`: mobile History/Settings nav for Training.

This split keeps the new Training feature understandable and prevents `App.tsx` from becoming the owner of training-specific business logic.

## Training State And Persistence

Use a separate localStorage namespace from normal sessions, for example:

```text
cube-timer-training-v1
```

Training state should include:

- active trainer mode: `cross` or `algorithms`
- cross settings:
  - cross color
  - move target, 4 to 12
  - XCross enabled
  - short scramble enabled
  - inspection enabled
  - reveal mode, one-at-a-time or all-at-once
- cross attempts/history:
  - id
  - scramble
  - mocked solution moves
  - move count
  - rating: good, okay, missed
  - flagged
  - xcross
  - timestamp
- algorithm settings:
  - active set
  - drill or subset mode
  - selected subsets by set id
- algorithm history:
  - times grouped by algorithm case
  - timestamped attempts for each recorded time

The sanitizer should tolerate missing, malformed, or old values and fall back to defaults. Training storage must not read from or write to `APP_STORAGE_KEY`.

## Cross/XCross Trainer

The Cross trainer should match the Workbench design while using existing app utilities where possible.

Behavior:

- Generate a 3x3 scramble.
- Render the scramble text prominently.
- Render the existing 2D cube net using `ScrambleDraw` or a shared cube-net renderer.
- Allow cross color selection across white, yellow, green, blue, red, and orange.
- Allow a move target from 4 to 12.
- Toggle XCross practice.
- Toggle short scrambles.
- Start a 15-second inspection countdown when enabled/requested.
- Reveal the mocked cross solution one move at a time or all at once.
- Flag and copy the current scramble.
- Record a Good/Okay/Missed self-rating into Training history.
- Show recent cross attempts in the left rail or mobile history sheet.

The mocked cross solver should be deterministic for a given scramble and settings. It should produce plausible move tokens and move counts, but it must be clearly treated as placeholder logic in code boundaries and tests. A real solver remains a future replacement behind the same helper interface.

## Algorithm/Subset Trainer

The Algorithm trainer should ship as a separate Training mode, not as a main Timer event.

Behavior:

- Support these sets:
  - OLL
  - PLL
  - COLL
  - ZBLL
  - Last slot + last layer
  - 2x2 CLL
  - 4x4 PLL/parity
- Provide drill mode across the active set.
- Provide subset mode across selected cases.
- Provide a subset editor grouped by algorithm family.
- Display:
  - case id/name
  - group/family
  - algorithm sequence
  - setup sequence
  - cube net generated from setup sequence when possible
- Reuse the existing `useTimerController` pattern for algorithm timing.
- Record per-case times separately from normal solves.
- Show recent times, best, and ao5 for the current case.
- Show the active algorithm rotation in the left rail or mobile history sheet.

Catalog quality for this phase follows the design artifact: PLL can use real entries, and other advanced sets may use design-density placeholder data where needed. The code should isolate catalog data so future real datasets can replace placeholder entries without changing UI components.

## Layout And Visual Design

Training should visually match the existing Studio implementation:

- near-black background
- off-white text
- muted zinc text
- indigo accent
- monospaced numeric/case information
- subtle borders and compact rails
- restrained, utilitarian controls

Use existing shared primitives where they fit:

- `Tabs` or equivalent styling for top-level navigation
- `SegmentedControl`
- `Toggle`
- `Sheet`
- `Drawer`
- existing `MobileSheet`/mobile drawer vocabulary where practical
- `IconButton` and lucide icons where icon buttons are needed

Desktop target:

- Training uses a three-column Workbench layout similar to the design: left rail, center content, right rail.
- Rails should scroll independently if content exceeds height.
- Center content should avoid horizontal overflow from long scrambles or algorithm strings.

Mobile target:

- Training should not reuse the desktop three-column structure directly.
- The center content becomes the primary screen.
- The left rail becomes a side sheet.
- The right settings rail becomes a bottom sheet.
- A Training-specific bottom nav exposes History/Rotation and Settings.
- Long scrambles, status pills, rating buttons, and action rows must wrap within the viewport.
- There must be no right-side horizontal overflow at common phone widths around 390 to 430px.

## Error Handling And Empty States

- If scramble generation fails, show a compact inline error and allow retry.
- If clipboard copy fails, leave the UI stable and avoid blocking the trainer.
- If an algorithm subset is empty, show an explicit empty state with an action to edit the subset.
- If localStorage data is invalid, sanitize to defaults without crashing.
- If cube-net rendering cannot parse a placeholder algorithm/setup, render a safe fallback net or placeholder instead of throwing.

## Testing And Verification

Unit tests should cover:

- Training store defaults and sanitization.
- Training storage isolation from normal app sessions.
- Deterministic mocked cross solution output.
- Cross history rating/flag updates.
- Algorithm set selection and subset filtering.
- Per-case algorithm timing records and simple best/ao5 stats.
- Section-aware keyboard shortcut behavior where feasible.

Component tests should cover:

- App can switch between Timer and Training.
- Timer surface still renders when Timer is active.
- Training defaults to Cross mode.
- Cross/Algorithms sub-mode switch works.
- Cross settings update visible status and solution metadata.
- Algorithm subset empty state and subset selection flow.
- Mobile Training nav opens the history/rotation and settings surfaces.

Manual verification should include:

- `vp install` after pulling remote changes if needed.
- `vp check`
- `vp test`
- Browser verification at desktop and mobile widths.
- Confirm no horizontal overflow in Training mobile Cross and Algorithms modes.
- Confirm normal Timer mobile layout still works after adding top-level tabs.

## Implementation Notes

Avoid copying `training.html` directly. Treat the prototype as the visual and behavioral target, then implement using the repo's React, TypeScript, Tailwind, and component conventions.

Prefer extracting the existing Timer page into a `TimerPage` component before adding Training if that keeps `App.tsx` readable. This extraction should be mechanical and behavior-preserving.

Do not stage or commit the downloaded Claude Design bundle as production source. It can remain local reference material or be moved to ignored design docs later if desired.

## Acceptance Criteria

- Timer page behavior is unchanged except for top-level navigation.
- Training tab renders the Workbench design as a native React feature.
- Cross trainer supports all scoped controls and records separate history.
- Algorithm trainer supports the scoped sets, drill/subset modes, timing, subset editor, and per-case stats.
- Training storage is separate from normal sessions.
- Desktop and mobile Training layouts match the design direction and current app style.
- Mobile Training has no horizontal overflow at common phone widths.
- Existing tests pass, and new tests cover the new Training state and key UI flows.
