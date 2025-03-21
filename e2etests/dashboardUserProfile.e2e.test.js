import { test, expect } from '@playwright/test';

test('User enters profile page', async ({ page }) => {
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

    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user/profile");

    await expect(page.getByRole('textbox', { name: 'Enter Your Email' })).toHaveValue('test-user@example.com');
    await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue('Test User');
    await expect(page.getByRole('textbox', { name: 'Enter Your Phone' })).toHaveValue('12345678');
    await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue('Test Address');
});

test('Email field is disabled and cannot be updated', async ({ page }) => {
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

    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user/profile");

    const emailField = page.getByRole('textbox', { name: 'Enter Your Email' });
    await expect(emailField).toHaveValue('test-user@example.com');

    // Check if the email input field is disabled
    await expect(emailField).toBeDisabled();
});

test('User attempts to update name with empty field', async ({ page }) => {
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

    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user/profile");

    // Before
    await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue('Test User');

    // Updating of all fields
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('');
    
    await page.getByRole('button', { name: 'UPDATE' }).click();

    // After: Should revert back to original value
    await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue('Test User');

    await page.getByRole('button', { name: 'Test User' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user");

    await expect(page.getByRole('heading', { name: 'Test User' })).toBeVisible();
});

test('User attempts to update address with empty field', async ({ page }) => {
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

    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user/profile");

    // Before
    await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue('Test Address');

    // Updating of all fields
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('');
    
    await page.getByRole('button', { name: 'UPDATE' }).click();

    // After: Should revert back to original value
    await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue('Test Address');

    await page.getByRole('button', { name: 'Test User' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user");

    await expect(page.getByRole('heading', { name: 'Test Address' })).toBeVisible();
});

test('User updates name and address and all changes reflected on profile after navigation', async ({ page }) => {
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

    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user/profile");

    // Before
    await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue('Test User');
    await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue('Test Address');

    // Updating of all fields
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Updated User');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('Updated Address');
    
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await page.getByRole('button', { name: 'Test User' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL("http://localhost:3000/dashboard/user");

    // After
    await expect(page.getByRole('heading', { name: 'Updated User' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Updated Address' })).toBeVisible();
});