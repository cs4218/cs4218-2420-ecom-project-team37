import { test, expect } from "@playwright/test";
import path from "path";

test("Admin creates a new product and product is shown after creation", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

  await page.getByRole('combobox').first().click();
  await page.waitForSelector('.ant-select-item-option');
  await page.getByTitle('TEST-Category One').click();
  await expect(page.locator('.ant-select-selection-item').first()).toHaveText('TEST-Category One');

  // Upload the test image
  const filePath = path.join('e2etests', 'testData', 'book.png');
  await page.setInputFiles('input[type="file"]', filePath);

  await page.getByPlaceholder("Write a Name").fill("TEST-Product Three"); 
  await page.getByPlaceholder("Write a Description").fill("TEST-Product Three Description");
  await page.getByPlaceholder("Write a Price").fill("99.99");
  await page.getByPlaceholder("Write a Quantity").fill("100");

  await page.getByRole('combobox').nth(1).click();
  await page.getByTitle('Yes').click();
  await expect(page.locator('.ant-select-selection-item').nth(1)).toHaveText('Yes');

  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/products");

  await expect(page.getByRole('heading', { name: 'TEST-Product Three' })).toBeVisible();
  await expect(page.locator('p.card-text').first()).toHaveText('TEST-Product Three Description');
});

test("Admin attempts to create a product with missing fields", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  await page.waitForSelector("text=All fields are required", { timeout: 5000 });
  await expect(page.locator("text=All fields are required")).toBeVisible();
});

test("Admin attempts to create a product with negative price", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

  await page.getByRole('combobox').first().click();
  await page.waitForSelector('.ant-select-item-option');
  await page.getByTitle('TEST-Category One').click();
  await expect(page.locator('.ant-select-selection-item').first()).toHaveText('TEST-Category One');

  await page.getByPlaceholder("Write a Name").fill("TEST-Negative Price");
  await page.getByPlaceholder("Write a Description").fill("Invalid price test");
  await page.getByPlaceholder("Write a Price").fill("-10");
  await page.getByPlaceholder("Write a Quantity").fill("100");

  await page.getByRole('combobox').nth(1).click();
  await page.getByTitle('Yes').click();
  await expect(page.locator('.ant-select-selection-item').nth(1)).toHaveText('Yes');

  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  await page.waitForSelector("text=Price must be positive", { timeout: 5000 });
  await expect(page.locator("text=Price must be positive")).toBeVisible();
});
  
test("Admin attempts to create a product with negative quantity", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

  await page.getByRole('combobox').first().click();
  await page.waitForSelector('.ant-select-item-option');
  await page.getByTitle('TEST-Category One').click();
  await expect(page.locator('.ant-select-selection-item').first()).toHaveText('TEST-Category One');

  await page.getByPlaceholder("Write a Name").fill("TEST-Negative Quantity");
  await page.getByPlaceholder("Write a Description").fill("Invalid quantity test");
  await page.getByPlaceholder("Write a Price").fill("50");
  await page.getByPlaceholder("Write a Quantity").fill("-5");
  await page.getByRole('combobox').nth(1).click();
  await page.getByTitle('Yes').click();
  await expect(page.locator('.ant-select-selection-item').nth(1)).toHaveText('Yes');

  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  await page.waitForSelector("text=Quantity must be more than zero", { timeout: 5000 });
  await expect(page.locator("text=Quantity must be more than zero")).toBeVisible();
});

test("Admin attempts to upload an oversized photo", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

  await page.getByRole('combobox').first().click();
  await page.waitForSelector('.ant-select-item-option');
  await page.getByTitle('TEST-Category One').click();
  await expect(page.locator('.ant-select-selection-item').first()).toHaveText('TEST-Category One');

  const largeFilePath = path.join('e2etests', 'testData', 'large-image.jpg');
  await page.setInputFiles('input[type="file"]', largeFilePath);

  await page.getByPlaceholder("Write a Name").fill("TEST-Large Photo");
  await page.getByPlaceholder("Write a Description").fill("Invalid photo size test");
  await page.getByPlaceholder("Write a Price").fill("50");
  await page.getByPlaceholder("Write a Quantity").fill("5");

  await page.getByRole('combobox').nth(1).click();
  await page.getByTitle('Yes').click();
  await expect(page.locator('.ant-select-selection-item').nth(1)).toHaveText('Yes');

  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  await page.waitForSelector("text=Photo size must be less than 1MB.", { timeout: 5000 });
  await expect(page.locator("text=Photo size must be less than 1MB.")).toBeVisible();
});
