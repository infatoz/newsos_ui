import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("loads the homepage", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/./);
    await expect(page.locator("body")).toBeVisible();

    // Prefer a landmark when present; fall back to body content.
    const main = page.locator("main");
    if (await main.count()) {
      await expect(main.first()).toBeVisible();
    } else {
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });

  test("responds with a successful document", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.ok()).toBeTruthy();
  });
});
