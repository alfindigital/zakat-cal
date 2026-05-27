import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addHistory,
  getHistory,
  removeHistory,
  restoreHistory,
  clearHistory,
  restoreAllHistory,
  subscribeHistory,
  type ZakatHistory,
} from "./zakat";

/**
 * Simulates cross-tab sync. In a real browser, Tab B would receive a
 * `storage` event when Tab A writes to localStorage. JSDOM doesn't fire
 * storage events for same-window writes, so we model "Tab B" as a
 * subscriber in the SAME jsdom window — the custom `zakat-history-changed`
 * event fires for every mutation (this is exactly what powers cross-tab
 * refresh in production via the storage listener), and we additionally
 * dispatch a synthetic StorageEvent to prove the storage path also works.
 */

const STORAGE_KEY = "zakat-history";

const seed = (n: number): ZakatHistory[] => {
  clearHistory();
  for (let i = 0; i < n; i++) {
    addHistory({ type: "Penghasilan", amount: (i + 1) * 1000 });
  }
  return getHistory();
};

beforeEach(() => {
  localStorage.clear();
});

describe("Cross-tab Undo sync", () => {
  it("Tab B is notified when Tab A deletes and undoes a single item", () => {
    const items = seed(3);
    const tabB = vi.fn();
    const unsub = subscribeHistory(tabB);

    // Tab A deletes items[1]
    const idx = 1;
    const predecessorId = items[idx - 1].id;
    const successorId = items[idx + 1].id;
    removeHistory(items[1].id);

    // Tab A undoes
    restoreHistory(items[1], idx, { predecessorId, successorId });

    // Tab B should have been notified for BOTH the delete and the restore
    expect(tabB).toHaveBeenCalledTimes(2);

    // And Tab B sees the final state via its own read
    expect(getHistory().map((h) => h.id)).toEqual(items.map((i) => i.id));

    unsub();
  });

  it("Tab B sees 'Hapus Semua' + Undo without duplicates", () => {
    const snapshot = seed(3);
    const tabBStates: string[][] = [];
    const unsub = subscribeHistory(() => {
      tabBStates.push(getHistory().map((h) => h.id));
    });

    // Tab A clears all
    clearHistory();
    // Tab A undoes
    restoreAllHistory(snapshot);

    expect(tabBStates).toHaveLength(2);
    expect(tabBStates[0]).toEqual([]); // after clear
    expect(tabBStates[1]).toEqual(snapshot.map((s) => s.id)); // after undo

    // No duplicates after restore
    const finalIds = getHistory().map((h) => h.id);
    expect(new Set(finalIds).size).toBe(finalIds.length);
    expect(finalIds).toEqual(snapshot.map((s) => s.id));

    unsub();
  });

  it("double-clicking Undo on 'Hapus Semua' in Tab A does not create duplicates in Tab B's view", () => {
    const snapshot = seed(2);
    const tabB = vi.fn();
    const unsub = subscribeHistory(tabB);

    clearHistory();
    restoreAllHistory(snapshot);
    restoreAllHistory(snapshot); // second click (e.g. stale toast action)

    // Tab B was notified for each mutation, but the state remains de-duped
    const finalIds = getHistory().map((h) => h.id);
    expect(new Set(finalIds).size).toBe(finalIds.length);
    expect(finalIds).toEqual(snapshot.map((s) => s.id));

    expect(tabB.mock.calls.length).toBeGreaterThanOrEqual(3);
    unsub();
  });

  it("subscribeHistory responds to a real cross-tab StorageEvent", () => {
    const tabB = vi.fn();
    const unsub = subscribeHistory(tabB);

    // Simulate another tab writing to the same key
    const evt = new StorageEvent("storage", {
      key: STORAGE_KEY,
      newValue: JSON.stringify([]),
    });
    window.dispatchEvent(evt);

    expect(tabB).toHaveBeenCalledTimes(1);
    unsub();
  });

  it("unsubscribed listeners stop receiving notifications", () => {
    const tabB = vi.fn();
    const unsub = subscribeHistory(tabB);

    addHistory({ type: "Maal", amount: 1 });
    expect(tabB).toHaveBeenCalledTimes(1);

    unsub();

    addHistory({ type: "Maal", amount: 2 });
    removeHistory(getHistory()[0].id);
    expect(tabB).toHaveBeenCalledTimes(1); // unchanged
  });
});
