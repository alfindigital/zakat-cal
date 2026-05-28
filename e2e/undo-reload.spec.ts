import { test, expect } from "../playwright-fixture";

/**
 * E2E: rapid repeated deletes → multiple Urungkan → reload
 *
 * Verifies the riwayat order is restored and persists across a full
 * page reload, on both mobile and desktop viewports.
 */

const STORAGE_KEY = "zakat-history";

type SeedItem = { id: string; date: string; type: "Penghasilan" | "Maal" | "Fitrah"; amount: number };

const SEED: SeedItem[] = [
  { id: "e2e-1", date: "1 Januari 2026", type: "Penghasilan", amount: 1_000_000 },
  { id: "e2e-2", date: "2 Januari 2026", type: "Maal", amount: 2_000_000 },
  { id: "e2e-3", date: "3 Januari 2026", type: "Fitrah", amount: 3_000_000 },
  { id: "e2e-4", date: "4 Januari 2026", type: "Penghasilan", amount: 4_000_000 },
  { id: "e2e-5", date: "5 Januari 2026", type: "Maal", amount: 5_000_000 },
];

async function seedHistory(page: import("@playwright/test").Page, items: SeedItem[]) {
  await page.addInitScript(
    ({ key, data }) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch {}
    },
    { key: STORAGE_KEY, data: items },
  );
}

async function readHistoryIds(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate((key) => {
    try {
      return (JSON.parse(localStorage.getItem(key) || "[]") as Array<{ id: string }>).map((h) => h.id);
    } catch {
      return [];
    }
  }, STORAGE_KEY);
}

function runUndoSuite(label: string, viewport: { width: number; height: number }) {
  test.describe(`${label} — Undo rapid delete + reload`, () => {
    test.use({ viewport });

    test("rapid deletes, multiple Urungkan clicks, then reload keeps order intact", async ({ page }) => {
      await seedHistory(page, SEED);
      await page.goto("/");

      await expect(page.getByRole("heading", { name: "Riwayat Perhitungan" })).toBeVisible();

      // Initial sanity check
      expect(await readHistoryIds(page)).toEqual(SEED.map((s) => s.id));

      // --- Rapid repeated deletes ---
      // Delete the middle 3 items (e2e-2, e2e-3, e2e-4) one after another.
      // On mobile the delete control is the swipe-revealed button; on desktop
      // it's the inline icon button. Both share aria-label "Hapus riwayat",
      // and on mobile both controls are present in the DOM (the swipe button
      // is just hidden behind the card). Targeting by aria-label + nth works
      // on both viewports because we always remove the first remaining row.
      const targets = ["e2e-2", "e2e-3", "e2e-4"];
      for (const id of targets) {
        const row = page.locator(`[data-history-id="${id}"]`).first();
        // Fallback path: if rows aren't tagged, use Rupiah text to locate.
        const exists = await row.count();
        if (exists > 0) {
          await row.getByRole("button", { name: "Hapus riwayat" }).first().click();
        } else {
          const seed = SEED.find((s) => s.id === id)!;
          const amountText = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(seed.amount);
          await page
            .getByText(amountText, { exact: false })
            .first()
            .locator("xpath=ancestor::*[self::div][.//button[@aria-label='Hapus riwayat']][1]")
            .getByRole("button", { name: "Hapus riwayat" })
            .first()
            .click();
        }
      }

      // After rapid deletes, only the bookend items remain.
      await expect.poll(() => readHistoryIds(page)).toEqual(["e2e-1", "e2e-5"]);

      // --- Press Urungkan multiple times ---
      // Sonner stacks toasts newest-on-top. Click every available Urungkan
      // action; double-click each one to verify idempotency.
      // Some toasts may auto-dismiss before we get to them — that's fine,
      // we just click whatever is currently visible until none remain.
      for (let i = 0; i < 10; i++) {
        const undo = page.getByRole("button", { name: "Urungkan" }).first();
        if (await undo.count() === 0) break;
        if (!(await undo.isVisible().catch(() => false))) break;
        await undo.click();
        // Try a quick second click in case the toast is still around
        // (idempotent restore must not duplicate).
        const stillThere = page.getByRole("button", { name: "Urungkan" }).first();
        if (await stillThere.count() > 0 && (await stillThere.isVisible().catch(() => false))) {
          await stillThere.click().catch(() => {});
        }
      }

      // --- Verify order in storage before reload ---
      await expect
        .poll(() => readHistoryIds(page), { timeout: 5_000 })
        .toEqual(SEED.map((s) => s.id));

      // --- Reload the page ---
      await page.reload();
      await expect(page.getByRole("heading", { name: "Riwayat Perhitungan" })).toBeVisible();

      // Order must still match the original seed, with no duplicates.
      const afterReload = await readHistoryIds(page);
      expect(afterReload).toEqual(SEED.map((s) => s.id));
      expect(new Set(afterReload).size).toBe(afterReload.length);
    });
  });
}

runUndoSuite("Mobile (iPhone 12)", { width: 390, height: 844 });
runUndoSuite("Desktop (1280x800)", { width: 1280, height: 800 });
