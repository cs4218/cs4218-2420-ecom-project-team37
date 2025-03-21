import { test, expect } from "@playwright/test";

test("Policy page loads correctly", async ({ page }) => {
  await page.goto("http://localhost:3000/policy");
  
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});

test("Admin can navigate to Policy page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.goto("http://localhost:3000/policy");
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});

test("User can navigate to Policy page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-user@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.goto("http://localhost:3000/policy");
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});
