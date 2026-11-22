import { test, expect } from "@playwright/test";
import fs from "node:fs";
const fallback = JSON.parse(
  fs.readFileSync("public/magang-fallback.json", "utf8"),
);
const demo = JSON.parse(
  fs.readFileSync("public/demo-applications.json", "utf8"),
);
test.beforeEach(async ({ page }) => {
  await page.route("https://remotive.com/api/**", (route) =>
    route.fulfill({ json: fallback }),
  );
});
test("skill live, warna badge, filter, anti-duplikat, dan persistensi", async ({
  page,
}) => {
  await page.goto("/");
  const fullstack = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Fullstack Intern", exact: true }),
    });
  await expect(fullstack).toContainText("75% match");
  await page.getByLabel("Skill baru").fill("Docker");
  await page.getByRole("button", { name: "Tambah skill" }).click();
  await expect(fullstack).toContainText("100% match");
  await page.getByLabel("Skill baru").fill(" docker ");
  await page.getByRole("button", { name: "Tambah skill" }).click();
  await expect(page.getByRole("alert")).toContainText("sudah ada");
  await fullstack.getByRole("button", { name: "Simpan ke Wishlist" }).click();
  await expect(
    fullstack.getByRole("button", { name: "Sudah Dilamar" }),
  ).toBeDisabled();
  await page.reload();
  await expect(fullstack).toContainText("100% match");
  await expect(fullstack.getByRole("button")).toBeDisabled();
  await page.getByLabel("Cari lowongan").fill("tidak-ada-lowongan-ini");
  await expect(page.getByText("Belum ada lowongan yang cocok.")).toBeVisible();
  await page.getByLabel("Cari lowongan").fill("");
  await page.getByLabel("Kategori", { exact: true }).selectOption("Data");
  await expect(page.locator(".job-card")).toHaveCount(2);
  await page.getByLabel("Kategori", { exact: true }).selectOption("");
  await expect(page.locator(".job-card")).toHaveCount(15);
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
test("form kondisional, auto-focus kosong dan duplikat, persistensi APPLIED", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Lamaran saya" }).click();
  await page
    .getByRole("button", { name: "Tambah lamaran", exact: false })
    .click();
  await expect(page.getByLabel("Perusahaan")).toBeFocused();
  await page.getByLabel("Perusahaan").fill("Acme");
  await page.getByLabel("Posisi / Role").fill("Intern");
  await page.getByLabel("Required skills").fill("React, CSS");
  await page.getByLabel("Status awal").selectOption("APPLIED");
  await page
    .getByRole("button", { name: "Tambah lamaran", exact: false })
    .click();
  await expect(page.getByLabel("Versi CV")).toBeFocused();
  await page.getByLabel("Versi CV").fill("CV-v2.pdf");
  await page.getByLabel("Tanggal melamar").fill("2026-11-21");
  await page
    .getByRole("button", { name: "Tambah lamaran", exact: false })
    .click();
  await expect(page.locator(".application-row")).toContainText("APPLIED");
  await page.getByLabel("Perusahaan").fill(" acME ");
  await page.getByLabel("Posisi / Role").fill(" INTERN ");
  await page.getByLabel("Required skills").fill("React");
  await page
    .getByRole("button", { name: "Tambah lamaran", exact: false })
    .click();
  await expect(page.getByLabel("Perusahaan")).toBeFocused();
  await expect(
    page.getByText("Perusahaan dan posisi ini sudah ada", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Lamaran saya" }).click();
  await expect(page.locator(".application-row")).toContainText("CV-v2.pdf");
});
test("loading, error API, fallback otomatis, retry, dan empty API", async ({
  page,
}) => {
  await page.route("https://remotive.com/api/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ status: 503, body: "Unavailable" });
  });
  await page.goto("/");
  await expect(page.getByText("Memuat peluang baru…")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("gagal dimuat");
  await expect(page.locator(".job-card")).toHaveCount(15);
  await page
    .getByRole("button", { name: "Fallback Lokal", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.route("https://remotive.com/api/**", (route) =>
    route.fulfill({ json: { jobs: [] } }),
  );
  await page.getByLabel("Sumber lowongan").selectOption("live");
  await expect(page.getByText("Belum ada lowongan yang cocok.")).toBeVisible();
});
test("offline error tetap menyediakan retry/fallback", async ({
  page,
  context,
}) => {
  await page.unroute("https://remotive.com/api/**");
  await page.route("https://remotive.com/api/**", (route) =>
    route.abort("internetdisconnected"),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toBeVisible();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Coba Lagi" }).click();
  await expect(page.getByRole("alert")).toContainText("gagal dimuat");
  await expect(
    page.getByRole("button", { name: "Fallback Lokal", exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  await page
    .getByRole("button", { name: "Fallback Lokal", exact: true })
    .click();
  await expect(page.locator(".job-card")).toHaveCount(15);
});
test("Undo utuh, hapus beruntun, statistik dan comparator bereaksi", async ({
  page,
}) => {
  await page.addInitScript(
    (data) => localStorage.setItem("applications", JSON.stringify(data)),
    demo,
  );
  await page.goto("/");
  await expect(
    page.locator(".stat-card").filter({ hasText: "Total Offer" }),
  ).toContainText("2");
  await page
    .getByRole("button", { name: "Offer Comparator", exact: true })
    .click();
  await expect(page.locator(".offer-card").nth(0)).toContainText("91.67");
  await expect(page.locator(".offer-card").nth(1)).toContainText("87.50");
  await expect(page.locator(".offer-card").nth(0)).toContainText(
    "Rekomendasi Terbaik",
  );
  await page.getByRole("button", { name: "Lamaran saya" }).click();
  await page.clock.install();
  await page
    .getByRole("button", {
      name: "Hapus lamaran Demo Nusantara Frontend Intern",
    })
    .click();
  await page.clock.fastForward(4000);
  await page
    .getByRole("button", {
      name: "Hapus lamaran Demo Ruang Digital Frontend Intern",
    })
    .click();
  await page.clock.fastForward(1500);
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("applications") ?? "[]"),
  );
  expect(
    saved.find((app: { id: string }) => app.id === "demo-offer-b"),
  ).toEqual(demo[1]);
  expect(saved.some((app: { id: string }) => app.id === "demo-offer-a")).toBe(
    false,
  );
  await page
    .getByRole("button", { name: "Offer Comparator", exact: true })
    .click();
  await expect(
    page.getByText("Butuh minimal 2 lamaran", { exact: false }),
  ).toBeVisible();
});
test("layout mobile tidak overflow dan navigasi dapat digunakan", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".job-card")).toHaveCount(15);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Lamaran saya" }).click();
  await expect(page.getByLabel("Perusahaan")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
test("pilihan offer berbeda, skor seri, dan pilihan pulih setelah offer terhapus", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const third = { ...demo[0], id: "demo-offer-c", company: "Demo Kembar" };
  await page.addInitScript(
    (data) => localStorage.setItem("applications", JSON.stringify(data)),
    [...demo, third],
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Offer Comparator", exact: true })
    .click();
  await page
    .getByLabel("Offer B", { exact: true })
    .selectOption("demo-offer-c");
  await expect(page.locator(".recommendation")).toHaveCount(2);
  await expect(page.locator(".recommendation").first()).toContainText(
    "Skor seri",
  );
  await expect(
    page
      .getByLabel("Offer A", { exact: true })
      .locator('option[value="demo-offer-c"]'),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/comparator.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Lamaran saya" }).click();
  await page
    .getByRole("button", {
      name: "Hapus lamaran Demo Nusantara Frontend Intern",
    })
    .click();
  await page
    .getByRole("button", { name: "Offer Comparator", exact: true })
    .click();
  await expect(page.locator(".offer-card")).toHaveCount(2);
  expect(
    await page.getByLabel("Offer A", { exact: true }).inputValue(),
  ).not.toBe(await page.getByLabel("Offer B", { exact: true }).inputValue());
  expect(errors).toEqual([]);
});
