import { test, expect } from "@playwright/test";

test("Admin creates a new category and category is shown after creation", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await expect(page.getByRole('link', { name: 'Create Category' })).toBeVisible();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-category");

  await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();
  await expect(page.getByPlaceholder("Enter new category")).toBeVisible();
  await expect(page.getByRole('cell', { name: 'TEST-Category One' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'TEST-Category Two' })).toBeVisible();

  await page.fill('input[placeholder="Enter new category"]', 'TEST-Category Three');
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole('cell', { name: 'TEST-Category Three' })).toBeVisible();
});

test("Admin attempts to create a category without entering a name", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-category");

  await page.getByRole("button", { name: "Submit" }).click();
  
  await page.waitForSelector("text=Category name is required", { timeout: 5000 });
  await expect(page.locator("text=Category name is required")).toBeVisible();
});

test("Admin attempts to create a duplicate category", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-category");

  await page.fill('input[placeholder="Enter new category"]', 'TEST-Category One');
  await page.getByRole("button", { name: "Submit" }).click();

  await page.waitForSelector("text=Category already exists", { timeout: 5000 });
  await expect(page.locator("text=Category already exists")).toBeVisible();
});

test("Admin attempts to edit one category to another existing category", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-category");

  await page.getByRole('button', { name: 'Edit' }).nth(1).click(); 
    const dialog = page.locator('div[role="dialog"]');
  await expect(dialog).toBeVisible();
  
  await dialog.getByPlaceholder("Enter new category").fill("TEST-Category One");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await page.waitForSelector("text=Category with this name already exists", { timeout: 5000 });
  await expect(page.locator("text=Category with this name already exists")).toBeVisible();
});

test("Admin attempts to delete a category", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-category");

  await page.getByRole("button", { name: "Delete" }).nth(1).click();

  await page.waitForSelector("text=category is deleted", { timeout: 5000 });
  await expect(page.locator("text=category is deleted")).toBeVisible();
});

