import { test, expect } from "../playwright-fixture";

/**
 * Verifikasi navigasi keyboard: Tab / Shift+Tab melewati input dengan
 * benar, dan pesan error inline (elemen non-interaktif) TIDAK ikut
 * masuk urutan tab meskipun sudah tampil setelah validasi gagal.
 */
test.describe("Keyboard navigation — Tab/Shift+Tab through inputs & errors", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
    await page.goto("/zakat-fitrah");
    // Aktifkan mode "uang" agar terdapat 2 input decimal berdekatan
    await page.getByRole("radio", { name: /Uang/ }).click();
  });

  test("Tab bergerak antar input tanpa singgah di elemen pesan error", async ({ page }) => {
    const jiwa = page.locator("#fitrah-jiwa");
    const uang = page.locator("#fitrah-uang");

    // --- Sebelum validasi gagal ---
    await jiwa.focus();
    await expect(jiwa).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(uang).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(jiwa).toBeFocused();

    // --- Picu error dengan menekan Simpan (form kosong) ---
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Fokus otomatis ke input pertama yang invalid
    await expect(jiwa).toBeFocused();

    // Pesan error muncul untuk kedua field
    const jiwaErr = page.locator("#fitrah-jiwa-error");
    const uangErr = page.locator("#fitrah-uang-error");
    await expect(jiwaErr).toBeVisible();
    await expect(uangErr).toBeVisible();

    // Pesan error TIDAK boleh menerima fokus (bukan interaktif, tanpa tabindex)
    await expect(jiwaErr).not.toHaveAttribute("tabindex", /.+/);
    await expect(uangErr).not.toHaveAttribute("tabindex", /.+/);

    // Dari jiwa, Tab harus langsung ke input berikutnya (uang), bukan ke <p role=alert>
    await page.keyboard.press("Tab");
    await expect(uang).toBeFocused();
    // Pastikan fokus BUKAN pada elemen error
    await expect(jiwaErr).not.toBeFocused();
    await expect(uangErr).not.toBeFocused();

    // Shift+Tab mundur kembali ke jiwa (juga melewati elemen error)
    await page.keyboard.press("Shift+Tab");
    await expect(jiwa).toBeFocused();
  });

  test("Tab meneruskan ke tombol ringkasan validasi & Simpan setelah input", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const uang = page.locator("#fitrah-uang");
    await uang.focus();
    await expect(uang).toBeFocused();

    // Lanjutkan Tab beberapa kali sampai fokus mencapai tombol ringkasan validasi
    // atau tombol Simpan. Pesan error tidak boleh pernah menjadi target fokus.
    const summary = page.locator('[role="region"][aria-labelledby="validation-summary-title"]');
    await expect(summary).toBeVisible();

    let reachedSummaryButton = false;
    let reachedSaveButton = false;
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      const tag = await focused.evaluate((el) => el.tagName.toLowerCase()).catch(() => "");
      const role = await focused.getAttribute("role").catch(() => null);

      // Fokus tidak boleh mendarat di elemen alert/pesan error
      expect(role).not.toBe("alert");

      const text = (await focused.textContent().catch(() => "")) ?? "";
      if (tag === "button" && /Jumlah Jiwa|Tarif per Jiwa/.test(text)) {
        reachedSummaryButton = true;
      }
      if (tag === "button" && /Simpan ke Riwayat/.test(text)) {
        reachedSaveButton = true;
        break;
      }
    }

    expect(reachedSummaryButton, "tombol ringkasan validasi harus dapat difokus via Tab").toBe(true);
    expect(reachedSaveButton, "tombol Simpan harus dapat difokus via Tab").toBe(true);
  });
});
