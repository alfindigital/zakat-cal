import { test, expect } from "../playwright-fixture";

/**
 * Verifies that the shared AppShell renders identical header + bottom nav on
 * every route, and that navigating via the bottom tabs / header icons lands
 * on the correct page with the correct aria-current state.
 */
test.use({ viewport: { width: 390, height: 844 } });

const ROUTES: Array<{ path: string; marker: string | RegExp }> = [
  { path: "/", marker: /Kalkulator Zakat Maal/ },
  { path: "/pengaturan", marker: "Nisab saat ini" },
  { path: "/riwayat", marker: "Riwayat Perhitungan" },
  { path: "/panduan-zakat", marker: "Apa Itu Zakat?" },
];

test.describe("AppShell — konsistensi header & bottom nav", () => {
  for (const { path, marker } of ROUTES) {
    test(`header + bottom nav muncul di ${path}`, async ({ page }) => {
      await page.goto(path);

      // Header: logo link ke beranda
      const homeLink = page.getByRole("link", { name: /ZakatCal — beranda/ });
      await expect(homeLink).toBeVisible();

      // Header icons konsisten
      await expect(page.getByRole("link", { name: "Riwayat Perhitungan" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Pengaturan" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Panduan Zakat" })).toBeVisible();

      // Bottom nav (mobile)
      const nav = page.getByRole("navigation", { name: "Navigasi utama" });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("button", { name: "Maal" })).toBeVisible();
      await expect(nav.getByRole("button", { name: "Fitrah" })).toBeVisible();

      // Halaman spesifik ter-render
      await expect(page.getByText(marker).first()).toBeVisible();
    });
  }

  test("bottom nav berpindah antar kalkulator dgn aria-current", async ({ page }) => {
    await page.goto("/zakat-fitrah");
    const nav = page.getByRole("navigation", { name: "Navigasi utama" });

    await expect(nav.getByRole("button", { name: "Fitrah" })).toHaveAttribute("aria-current", "page");

    await nav.getByRole("button", { name: "Maal" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(nav.getByRole("button", { name: "Maal" })).toHaveAttribute("aria-current", "page");

    await nav.getByRole("button", { name: "Fitrah" }).click();
    await expect(page).toHaveURL(/\/zakat-fitrah$/);
    await expect(nav.getByRole("button", { name: "Fitrah" })).toHaveAttribute("aria-current", "page");
  });

  test("drawer Lainnya membuka kategori sekunder & navigasi bekerja", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Kategori zakat lainnya" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Semua Kategori")).toBeVisible();

    await dialog.getByRole("button", { name: /Pertanian/ }).click();
    await expect(page).toHaveURL(/\/zakat-pertanian$/);
    await expect(
      page.getByRole("navigation", { name: "Navigasi utama" }),
    ).toBeVisible();
  });


  test("header icons: Pengaturan → Riwayat → Panduan → Home", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Pengaturan" }).click();
    await expect(page).toHaveURL(/\/pengaturan$/);
    await expect(page.getByRole("link", { name: "Pengaturan" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("link", { name: "Riwayat Perhitungan" }).click();
    await expect(page).toHaveURL(/\/riwayat$/);
    await expect(page.getByRole("link", { name: "Riwayat Perhitungan" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("link", { name: "Panduan Zakat" }).click();
    await expect(page).toHaveURL(/\/panduan-zakat$/);
    await expect(page.getByRole("link", { name: "Panduan Zakat" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("link", { name: /ZakatCal — beranda/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
