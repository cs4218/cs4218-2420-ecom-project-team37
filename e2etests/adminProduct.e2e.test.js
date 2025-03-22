import { test, expect } from '@playwright/test';
import path from 'path';
import { Types } from "mongoose";

test('Admin can create, update a product successfully', async ({ page }) => {
    // Generate a unique product name
    const uniqueSuffix = new Types.ObjectId().toString(); 
    const productName = `TEST-Product-${uniqueSuffix}`;
    const updatedProductName = `${productName}-Updated`;

    // Login
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
    await page.getByPlaceholder("Enter Your Password").fill("test123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://localhost:3000");

    // Navigate to create-product page
    await page.getByRole("button", { name: "Admin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Create Product" }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

    // Create the product
    await page.getByRole('combobox').first().click();
    await page.waitForSelector('.ant-select-item-option');
    await page.getByTitle('TEST-Category One').click();
    await expect(page.locator('.ant-select-selection-item').first()).toHaveText('TEST-Category One');

    const filePath = path.join('e2etests', 'testData', 'book.png');
    await page.setInputFiles('input[type="file"]', filePath);

    await page.getByPlaceholder("Write a Name").fill(productName); 
    await page.getByPlaceholder("Write a Description").fill(`${productName} Description`);
    await page.getByPlaceholder("Write a Price").fill("99.99");
    await page.getByPlaceholder("Write a Quantity").fill("100");

    await page.getByRole('combobox').nth(1).click();
    await page.getByTitle('Yes').click();
    await expect(page.locator('.ant-select-selection-item').nth(1)).toHaveText('Yes');

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click({ timeout: 5000 });
    await page.waitForURL("http://localhost:3000/dashboard/admin/products");

    // Verify creation
    await expect(page.getByRole('heading', { name: productName })).toBeVisible();

    // Try to edit 
    await page.getByRole('link', { name: new RegExp(productName) }).click();
    await page.waitForURL(`http://localhost:3000/dashboard/admin/product/${productName}`);
    await page.waitForTimeout(1000);

    // Edit the product - update with changes
    await page.getByPlaceholder("Write a Name").fill(updatedProductName);
    await page.getByPlaceholder("Write a Description").fill(`${updatedProductName} Description`);
    await page.getByPlaceholder('Write a Price').click();
    await page.getByPlaceholder('Write a Price').fill('105');
    await page.getByPlaceholder('Write a Quantity').click();
    await page.getByPlaceholder('Write a Quantity').fill('105');
    await page.getByText('Yes').click(); // change shipping to yes
    await page.getByText('No').click();
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin/products");
    await expect(page.getByRole('heading', { name: updatedProductName })).toBeVisible();

    // Go to homepage and verify
    await page.getByRole('link', { name: 'Home' }).click();
    await page.waitForURL("http://localhost:3000");
    const productCard = page.locator('.card-body:has-text("' + updatedProductName + '")');
    await expect(productCard).toBeVisible();
    const moreDetailsButton = productCard.getByRole('button', { name: 'More Details' });
    await expect(moreDetailsButton).toBeVisible();
    await moreDetailsButton.click();

    await page.waitForURL(`http://localhost:3000/product/${updatedProductName}`);
    await expect(page.getByRole('main')).toContainText(`Name : ${updatedProductName}`);
    await expect(page.getByRole('main')).toContainText(`Description : ${updatedProductName} Description`);
    await expect(page.getByRole('main')).toContainText('Price :$105.00');
    await expect(page.getByRole('main')).toContainText('Category : TEST-Category One');
});

test('Admin attempts to update product without making changes', async ({ page }) => {
    // Generate a unique product name
    const uniqueSuffix = new Types.ObjectId().toString(); 
    const productName = `TEST-Product-${uniqueSuffix}`;

    // Login
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
    await page.getByPlaceholder("Enter Your Password").fill("test123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://localhost:3000");

    // Navigate to create-product page
    await page.getByRole("button", { name: "Admin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Create Product" }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

    // Create the product
    await page.getByRole('combobox').first().click();
    await page.waitForSelector('.ant-select-item-option');
    await page.getByTitle('TEST-Category One').click();
    await expect(page.locator('.ant-select-selection-item').first()).toHaveText('TEST-Category One');

    const filePath = path.join('e2etests', 'testData', 'book.png');
    await page.setInputFiles('input[type="file"]', filePath);

    await page.getByPlaceholder("Write a Name").fill(productName); 
    await page.getByPlaceholder("Write a Description").fill(`${productName} Description`);
    await page.getByPlaceholder("Write a Price").fill("99.99");
    await page.getByPlaceholder("Write a Quantity").fill("100");

    await page.getByRole('combobox').nth(1).click();
    await page.getByTitle('Yes').click();
    await expect(page.locator('.ant-select-selection-item').nth(1)).toHaveText('Yes');

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin/products");

    // Verify creation
    await expect(page.getByRole('heading', { name: productName })).toBeVisible({ timeout: 5000 });

    // Edit the product - try to update with nothing change
    await page.getByRole('link', { name: new RegExp(productName) }).click();
    await page.waitForURL(`http://localhost:3000/dashboard/admin/product/${productName}`);
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await page.waitForSelector("text=No changes detected.", { timeout: 5000 });
});


test('Admin can delete a product successfully', async ({ page }) => {
    // Generate a unique product name
    const uniqueSuffix = new Types.ObjectId().toString(); 
    const productName = `TEST-Product-${uniqueSuffix}`;

    // Login
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
    await page.getByPlaceholder("Enter Your Password").fill("test123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://localhost:3000");

    // Navigate to create-product page
    await page.getByRole("button", { name: "Admin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Create Product" }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin/create-product");

    // Create the product
    await page.getByRole('combobox').first().click();
    await page.waitForSelector('.ant-select-item-option');
    await page.getByTitle('TEST-Category One').click();
    await expect(page.locator('.ant-select-selection-item').first()).toHaveText('TEST-Category One');

    const filePath = path.join('e2etests', 'testData', 'book.png');
    await page.setInputFiles('input[type="file"]', filePath);

    await page.getByPlaceholder("Write a Name").fill(productName); 
    await page.getByPlaceholder("Write a Description").fill(`${productName} Description`);
    await page.getByPlaceholder("Write a Price").fill("99.99");
    await page.getByPlaceholder("Write a Quantity").fill("100");

    await page.getByRole('combobox').nth(1).click();
    await page.getByTitle('Yes').click();
    await expect(page.locator('.ant-select-selection-item').nth(1)).toHaveText('Yes');

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin/products");

    // Verify creation
    await expect(page.getByRole('heading', { name: productName })).toBeVisible({ timeout: 5000 });

    // Locate and click Delete for that product
    await page.getByRole('link', { name: new RegExp(productName) }).click();
    await page.waitForURL(`http://localhost:3000/dashboard/admin/product/${productName}`);
    await page.waitForTimeout(1000);
    
    page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('prompt');
        expect(dialog.message()).toContain("Type 'yes' to confirm deletion");
        await dialog.accept('yes'); // 👈 Type 'yes' and hit OK
    });
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
    await page.waitForTimeout(1000);

    // 🔍 Verify product is gone
    await expect(page.locator('div').filter({ hasText: productName })).toHaveCount(0);

    await page.getByRole('link', { name: 'Home' }).click();
    await page.waitForURL("http://localhost:3000");
    const productCard = page.locator('.card-body:has-text("' + productName + '")');
    await expect(productCard).toHaveCount(0);
});


