import { test, expect } from "@playwright/test";

test("Page not found shows 404 error page", async ({ page }) => {
  // Navigate to a non-existent route
  await page.goto("http://localhost:3000/non-existent-page");
  
  // Check that 404 page elements are visible
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await expect(page.locator("text=Page Not Found")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go Back" })).toBeVisible();
});

test("Not found page navigation works correctly", async ({ page }) => {
  await page.goto("http://localhost:3000/random-invalid-route");
  
  // Click on Go Back or Home button
  await page.getByRole("link", { name: "Go Back" }).click();
  
  // Should redirect to home page
  await page.waitForURL("http://localhost:3000");
  
  // Verify we're on the home page
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
});