import { test, expect } from "../playwright-fixture";

// iPhone 12 viewport — mobile-only UI (bottom nav, collapsible result, chart toggle)
test.use({ viewport: { width: 390, height: 844 } });

test.describe("Mobile UX — ZakatCal", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore storage errors in init script */
      }
    });
    await page.goto("/");
    // wait for app shell + bottom nav
    await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
  });

  test("bottom nav switches between Penghasilan, Maal, Fitrah", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Navigasi utama" });
    const gaji = nav.getByRole("button", { name: "Zakat Penghasilan" });
    const maal = nav.getByRole("button", { name: "Zakat Maal" });
    const fitrah = nav.getByRole("button", { name: "Zakat Fitrah" });

    // Default: Penghasilan
    await expect(gaji).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Kalkulator Zakat Penghasilan" })).toBeVisible();

    await maal.click();
    await expect(maal).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: /Kalkulator Zakat Maal/ })).toBeVisible();

    await fitrah.click();
    await expect(fitrah).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Kalkulator Zakat Fitrah" })).toBeVisible();

    await gaji.click();
    await expect(gaji).toHaveAttribute("aria-current", "page");
  });

  test("result card appears live and detail collapsible opens/closes", async ({ page }) => {
    // Calculation is live — typing produces a result without a "Hitung" button.
    const decimalInputs = page.locator('input[inputmode="decimal"]');
    await decimalInputs.first().fill("15.000.000");

    const toggle = page.getByRole("button", { name: /Lihat Detail|Sembunyikan Detail/ });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const details = page.locator("#result-details");
    await expect(details).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("saving to history reveals chart with Pie/Bar toggle", async ({ page }) => {
    const decimalInputs = page.locator('input[inputmode="decimal"]');
    await decimalInputs.first().fill("15.000.000");

    // Persist to history via the sticky mobile CTA.
    await page.getByRole("button", { name: "Simpan ke Riwayat" }).last().click();

    // Chart card (lazy-loaded)
    await expect(page.getByText("Ringkasan Zakat")).toBeVisible();
    const chartCard = page.locator("text=Ringkasan Zakat").locator("..").locator("..");

    const pieBtn = chartCard.getByRole("radio", { name: "Pie" }).or(
      chartCard.locator('[role="button"]', { hasText: "Pie" }),
    );
    const barBtn = chartCard.getByRole("radio", { name: "Bar" }).or(
      chartCard.locator('[role="button"]', { hasText: "Bar" }),
    );

    // Pie is default
    await expect(pieBtn.first()).toHaveAttribute("data-state", "on");

    await barBtn.first().click();
    await expect(barBtn.first()).toHaveAttribute("data-state", "on");
    await expect(pieBtn.first()).toHaveAttribute("data-state", "off");

    await pieBtn.first().click();
    await expect(pieBtn.first()).toHaveAttribute("data-state", "on");
  });
});
