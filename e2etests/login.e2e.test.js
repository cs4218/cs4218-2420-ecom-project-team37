import { test, expect } from "@playwright/test";

test("User can login with valid credentials", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  
  await page.getByPlaceholder("Enter Your Email").fill("test-user@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();
  
  await page.waitForURL("http://localhost:3000");
  await expect(page.getByRole("button", { name: "Test User" })).toBeVisible();
});

test("User cannot login with invalid credentials", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  
  // First test: Incorrect email (404 error)
  await page.getByPlaceholder("Enter Your Email").fill("nonexistent@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("anypassword");
  await page.getByRole("button", { name: "LOGIN" }).click();
  
  await page.waitForSelector("text=Email not registered", { timeout: 5000 });
  await expect(page.locator("text=Email not registered")).toBeVisible();

  // Second test: Incorrect password (401 error)
  await page.getByPlaceholder("Enter Your Email").clear();
  await page.getByPlaceholder("Enter Your Password").clear();
  await page.getByPlaceholder("Enter Your Email").fill("test-user@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("wrongpassword");
  await page.getByRole("button", { name: "LOGIN" }).click();
  
  await page.waitForSelector("text=Incorrect password", { timeout: 5000 });
  await expect(page.locator("text=Incorrect password")).toBeVisible();
});

test("User cannot login with empty fields", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  
  await page.getByRole("button", { name: "LOGIN" }).click();
  
  await expect(page).toHaveURL("http://localhost:3000/login");

  await page.getByPlaceholder("Enter Your Email").fill("test-user@example.com");

  await page.getByRole("button", { name: "LOGIN" }).click();
  
  await expect(page).toHaveURL("http://localhost:3000/login");

  await page.getByPlaceholder("Enter Your Email").fill("");

  await page.getByPlaceholder("Enter Your Password").fill("test123");

  await page.getByRole("button", { name: "LOGIN" }).click();
  
  await expect(page).toHaveURL("http://localhost:3000/login");

      
});

test("User can navigate to forgot password page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  
  await page.getByRole("button", { name: "Forgot Password" }).click();
  
  await page.waitForURL("http://localhost:3000/forgot-password");
  await expect(page).toHaveURL("http://localhost:3000/forgot-password");
}); 