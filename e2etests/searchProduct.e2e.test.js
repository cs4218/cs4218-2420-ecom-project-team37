import { test, expect } from '@playwright/test';

// Test case that starts from login page
test('User logins to homepage and searches one product that exists', async ({ page }) => {
  // Login first
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email ").fill("test-admin@example.com");
  await page.getByPlaceholder("Enter Your Password").click();
  await page.getByPlaceholder("Enter Your Password").fill("test123");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.waitForURL("http://localhost:3000");
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('Test-Product One');
  await page.getByRole('button', { name: 'Search' }).click();

  // Should navigate to /search URL path
  await page.waitForURL('http://localhost:3000/search');

  await expect(page.getByRole('heading', { name: 'TEST-Product One' })).toBeVisible();
  await expect(page.getByText('Test Product One Description')).toBeVisible();
  await expect(page.getByText('$ 100')).toBeVisible();
});

// Test cases that start on the page /search
test('User searches one product that exists', async ({ page }) => {
  await page.goto("http://localhost:3000/search");

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('Test-Product One');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { name: 'TEST-Product One' })).toBeVisible();
  await expect(page.getByText('Test Product One Description')).toBeVisible();
  await expect(page.getByText('$ 100')).toBeVisible();
});

test('User searches a product that does not exist in products', async ({page}) => {
  await page.goto('http://localhost:3000/search');

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('monitor');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No Products Found' })).toBeVisible();
})

test('User searches a keyword matching more than one product', async ({ page }) => {
  await page.goto('http://localhost:3000/search');

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('TEST-Product');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { name: 'TEST-Product One' })).toBeVisible();
  await expect(page.getByText('Test Product One Description')).toBeVisible();
  await expect(page.getByText('$ 100')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'TEST-Product Two' })).toBeVisible();
  await expect(page.getByText('Test Product Two Description')).toBeVisible();
  await expect(page.getByText('$ 200')).toBeVisible();
});

test('User changes the current keyword search from a product to another', async ({ page }) => {
  // First product
  await page.goto('http://localhost:3000/search');
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('Test-Product One');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { name: 'TEST-Product One' })).toBeVisible();
  await expect(page.getByText('Test Product One Description')).toBeVisible();
  await expect(page.getByText('$ 100')).toBeVisible();

  // Second Product
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('Test-Product Two');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('heading', { name: 'TEST-Product Two' })).toBeVisible();
  await expect(page.getByText('Test Product Two Description')).toBeVisible();
  await expect(page.getByText('$ 200')).toBeVisible();
})

test('Should not allow empty search query', async ({ page }) => {
  await page.goto('http://localhost:3000/search');
  await page.getByRole('searchbox', { name: 'Search' }).fill('');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { name: 'No Products Found' })).toBeVisible();
});

// Following test case test the more details functionality in search page
test('User clicks on more details of test product one', async({ page }) => {
  await page.goto('http://localhost:3000/search');
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('Test-Product One');
  await page.getByRole('searchbox', { name: 'Search' }).press('Enter');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { name: 'TEST-Product One' })).toBeVisible();

  await page.getByRole('button', { name: 'More Details' }).click();
  await page.waitForURL("http://localhost:3000/product/test-product-one");

  await expect(page.getByRole('heading', { name: 'TEST-Product One' })).toBeVisible();
  await expect(page.getByText('Test Product One Description')).toBeVisible();
})

// Following test case test the add to cart functionality in search page
test('User adds textbook to cart successfully', async ({ page }) => {
  await page.goto("http://localhost:3000/search");

  // No items in cart: 0
  await expect(page.getByRole('superscript')).toMatchAriaSnapshot(`- superscript: "0"`);

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('Test-Product One');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByText('Test Product One Description')).toBeVisible();

  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();

  // Added textbook to cart : 1
  await expect(page.getByRole('superscript')).toMatchAriaSnapshot(`- superscript: "1"`);

  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForURL("http://localhost:3000/cart");

  // Textbook is added to cart successfully
  await expect(page.getByText('TEST-Product One', { exact: true })).toBeVisible();
  await expect(page.getByText('Test Product One Description')).toBeVisible();
  await expect(page.getByText('Price : 100')).toBeVisible();
});
