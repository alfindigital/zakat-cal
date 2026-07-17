import { test, expect } from "../playwright-fixture";

/**
 * Kontrak aksesibilitas: pergantian mode Zakat Fitrah (beras ↔ uang)
 * TIDAK boleh meninggalkan `aria-invalid` yatim atau `aria-describedby`
 * yang mengarah ke pesan error milik mode lain.
 *
 * Field yang di-unmount saat mode berubah:
 *  - Mode beras → `#fitrah-custom` (opsional) & Select "Jenis Beras"
 *  - Mode uang  → `#fitrah-uang` (wajib)
 *
 * Yang dijaga spec ini:
 *  1. Pesan error milik mode lain hilang total dari DOM setelah mode
 *     berganti (`#fitrah-uang-error` / `#fitrah-custom-error`).
 *  2. `aria-describedby` pada input yang tetap ada (`#fitrah-jiwa`)
 *     tidak pernah menunjuk id yang sudah tidak ada di DOM.
 *  3. Input yang baru muncul karena ganti mode boleh menjadi invalid
 *     (karena state `attempted` sudah true), tapi hanya boleh
 *     `aria-describedby` ke id error miliknya sendiri.
 */
test.describe("Zakat Fitrah — cleanup aria saat ganti mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Zakat Fitrah" }).first().click();
  });

  test("beras → uang: pesan error beras tidak boleh tertinggal & aria-describedby konsisten", async ({ page }) => {
    // Trigger validasi di mode beras dulu
    await page.getByRole("radio", { name: /Beras/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const jiwa = page.locator("#fitrah-jiwa");
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");
    await expect(page.locator("#fitrah-custom")).toBeVisible();

    // Pindah ke mode uang
    await page.getByRole("radio", { name: /Uang/ }).click();

    // Field khas mode beras HARUS lepas dari DOM
    await expect(page.locator("#fitrah-custom")).toHaveCount(0);
    await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);

    // jiwa tetap invalid, describedby tetap valid (menunjuk id yang ada)
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");
    await expect(page.locator("#fitrah-jiwa-error")).toBeVisible();

    // Field baru (uang) muncul; karena attempted=true & kosong, wajar invalid,
    // tetapi describedby WAJIB menunjuk id error miliknya sendiri.
    const uang = page.locator("#fitrah-uang");
    await expect(uang).toBeVisible();
    const uangDescribed = await uang.getAttribute("aria-describedby");
    if (uangDescribed) {
      expect(uangDescribed).toBe("fitrah-uang-error");
      // dan id itu benar-benar ada di DOM (tidak yatim)
      await expect(page.locator(`#${uangDescribed}`)).toHaveCount(1);
    }

    // Tidak ada aria-describedby yatim di seluruh subform Fitrah:
    // setiap id yang dirujuk oleh input Fitrah harus punya elemen target.
    for (const id of ["fitrah-jiwa", "fitrah-uang"]) {
      const el = page.locator(`#${id}`);
      const described = await el.getAttribute("aria-describedby");
      if (described) {
        for (const ref of described.split(/\s+/).filter(Boolean)) {
          await expect(page.locator(`#${ref}`)).toHaveCount(1);
        }
      }
    }
  });

  test("uang → beras: pesan error uang hilang total dari DOM", async ({ page }) => {
    await page.getByRole("radio", { name: /Uang/ }).click();
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Baseline: kedua field invalid di mode uang
    const jiwa = page.locator("#fitrah-jiwa");
    const uang = page.locator("#fitrah-uang");
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(uang).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#fitrah-uang-error")).toBeVisible();

    // Pindah kembali ke beras
    await page.getByRole("radio", { name: /Beras/ }).click();

    // Field & error khas mode uang harus lenyap
    await expect(page.locator("#fitrah-uang")).toHaveCount(0);
    await expect(page.locator("#fitrah-uang-error")).toHaveCount(0);

    // jiwa tetap invalid dengan describedby yang valid
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");

    // Field beras (opsional) muncul & TIDAK boleh mewarisi aria-invalid
    const custom = page.locator("#fitrah-custom");
    await expect(custom).toBeVisible();
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    expect(await custom.getAttribute("aria-describedby")).toBeNull();

    // Hanya 1 pesan error Fitrah tersisa (jiwa saja)
    const fitrahAlerts = page.locator('[role="alert"][aria-live="assertive"][id^="fitrah-"]');
    await expect(fitrahAlerts).toHaveCount(1);
    await expect(fitrahAlerts.first()).toHaveAttribute("id", "fitrah-jiwa-error");
  });

  test("Bolak-balik beras ↔ uang berkali-kali tidak menumpuk sisa aria/error", async ({ page }) => {
    // Buat state attempted=true agar semua toggle berikutnya berjalan
    // di bawah validasi aktif — kondisi paling rawan bocor.
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    for (let i = 0; i < 4; i++) {
      await page.getByRole("radio", { name: /Uang/ }).click();
      await expect(page.locator("#fitrah-custom")).toHaveCount(0);
      await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);
      await expect(page.locator("#fitrah-uang")).toBeVisible();

      await page.getByRole("radio", { name: /Beras/ }).click();
      await expect(page.locator("#fitrah-uang")).toHaveCount(0);
      await expect(page.locator("#fitrah-uang-error")).toHaveCount(0);
      await expect(page.locator("#fitrah-custom")).toBeVisible();
    }

    // Selama proses, jiwa selalu jadi satu-satunya invalid yang persist,
    // dan pesan errornya hanya satu instans (tidak menumpuk).
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(1);
    const custom = page.locator("#fitrah-custom");
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    expect(await custom.getAttribute("aria-describedby")).toBeNull();
  });
});
