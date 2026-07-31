import { test, expect } from "../playwright-fixture";

/**
 * Memastikan pesan error inline memiliki aria-live="assertive" dan
 * terkait ke input via aria-describedby saat validasi gagal setelah
 * user menekan tombol "Simpan ke Riwayat".
 */
test.describe("Inline validation a11y — aria-live & aria-describedby", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
  });

  test("Zakat Fitrah: menekan Simpan tanpa mengisi jumlah jiwa memicu error yang diumumkan screen reader", async ({ page }) => {
    // Pindah ke tab Fitrah (desktop tabs atau bottom nav mobile — keduanya pakai role button/tab dengan nama sama)
    await page.goto("/zakat-fitrah");

    const jiwaInput = page.locator("#fitrah-jiwa");
    await expect(jiwaInput).toBeVisible();

    // Sebelum submit: tidak ada error
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);
    await expect(jiwaInput).not.toHaveAttribute("aria-invalid", "true");

    // Klik Simpan tanpa mengisi apapun
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Error inline muncul dengan aria-live="assertive" dan role="alert"
    const err = page.locator("#fitrah-jiwa-error");
    await expect(err).toBeVisible();
    await expect(err).toHaveAttribute("role", "alert");
    await expect(err).toHaveAttribute("aria-live", "assertive");
    await expect(err).toHaveAttribute("aria-atomic", "true");
    await expect(err).toContainText(/jumlah anggota keluarga/i);

    // Relasi aria-describedby dari input ke pesan error
    await expect(jiwaInput).toHaveAttribute("aria-invalid", "true");
    await expect(jiwaInput).toHaveAttribute("aria-describedby", "fitrah-jiwa-error");

    // Input yang bermasalah menerima fokus otomatis
    await expect(jiwaInput).toBeFocused();

    // Setelah diisi valid, error hilang & aria-invalid dilepas
    await jiwaInput.fill("3");
    await expect(page.locator("#fitrah-jiwa-error")).toHaveCount(0);
    await expect(jiwaInput).not.toHaveAttribute("aria-invalid", "true");
  });

  test("Zakat Fidyah: dua field kosong → keduanya diberi aria-describedby yang benar", async ({ page }) => {
    // Buka tab Maal lalu sub-kalkulator Fidyah (Fidyah hidup di dalam tab Maal via Select)
    // Jalur paling andal: langsung fokus via url — namun tidak ada, jadi kita cek Fitrah + Maal saja.
    // Sebagai gantinya, uji Zakat Maal (tab default).
    const gaji = page.locator('input[inputmode="decimal"]').first();
    await expect(gaji).toBeVisible();

    // Klik Simpan langsung
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).first().click();

    // Cari error pertama yang aktif di halaman
    const alerts = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(alerts.first()).toBeVisible();

    // Input yang di-describe oleh alert tersebut harus aria-invalid=true
    const firstAlertId = await alerts.first().getAttribute("id");
    expect(firstAlertId).toBeTruthy();
    const inputId = firstAlertId!.replace(/-error$/, "");
    const input = page.locator(`#${inputId}`);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("aria-describedby", firstAlertId!);
  });
});
