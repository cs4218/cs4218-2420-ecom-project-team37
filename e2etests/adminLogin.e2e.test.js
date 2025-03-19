import { test, expect } from "@playwright/test";

test("Admin logins and navigate to admin dashboard page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.waitForURL("http://localhost:3000/dashboard/admin");

  await expect(page.getByRole('heading', { name: 'Admin Name : Test Admin' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin Email : test-admin@example.com' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin Contact : 12345678' })).toBeVisible();

});
