import { test, expect } from "@playwright/test";

test("About page loads correctly", async ({ page }) => {
  await page.goto("http://localhost:3000/about");
  
  await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our Mission' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our Team' })).toBeVisible();
});

test("Admin can navigate to About page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  await page.getByRole('link', { name: 'About' }).click();
  await page.waitForURL("http://localhost:3000/about");

  await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our Mission' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our Team' })).toBeVisible();
});

test("User can navigate to About page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-user@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "User" }).click();
  await page.getByRole("link", { name: "Home" }).click();

  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  await page.getByRole('link', { name: 'About' }).click();
  await page.waitForURL("http://localhost:3000/about");

  await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our Mission' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our Team' })).toBeVisible();
});

test("Admin can navigate to Contact page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
  await page.getByRole('link', { name: 'Contact' }).click();
  await page.waitForURL("http://localhost:3000/contact");

  await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
});

test("User can navigate to Contact page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-user@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "User" }).click();
  await page.getByRole("link", { name: "Home" }).click();

  await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
  await page.getByRole('link', { name: 'Contact' }).click();
  await page.waitForURL("http://localhost:3000/contact");

  await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
});

test("Admin can navigate to Privacy Policy page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await page.waitForURL("http://localhost:3000/privacy-policy");

  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});

test("User can navigate to Privacy Policy page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-user@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole("button", { name: "User" }).click();
  await page.getByRole("link", { name: "Home" }).click();

  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await page.waitForURL("http://localhost:3000/privacy-policy");

  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});
