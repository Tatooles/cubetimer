// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { App } from "./App";
import { generateScramble } from "./scramble";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("./scramble", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./scramble")>();
  return {
    ...actual,
    generateScramble: vi.fn(async () => "R U R' U'"),
  };
});

describe("App timer input", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.mocked(generateScramble).mockResolvedValue("R U R' U'");
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(<App />);
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("starts after holding and releasing a touch pointer", async () => {
    const timerDisplay = container.querySelector<HTMLElement>(".timer-display");
    expect(timerDisplay).not.toBeNull();

    act(() => {
      timerDisplay?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, isPrimary: true, pointerId: 1, pointerType: "touch" }));
    });
    expect(container.querySelector(".timer-status")?.textContent).toBe("Keep holding");

    act(() => vi.advanceTimersByTime(450));
    expect(container.querySelector(".timer-status")?.textContent).toBe("Release to start");

    act(() => {
      timerDisplay?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, isPrimary: true, pointerId: 1, pointerType: "touch" }));
    });
    expect(container.querySelector(".timer-status")?.textContent).toBe("Press any key or tap to stop");

    act(() => vi.advanceTimersByTime(1234));
    await act(async () => {
      timerDisplay?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, isPrimary: true, pointerId: 2, pointerType: "touch" }));
      await Promise.resolve();
    });

    expect(container.querySelector(".timer-status")?.textContent).toBe("Hold space or screen");
    expect(container.querySelector("[aria-label='Solve count']")?.textContent).toBe("1");
  });

  it("stops the running timer when tapping an interactive timer control", async () => {
    const timerDisplay = container.querySelector<HTMLElement>(".timer-display");
    const scrambleActions = container.querySelector<HTMLElement>("[aria-label='Scramble actions']");
    expect(timerDisplay).not.toBeNull();
    expect(scrambleActions).not.toBeNull();

    act(() => {
      timerDisplay?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, isPrimary: true, pointerId: 1, pointerType: "touch" }));
    });
    act(() => vi.advanceTimersByTime(450));
    act(() => {
      timerDisplay?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, isPrimary: true, pointerId: 1, pointerType: "touch" }));
    });
    expect(container.querySelector(".timer-status")?.textContent).toBe("Press any key or tap to stop");

    act(() => vi.advanceTimersByTime(1234));
    await act(async () => {
      scrambleActions?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, isPrimary: true, pointerId: 2, pointerType: "touch" }));
      await Promise.resolve();
    });

    expect(container.querySelector(".timer-status")?.textContent).toBe("Hold space or screen");
    expect(container.querySelector("[aria-label='Solve count']")?.textContent).toBe("1");
  });

  it("keeps scramble navigation disabled while the next scramble is generating", async () => {
    const generate = vi.mocked(generateScramble);
    const previousButton = buttonNamed("Previous");
    const nextButton = buttonNamed("Next");

    generate.mockResolvedValueOnce("F R U");
    await act(async () => {
      nextButton.click();
      await Promise.resolve();
    });
    expect(previousButton.disabled).toBe(false);

    const pendingScramble = deferred<string>();
    generate.mockReturnValueOnce(pendingScramble.promise);
    await act(async () => {
      nextButton.click();
      await Promise.resolve();
    });

    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(true);

    await act(async () => {
      pendingScramble.resolve("B L D");
      await pendingScramble.promise;
    });

    expect(previousButton.disabled).toBe(false);
    expect(nextButton.disabled).toBe(false);
  });

  function buttonNamed(name: string): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll("button")).find((element) => element.textContent === name);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    return button as HTMLButtonElement;
  }
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}
