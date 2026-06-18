# Training Section Design

_Started 2026-05-23 20:53 UTC_

---

## User

i would like to add a "training" section to this application. It should essentialyl be a whole new section of the application, separate from their sessions. In this section, the user should be able to train on algotithms, cross, f2l, and other things. The two tools I want first are a "cross trainer" similar to the one here https://solved.no/trainers/3x3/inspection/cross

The training section should ship with two main features:
- Cross/XCross trainer
- Algorithm/subset trainer

What the cross trainer should include:
- Draw scramble
- Choose cross color
- Choose number of moves for cross
- Option to practice cross or XCross
- Option to choose between normal or short scrambles
- Ability to reveal cross solution move-by-move or all at once
- Ability to flag or save a scramble

the algorithm/subset trainer should include:
- Similar UI to the main session timer with scramble, draw scramble, times and a graph. I'm open to including this feature in the main session timer as a special event/scramble type.
- Ability to choose between algorithm sets or solve sections. It should shop with these options: OLL, PLL, COLL, ZBLL, last slot + last layer, 2x2 CLL, 4x4 PLL (different due to parity)

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: questions_v2]_

Before I build, I want to align on a few things — this is a big new surface area, and the answers shape the whole architecture.

## User

Questions answered:
- navigation: Top-level tabs. Also include a placeholder tab for "profile" which will be added in the future
- alg_trainer_placement: Special event type in main timer, but it should be differentiated from simply a different type of scramble/event. It should maybe be a special type of session type vs a WCA solve session
- cross_solver: Use a placeholder for the solution (mocked moves) — pure design pass
- cube_render: Keep the flat 2D net (matches current app)
- cross_features: Self-rating after revealing (good / okay / missed), Inspection timer countdown (15s like WCA), Move count target — try to find a cross in ≤N moves
- alg_sets_priority: OLL (57 algs), PLL (21 algs), COLL (40 algs), ZBLL (493 algs), 2x2 CLL (42 algs), Last slot + last layer (Winter Variation, VLS, etc.), 4x4 PLL parity
- alg_trainer_modes: Both — toggle between drill and subset
- stats_persistence: Yes — separate 'training sessions' (won't pollute PB chart)
- variations: 2 layouts side-by-side in the design canvas
- visual_style: Match the studio direction exactly (mono dark, indigo accent, JetBrains Mono)

## Assistant

_[tool: update_todos]_

Great, clear plan. Let me build this out — two training layouts in the design canvas, top-level tabs in the topbar.

_[tool: read_file]_

_[tool: str_replace_edit]_

Got it. Let me start by adding tabs to studio, then build the training engine and both layouts.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: write_file]_

Now build the training engine — alg data, mock cross solver, training session storage.

_[tool: write_file]_

Now let me build training.html — Direction A "Focus" (centered, single-task).

_[tool: write_file]_

Now the shared training UI logic.

_[tool: show_html]_

Let me verify training.html loads before building Direction B.

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: eval_js]_

_[tool: str_replace_edit]_

Alg trainer view isn't pre-rendered. Let me fix init to render both stages.

_[tool: show_to_user]_

Let me surface this to the user so we can check screenshots.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: view_image]_

_[tool: write_file]_

Looks great. Now Direction B — a three-pane "Workbench" layout.

_[tool: show_to_user]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: str_replace_edit]_

There's a class-naming mismatch (`missed` vs `miss`) and Direction B doesn't have row styling for the seeded items. Let me fix both.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Now add row styling to Direction B for the history items.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: str_replace_edit]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: grep]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: eval_js]_

_[tool: str_replace_edit]_

Now let me wire training into the cube-timer design canvas.

_[tool: str_replace_edit]_

_[tool: show_to_user]_

Let me verify studio.html still works with the new tabs, then call done.

_[tool: save_screenshot]_

_[tool: view_image]_

_[tool: register_assets]_

Now let me also register the new training assets and check the design canvas.

_[tool: done]_

_[tool: update_todos]_

_[tool: fork_verifier_agent]_

Built out the Training section. Here's what shipped:

**Top-level tabs** added to `studio.html` (and both training files): Timer · Training · Profile (soon, disabled).

**Two layouts in the design canvas** (`cube-timer.html`):

- **A · Focus** (`training.html`) — Centered single-task layout. Big scramble, big cube net, prominent "Reveal next move" action, inspection countdown ring, self-rating row, recent-attempts strip. Settings open from a top-right drawer.
- **B · Workbench** (`training-b.html`) — Three-pane studio mirror. Persistent left rail of scramble history (rated/flagged, XCross-tagged), centered scramble + net + solution, persistent right rail with always-visible settings + shortcut legend.

**Both layouts contain both trainers**, toggled by the Cross / Algorithms sub-picker:

- **Cross trainer** — color picker (6 face colors), ≤N moves slider (4–12), XCross toggle, short-scramble toggle, 15s inspection countdown, reveal one-at-a-time vs all-at-once, flag/copy, Good/Okay/Missed self-rating that persists to history.
- **Algorithm trainer** — 7 sets ready (OLL 57 · PLL 21 · COLL 40 · ZBLL 421 · 2x2 CLL 42 · LS+LL 72 · 4x4 parity 4). PLL has real algs; OLL has 21 real cases + plausible mocks; rest are mocked for design density. Drill / Subset mode toggle with a subset-editor modal that groups cases by family.

Shared logic lives in `training-engine.js` + `training-ui.js`; the two layouts are CSS-only forks. Cross solution moves are deterministic placeholders (per your "pure design pass" choice — a real solver would need IDA*). Training session data lives in a separate localStorage namespace so it never pollutes the PB chart.

Open `cube-timer.html` to compare the two side-by-side. Lots of knobs to play with — the obvious next steps are picking a layout, deciding whether the alg trainer should also be reachable as a special "training event" in the main timer, and swapping in a real cross solver if you want the solutions to be correct.

## User

I this all one big project, or are you providing separate designs. I'm just wondering what the difference is between the "focus" and "workbench" is

Don't make any changes

## Assistant

## Assistant

It's one project — both files are the same Training section, just two **layout directions** for you to choose between. Same features, same code under the hood (they share `training-engine.js` + `training-ui.js`); the only real difference is CSS/layout. You'd pick one to ship.

Here's the distinction:

**A · Focus** (`training.html`)
- One centered column, one thing at a time.
- No side panels — settings live in a drawer you open from the top-right gear; history is a strip at the bottom.
- The scramble, cube, and "reveal" action are big and front-and-center.
- Feels calm and minimal — good if you want to just drill without distraction. Closer to solved.no's clean inspection trainer.

**B · Workbench** (`training-b.html`)
- Three panes, like a workstation — and intentionally mirrors your main Timer's layout.
- **Left rail**: persistent scramble history (ratings, flags, XCross tags) always visible.
- **Right rail**: settings always on-screen (no drawer) + a keyboard-shortcut legend.
- **Center**: scramble + cube + solution.
- Denser, more "at a glance" — good if you want history and controls visible while you work, and consistency with the Timer tab.

So: **same product, two skins.** Focus = minimal/centered, Workbench = dense/multi-pane matching your existing timer. They're presented side-by-side in the canvas so you can compare and pick — whichever you choose, the other becomes throwaway and the winner stays as the Training section.

One thing worth noting: the cross solutions in both are placeholder moves (per your "pure design pass" call earlier), so don't read them as correct yet.

Want me to do anything once you've picked, or leave it as-is for now?

## User

I definitely prefer the workbench approach.

## Assistant

Great choice — Workbench fits your app better and keeps the Training tab consistent with the Timer.

Here's what I'd do to lock it in (no changes made yet — just confirming before I touch files):

1. **Promote Workbench to the canonical Training section** — make `training-b.html` the real `training.html` (so the "Training" tab in the top bar lands on it), and retire the Focus version.
2. **Update the design canvas** — drop the two Focus artboards, keep the two Workbench ones (Cross + Algorithms).
3. Leave the shared `training-engine.js` / `training-ui.js` untouched — they already power it.

A couple of quick questions before I proceed:

- **Keep a copy of Focus** (e.g. `training-focus.html`) in case you want to revisit it, or delete it outright?
- Want me to keep the **side-by-side comparison in the canvas** (Cross + Algorithms views of Workbench), or is the canvas no longer needed now that you've decided?

Say the word and I'll consolidate.

## User

I think we can get rid of focus, and I don't think we need the side by sides in the canvas. the canvas is a bit hard for me to navigate

## Assistant

## Assistant

_[tool: grep]_

_[tool: read_file]_

Done deciding — let me consolidate. I'll make Workbench the real Training page, delete Focus, and pull the training side-by-sides out of the canvas.

_[tool: copy_files]_

Now executing the consolidation:

_[tool: str_replace_edit]_

_[tool: unregister_assets]_

Now remove the training section from the canvas and clean up the intro copy:

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

Now register the consolidated training page and verify it loads:

_[tool: register_assets]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Consolidated. Here's the cleanup:

- **`training.html` is now the Workbench** — it's the canonical Training section. The "Training" tab in the timer lands here.
- **Focus is gone** — deleted, along with the `training-b.html` duplicate.
- **Canvas cleaned up** — the four training side-by-sides are removed; `cube-timer.html` now only holds the timer directions. The intro points you straight to `training.html`.

Going forward, just open **`training.html`** directly — no canvas navigation needed. The Cross / Algorithms sub-picker at the top switches between the two trainers.

Whenever you're ready, the natural next steps are still: a real cross solver (to replace the placeholder moves), and deciding whether the algorithm trainer should also surface as a "training event" inside the main timer.

## User

Verifier agent check completed

## Assistant

Good catch from the verifier — the rail header label is hardcoded. Quick fix:

_[tool: str_replace_edit]_

_[tool: done]_

Fixed — the right-rail header (`#alg-set-name`) now updates to the active set label in `renderAlg()`, so it stays in sync with the set picker, summary, sidebar, and displayed case instead of always reading "PLL".

