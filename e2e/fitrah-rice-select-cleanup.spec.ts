import { test, expect } from "../playwright-fixture";

/**
 * Kontrak aksesibilitas mode beras Zakat Fitrah:
 * mengganti "Jenis Beras" (preset) dan mengisi/mengosongkan harga
 * kustom (`#fitrah-custom`, opsional) TIDAK boleh:
 *  - Memberi `aria-invalid="true"` pada field opsional.
 *  - Meninggalkan `aria-describedby` yang menunjuk id yang tidak ada.
 *  - Menambah `role="alert"` untuk field yang bukan wajib.
 *  - Menumpuk pesan error saat toggle bolak-balik.
 *
 * Field wajib (`#fitrah-jiwa`) tetap satu-satunya yang boleh membawa
 * atribut invalid setelah Simpan ditekan tanpa input jiwa.
 */
test.describe("Zakat Fitrah — cleanup aria saat ganti Jenis Beras / harga kustom", () => {
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
    // Pastikan mode beras
    await page.getByRole("radio", { name: /Beras/ }).click();
  });

  test("Ganti preset Jenis Beras tidak menambah aria-invalid ke field opsional", async ({ page }) => {
    const custom = page.locator("#fitrah-custom");
    const jiwa = page.locator("#fitrah-jiwa");

    // Trigger attempted=true dulu — kondisi paling rawan bocor.
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");

    // Ganti preset Jenis Beras via Select (Standar → Premium → Standar)
    const trigger = page.getByRole("combobox").first();
    await trigger.click();
    await page.getByRole("option", { name: /Premium/ }).click();

    await expect(custom).toBeVisible();
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    expect(await custom.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);

    await trigger.click();
    await page.getByRole("option", { name: /Standar/ }).click();

    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    expect(await custom.getAttribute("aria-describedby")).toBeNull();

    // Hanya satu alert Fitrah aktif (jiwa)
    const fitrahAlerts = page.locator('[role="alert"][aria-live="assertive"][id^="fitrah-"]');
    await expect(fitrahAlerts).toHaveCount(1);
    await expect(fitrahAlerts.first()).toHaveAttribute("id", "fitrah-jiwa-error");
  });

  test("Isi lalu kosongkan harga kustom tidak meninggalkan artefak aria di DOM", async ({ page }) => {
    const custom = page.locator("#fitrah-custom");
    const jiwa = page.locator("#fitrah-jiwa");

    // attempted=true
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Isi harga kustom — field opsional, tetap TIDAK boleh invalid
    await custom.fill("18.000");
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    expect(await custom.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);

    // Kosongkan lagi
    await custom.fill("");
    await expect(custom).not.toHaveAttribute("aria-invalid", "true");
    expect(await custom.getAttribute("aria-describedby")).toBeNull();
    await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);

    // jiwa tetap satu-satunya invalid dengan describedby valid
    await expect(jiwa).toHaveAttribute("aria-invalid", "true");
    await expect(jiwa).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(1);
  });

  test("Bolak-balik preset ↔ isi kustom berkali-kali tidak menumpuk aria/error", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    const custom = page.locator("#fitrah-custom");
    const trigger = page.getByRole("combobox").first();

    for (let i = 0; i < 3; i++) {
      // Isi kustom
      await custom.fill("17.500");
      await expect(custom).not.toHaveAttribute("aria-invalid", "true");
      expect(await custom.getAttribute("aria-describedby")).toBeNull();

      // Ganti preset
      await trigger.click();
      await page.getByRole("option", { name: /Premium/ }).click();
      await expect(custom).not.toHaveAttribute("aria-invalid", "true");

      // Kosongkan kustom
      await custom.fill("");
      await expect(custom).not.toHaveAttribute("aria-invalid", "true");
      expect(await custom.getAttribute("aria-describedby")).toBeNull();
      await expect(page.locator("#fitrah-custom-error")).toHaveCount(0);

      await trigger.click();
      await page.getByRole("option", { name: /Standar/ }).click();
    }

    // Tidak ada aria-describedby yatim: setiap id yang dirujuk harus ada di DOM
    for (const id of ["fitrah-jiwa", "fitrah-custom"]) {
      const el = page.locator(`#${id}`);
      if ((await el.count()) === 0) continue;
      const described = await el.getAttribute("aria-describedby");
      if (described) {
        for (const ref of described.split(/\s+/).filter(Boolean)) {
          await expect(page.locator(`#${ref}`)).toHaveCount(1);
        }
      }
    }

    // Hanya 1 alert Fitrah tersisa (jiwa)
    const fitrahAlerts = page.locator('[role="alert"][aria-live="assertive"][id^="fitrah-"]');
    await expect(fitrahAlerts).toHaveCount(1);
    await expect(fitrahAlerts.first()).toHaveAttribute("id", "fitrah-jiwa-error");
  });
});
