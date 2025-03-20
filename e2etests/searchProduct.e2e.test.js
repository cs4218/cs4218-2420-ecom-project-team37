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
  await page.getByRole('searchbox', { name: 'Search' }).fill('textbook');
  await page.getByRole('button', { name: 'Search' }).click();

  // Should navigate to /search URL path
  await page.waitForURL('http://localhost:3000/search');

  await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByText('A comprehensive textbook...')).toBeVisible();
  await expect(page.getByText('$ 79.99')).toBeVisible();
  await expect(page.locator('h6')).toContainText('Found 1');
});

// Test cases that start on the page /search
test('User searches one product that exists', async ({ page }) => {
  await page.goto("http://localhost:3000/search");

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('textbook');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByText('A comprehensive textbook...')).toBeVisible();
  await expect(page.getByText('$ 79.99')).toBeVisible();
  await expect(page.locator('h6')).toContainText('Found 1');
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
  await page.getByRole('searchbox', { name: 'Search' }).fill('book');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByText('A comprehensive textbook...')).toBeVisible();
  await expect(page.getByText('$ 79.99')).toBeVisible();
  await expect(page.getByRole('img', { name: 'The Law of Contract in' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Law of Contract in' })).toBeVisible();
  await expect(page.getByText('A bestselling book in')).toBeVisible();
  await expect(page.getByText('$ 54.99')).toBeVisible();
  await expect(page.locator('h6')).toContainText('Found 2');
});

test('User changes the current keyword search from a product to another', async ({ page }) => {
  // First product
  await page.goto('http://localhost:3000/search');
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('textbook');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByText('A comprehensive textbook...')).toBeVisible();
  await expect(page.getByText('$')).toBeVisible();

  // Second Product
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('shirt');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('img', { name: 'NUS T-shirt' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
  await expect(page.getByText('Plain NUS T-shirt for sale...')).toBeVisible();
  await expect(page.getByText('$')).toBeVisible();
})

test('Should not allow empty search query', async ({ page }) => {
  await page.goto('http://localhost:3000/search');
  await page.getByRole('searchbox', { name: 'Search' }).fill('');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { name: 'No Products Found' })).toBeVisible();
});

// Following test case test the more details functionality in search page
test('User clicks on more details of the product textbook', async({ page }) => {
  await page.goto('http://localhost:3000/search');
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('textbook');
  await page.getByRole('searchbox', { name: 'Search' }).press('Enter');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();

  await page.getByRole('button', { name: 'More Details' }).click();
  await page.waitForURL("http://localhost:3000/product/textbook");

  await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Name : Textbook' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Description : A comprehensive' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Price :$' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Category : Book' })).toBeVisible();
})

// Following test case test the add to cart functionality in search page
test('User adds textbook to cart successfully', async ({ page }) => {
  await page.goto("http://localhost:3000/search");

  // No items in cart: 0
  await expect(page.getByRole('superscript')).toMatchAriaSnapshot(`- superscript: "0"`);

  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('textbook');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();

  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();

  // Added textbook to cart : 1
  await expect(page.getByRole('superscript')).toMatchAriaSnapshot(`- superscript: "1"`);

  await page.getByRole('link', { name: 'Cart' }).click();
  await page.waitForURL("http://localhost:3000/cart");

  // Textbook is added to cart successfully
  await expect(page.getByRole('img', { name: 'Textbook' })).toBeVisible();
  await expect(page.getByText('Textbook', { exact: true })).toBeVisible();
  await expect(page.getByText('A comprehensive textbook')).toBeVisible();
  await expect(page.getByText('Price :')).toBeVisible();
});
