import { describe, it, expect, beforeEach } from "vitest";
import {
  addHistory,
  getHistory,
  removeHistory,
  restoreHistory,
  clearHistory,
  restoreAllHistory,
  type ZakatHistory,
} from "./zakat";

/**
 * Regression: Undo state must remain correct after a full page reload,
 * across every supported viewport. "Reload" is modeled by re-reading
 * from localStorage (the single source of truth) — the same path the
 * app takes on mount via getHistory().
 *
 * Viewports mirror the device list supported by the preview/browser
 * automation (mobile, tablet, laptop, desktop), since the Undo data
 * path is shared across all of them and must stay viewport-agnostic.
 */

const VIEWPORTS: Array<{ name: string; width: number; height: number }> = [
  { name: "mobile-sm", width: 320, height: 568 },
  { name: "mobile-md", width: 375, height: 812 },
  { name: "mobile-lg", width: 414, height: 896 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "tablet-lg", width: 834, height: 1194 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 },
];

const MOBILE_BREAKPOINT = 768;

const setViewport = (w: number, h: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: w });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: h });
  // Match the matchMedia shim from src/test/setup.ts but make it width-aware
  // so use-mobile / responsive components see the right viewport.
  window.matchMedia = ((query: string) => {
    const m = /max-width:\s*(\d+)px/.exec(query);
    const matches = m ? w <= Number(m[1]) : false;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  }) as unknown as typeof window.matchMedia;
  window.dispatchEvent(new Event("resize"));
};

const seed = (n: number): ZakatHistory[] => {
  clearHistory();
  for (let i = 0; i < n; i++) {
    addHistory({ type: "Penghasilan", amount: (i + 1) * 1000 });
  }
  return getHistory();
};

const snapshotAnchors = (item: ZakatHistory) => {
  const list = getHistory();
  const idx = list.findIndex((h) => h.id === item.id);
  return {
    idx,
    predecessorId: idx > 0 ? list[idx - 1].id : null,
    successorId: idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : null,
  };
};

/** Simulates a hard reload: drop in-memory refs, keep localStorage intact. */
const reload = () => {
  // Nothing to do for the data layer — getHistory() always re-reads from
  // localStorage. This helper exists to make intent explicit in tests.
  return getHistory();
};

beforeEach(() => {
  localStorage.clear();
});

describe("Undo regression: state survives reload across viewports", () => {
  for (const vp of VIEWPORTS) {
    describe(`viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      beforeEach(() => setViewport(vp.width, vp.height));

      it("single delete → reload → Undo restores at original slot", () => {
        const items = seed(4);
        const target = items[2];
        const a = snapshotAnchors(target);
        removeHistory(target.id);

        // Reload
        const afterReload = reload();
        expect(afterReload.find((h) => h.id === target.id)).toBeUndefined();
        expect(afterReload).toHaveLength(3);

        // Undo after reload
        restoreHistory(target, a.idx, {
          predecessorId: a.predecessorId,
          successorId: a.successorId,
        });

        const final = getHistory();
        expect(final.map((h) => h.id)).toEqual(items.map((i) => i.id));
        // No duplicates
        expect(new Set(final.map((h) => h.id)).size).toBe(final.length);
      });

      it("Hapus Semua → reload → Undo restores full snapshot without duplicates", () => {
        const snapshot = seed(3);
        clearHistory();

        // Reload sees empty list
        expect(reload()).toEqual([]);

        restoreAllHistory(snapshot);

        const final = getHistory();
        expect(final.map((h) => h.id)).toEqual(snapshot.map((s) => s.id));
        expect(new Set(final.map((h) => h.id)).size).toBe(final.length);
      });

      it("delete → Undo → reload → Undo again is a no-op (idempotent across reload)", () => {
        const items = seed(3);
        const target = items[1];
        const a = snapshotAnchors(target);

        removeHistory(target.id);
        restoreHistory(target, a.idx, {
          predecessorId: a.predecessorId,
          successorId: a.successorId,
        });

        // Reload, then attempt Undo again from the stale toast action
        reload();
        restoreHistory(target, a.idx, {
          predecessorId: a.predecessorId,
          successorId: a.successorId,
        });

        const ids = getHistory().map((h) => h.id);
        expect(ids).toEqual(items.map((i) => i.id));
        expect(ids.filter((id) => id === target.id)).toHaveLength(1);
      });

      it("Hapus Semua → new entry added → reload → Undo merges without duplicating new entry", () => {
        const snapshot = seed(2);
        clearHistory();
        addHistory({ type: "Maal", amount: 12345 });
        const added = getHistory()[0];

        reload();
        restoreAllHistory(snapshot);

        const ids = getHistory().map((h) => h.id);
        expect(ids[0]).toBe(added.id);
        expect(ids.slice(1)).toEqual(snapshot.map((s) => s.id));
        expect(new Set(ids).size).toBe(ids.length);
      });

      it("reports the expected mobile/desktop matchMedia state for this viewport", () => {
        // Sanity check: confirms the viewport shim is wired so components
        // that branch on screen size (e.g. ZakatRiwayat swipe-to-delete)
        // would render the right variant after reload.
        const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
        expect(isMobile).toBe(vp.width < MOBILE_BREAKPOINT);
      });
    });
  }
});
