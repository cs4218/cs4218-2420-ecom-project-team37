import { test, expect } from "@playwright/test";

function generateRandomEmail() {
  const random = Math.random().toString(36).substring(2, 10);
  return `test-user-${random}@example.com`;
}

test("User can register a new account", async ({ page }) => {
  await page.goto("http://localhost:3000/register");
  
  await expect(page.getByRole('heading', { name: 'REGISTER FORM' })).toBeVisible();
  
  await page.getByPlaceholder("Enter Your Name").fill("Test User");
  await page.getByPlaceholder("Enter Your Email").fill(generateRandomEmail());
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByPlaceholder("Enter Your Phone").fill("87654321");
  await page.getByPlaceholder("Enter Your Address").fill("123 Test Street");
  await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");
  await page.getByPlaceholder("What is Your Favorite sports").fill("Cricket");
  
  await page.getByRole("button", { name: "REGISTER" }).click();

  await page.waitForURL("http://localhost:3000/login");
  await expect(page).toHaveURL("http://localhost:3000/login");
});

test("User cannot register with missing fields", async ({ page }) => {
  await page.goto("http://localhost:3000/register");
  
  await page.getByRole("button", { name: "REGISTER" }).click();
  
  await page.getByPlaceholder("Enter Your Name").fill("Test User");

  await expect(page).toHaveURL("http://localhost:3000/register");

  await page.getByPlaceholder("Enter Your Email").fill("testuser@test.com");

  await expect(page).toHaveURL("http://localhost:3000/register");

  await page.getByPlaceholder("Enter Your Password").fill("test123");

  await expect(page).toHaveURL("http://localhost:3000/register");
  
  await page.getByPlaceholder("Enter Your Phone").fill("87654321");

  await expect(page).toHaveURL("http://localhost:3000/register");

  await page.getByPlaceholder("Enter Your Address").fill("123 Test Street");

  await expect(page).toHaveURL("http://localhost:3000/register");

  await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");

  await expect(page).toHaveURL("http://localhost:3000/register");
});

test("User cannot register with an existing email", async ({ page }) => {
  await page.goto("http://localhost:3000/register");
  
  await page.getByPlaceholder("Enter Your Name").fill("Another User");
  await page.getByPlaceholder("Enter Your Email").fill("test-admin@example.com"); // Using existing email from other tests
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByPlaceholder("Enter Your Phone").fill("12345678");
  await page.getByPlaceholder("Enter Your Address").fill("456 Test Avenue");
  await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");
  await page.getByPlaceholder("What is Your Favorite sports").fill("Cricket");
  

  await page.getByRole("button", { name: "REGISTER" }).click();
  
  await expect(page).toHaveURL("http://localhost:3000/register");
}); 