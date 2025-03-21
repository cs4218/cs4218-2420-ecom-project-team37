import { test, expect } from '@playwright/test';

test('User logins and navigates to user page which shows user details', async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email ").fill("test-user@example.com");
    await page.getByPlaceholder("Enter Your Password").click();
    await page.getByPlaceholder("Enter Your Password").fill("test123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://localhost:3000");

    await expect(page.getByRole('button', { name: 'Test User' })).toBeVisible();
    await page.getByRole('button', { name: 'Test User' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user");

    // Expect correct user details
    await expect(page.getByRole('heading', { name: 'Test User' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'test-user@example.com' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Address' })).toBeVisible();
});

