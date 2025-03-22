import { test, expect } from '@playwright/test';
import {Types} from "mongoose";
import path from 'path';

test('Admin can create a order and change status of order', async ({ page }) => {
    // Generate a unique product name
    const uniqueSuffix = new Types.ObjectId().toString(); 
    const productName = `TEST-Product-${uniqueSuffix}`;
    const price = "50.25";

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
    await page.getByPlaceholder("Write a Price").fill(`${price}`);
    await page.getByPlaceholder("Write a Quantity").fill("100");

    await page.getByRole('combobox').nth(1).click();
    await page.getByTitle('Yes').click();
    await expect(page.locator('.ant-select-selection-item').nth(1)).toHaveText('Yes');

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin/products");

    // verify creation
    await expect(page.getByRole('heading', { name: productName })).toBeVisible({ timeout: 5000 });

    await page.getByRole('link', { name: 'Home' }).click();
    await page.waitForURL("http://localhost:3000");
    const productCard = page.locator('.card-body:has-text("' + productName + '")');
    await expect(productCard).toBeVisible();
    const addToCartButton = productCard.getByRole('button', { name: 'ADD TO CART' });
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
    await page.waitForSelector("text=Item Added to cart", { timeout: 5000 });

    // go to cart
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Paying with Card' }).click();
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('5123 4500 0000 0008');
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('0227');
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('123');
    await page.getByRole('button', { name: 'Make Payment' }).click();

    await page.waitForURL("http://localhost:3000/dashboard/user/orders");

    await page.getByRole('button', { name: 'Test Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin");
    await page.getByRole('link', { name: 'Orders' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/admin/orders");

    // get first order card (latest order)
    const firstOrder = page.locator('.border.shadow').first();
   
    // verify products
    const products = firstOrder.locator('.row.mb-2.p-3.card');
    await expect(products).toHaveCount(1);

    await expect(products.nth(0)).toContainText(`${productName}`);
    await expect(products.nth(0)).toContainText(`${price}`);

    // find the select dropdown inside the first order
    const statusSelect = firstOrder.locator('.ant-select-selector').first();
    await statusSelect.click();

    // click dropdown option for "Shipped"
    await page.locator('.ant-select-item-option[title="Shipped"]').click();

    // expect dropdown value changed
    await expect(statusSelect).toContainText('Shipped');
});