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

beforeEach(() => {
  localStorage.clear();
});

describe("Undo edge cases", () => {
  it("rapid repeated deletes can each be undone back to original positions", () => {
    const items = seed(5); // newest-first: items[0] is newest
    const originalIds = items.map((i) => i.id);

    // Delete items at index 1, 2, 3 in rapid succession (capture anchors BEFORE each delete)
    const targets = [items[1], items[2], items[3]];
    const anchors = targets.map((t) => {
      const a = snapshotAnchors(t);
      removeHistory(t.id);
      return { item: t, ...a };
    });

    expect(getHistory().map((h) => h.id)).toEqual([items[0].id, items[4].id]);

    // Undo in reverse order (most recent toast first, like sonner stack)
    for (const a of anchors.reverse()) {
      restoreHistory(a.item, a.idx, {
        predecessorId: a.predecessorId,
        successorId: a.successorId,
      });
    }

    expect(getHistory().map((h) => h.id)).toEqual(originalIds);
  });

  it("pressing Undo multiple times is idempotent (no duplicates)", () => {
    const items = seed(3);
    const target = items[1];
    const a = snapshotAnchors(target);
    removeHistory(target.id);

    restoreHistory(target, a.idx, { predecessorId: a.predecessorId, successorId: a.successorId });
    restoreHistory(target, a.idx, { predecessorId: a.predecessorId, successorId: a.successorId });
    restoreHistory(target, a.idx, { predecessorId: a.predecessorId, successorId: a.successorId });

    const ids = getHistory().map((h) => h.id);
    expect(ids.filter((id) => id === target.id)).toHaveLength(1);
    expect(ids).toEqual(items.map((i) => i.id));
  });

  it("Undo lands at successor when predecessor was deleted meanwhile", () => {
    const items = seed(4); // [3,2,1,0] by recency
    const target = items[2];
    const a = snapshotAnchors(target);
    removeHistory(target.id);

    // Meanwhile, the predecessor (items[1]) is also deleted
    removeHistory(items[1].id);

    restoreHistory(target, a.idx, { predecessorId: a.predecessorId, successorId: a.successorId });

    // Should slot in BEFORE successor (items[3]), regardless of original index
    const list = getHistory();
    const ti = list.findIndex((h) => h.id === target.id);
    const si = list.findIndex((h) => h.id === items[3].id);
    expect(ti).toBeGreaterThanOrEqual(0);
    expect(ti).toBe(si - 1);
  });

  it("Undo falls back to clamped index when both anchors are gone", () => {
    const items = seed(3);
    const target = items[1];
    const a = snapshotAnchors(target);
    removeHistory(target.id);

    // Wipe both neighbors
    removeHistory(items[0].id);
    removeHistory(items[2].id);

    restoreHistory(target, a.idx, { predecessorId: a.predecessorId, successorId: a.successorId });

    expect(getHistory().map((h) => h.id)).toEqual([target.id]);
  });

  it("state survives a 'page reload' (re-read from localStorage)", () => {
    const items = seed(3);
    const target = items[1];
    const a = snapshotAnchors(target);
    removeHistory(target.id);

    // Simulate reload by re-reading via getHistory (state comes from localStorage)
    const afterDelete = getHistory();
    expect(afterDelete.map((h) => h.id)).toEqual([items[0].id, items[2].id]);

    // Undo after "reload"
    restoreHistory(target, a.idx, { predecessorId: a.predecessorId, successorId: a.successorId });
    expect(getHistory().map((h) => h.id)).toEqual(items.map((i) => i.id));
  });

  it("Undo 'Hapus Semua' merges with items added after the clear", () => {
    const snapshot = seed(2);
    clearHistory();

    // User added a new entry before pressing Undo
    addHistory({ type: "Maal", amount: 9999 });
    const added = getHistory()[0];

    restoreAllHistory(snapshot);

    const ids = getHistory().map((h) => h.id);
    // New item kept at top, snapshot restored after
    expect(ids[0]).toBe(added.id);
    expect(ids.slice(1)).toEqual(snapshot.map((s) => s.id));
  });

  it("double-clicking Undo on 'Hapus Semua' does not duplicate items", () => {
    const snapshot = seed(3);
    clearHistory();

    restoreAllHistory(snapshot);
    restoreAllHistory(snapshot);

    expect(getHistory().map((h) => h.id)).toEqual(snapshot.map((s) => s.id));
  });
});
