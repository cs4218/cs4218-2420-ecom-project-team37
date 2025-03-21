import { test, expect } from "@playwright/test";

test("Contact page loads correctly", async ({ page }) => {
  await page.goto("http://localhost:3000/contact");
  
  await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
});

test("Admin can navigate to Contact page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.goto("http://localhost:3000/contact");
  await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
});

test("User can navigate to Contact page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-user@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.goto("http://localhost:3000/contact");
  await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
});
