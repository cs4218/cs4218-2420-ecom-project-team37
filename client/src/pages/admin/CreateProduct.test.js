import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";
import { expect } from "@jest/globals";
import { act } from "react-dom/test-utils";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));
jest.spyOn(console, "log").mockImplementation(() => {});

describe("Product Component Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Define image previews to work in tests
    global.URL.createObjectURL = jest.fn(() => "blob:mocked-url");
  });

  // ================================================================
  // Section 1: Rendering Tests
  // ================================================================
  test("Test 1: Renders Create Product page correctly", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });
    expect(
      screen.getByRole("heading", { name: "Create Product" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Select a Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Photo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write a Name/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Write a Description/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write a Price/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Write a Quantity/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Select Shipping/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /CREATE PRODUCT/i })
    ).toBeInTheDocument();
  });

  // ================================================================
  // Section 2: Category Retrieval Tests
  // ================================================================
  test("Test 2: Successfully gets and displays categories", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "categoryID1",
            name: "Electronics",
            slug: "electronics",
            __v: 0,
          },
          { _id: "categoryID2", name: "Furniture", slug: "furniture", __v: 0 },
        ],
      },
    });

    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const options = await screen.findAllByRole("option");
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent("categoryID1");
      expect(options[1]).toHaveTextContent("categoryID2");
    });
  });

  test("Test 3: Display error message when category retrieval is false", async () => {
    axios.get.mockRejectedValue(new Error("API request failed"));

    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category"
      );
    });
  });

  // ================================================================
  // Section 3: Input Field Behavior
  // ================================================================
  test("Test 4: Input fields are initially empty", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });
    // Check all fields to be in default state
    expect(screen.getByText(/Select a Category/i)).toBeInTheDocument();

    // Check that no file is uploaded
    const fileInput = screen.getByLabelText(/Upload Photo/i);
    expect(fileInput.files.length).toBe(0);
    expect(screen.getByPlaceholderText(/Write a Name/i).value).toBe("");
    expect(screen.getByPlaceholderText(/Write a Description/i).value).toBe("");
    expect(screen.getByPlaceholderText(/Write a Price/i).value).toBe("");
    expect(screen.getByPlaceholderText(/Write a Quantity/i).value).toBe("");
    expect(screen.getByText(/Select Shipping/i)).toBeInTheDocument();
  });

  test("Test 5: Input fields to be filled up: name, description, price, and quantity", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "1" },
    });
    expect(screen.getByPlaceholderText(/Write a Name/i).value).toBe("name");
    expect(screen.getByPlaceholderText(/Write a Description/i).value).toBe(
      "description"
    );
    expect(screen.getByPlaceholderText(/Write a Price/i).value).toBe("1");
    expect(screen.getByPlaceholderText(/Write a Quantity/i).value).toBe("1");
  });

  test("Test 6: Displays shipping options 'Yes' and 'No' correctly", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  // ================================================================
  // Section 4: Product Creation Validation Tests (Decision Table)
  // ================================================================

  test("Test 7: Successfully creates a product with all valid inputs", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "categoryID1",
            name: "Electronics",
            slug: "electronics",
            __v: 0,
          },
          { _id: "categoryID2", name: "Furniture", slug: "furniture", __v: 0 },
        ],
      },
    });
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "Product Created Successfully",
        products: {
          name: "NewLaptop",
          slug: "NewLaptop",
          description: "A powerful laptop",
          price: 1499.99,
          category: "categoryID1",
          quantity: 10,
          shipping: true,
          _id: "newProductID",
          createdAt: Date.now().toString(),
          updatedAt: Date.now().toString(),
          __v: 0,
        },
      },
    });

    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    // Fill in all required inputs

    // Category
    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    // Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText(/upload photo/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      const img = screen.getByAltText(/product_photo/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", expect.stringContaining("blob:"));
    });
    // Input Fields
    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "NewLaptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "A powerful laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "1499.99" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    // Select shipping option
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes", {
      selector: ".ant-select-item-option-content",
    });
    fireEvent.click(shippingOption);

    // Create product
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
  });

  test("Test 8: Product creation fails when Name is invalid", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    // Fill in all fields except Name
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    // Select category
    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    // Upload photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    // Select shipping option
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes");
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("Test 9: Product creation fails when Description is invalid", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes");
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("Test 10: Product creation fails when Price is invalid", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "-100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes");
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Price must be positive");
    });
  });

  test("Test 11: Product creation fails when Quantity is invalid", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "-5" },
    });

    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes");
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Quantity must be more than zero"
      );
    });
  });

  test("Test 12: Product creation fails when Shipping is not selected", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("Test 13: Product creation fails when Photo is missing", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("Test 14: Product creation fails when Category is invalid", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    // Select shipping option
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes");
    fireEvent.click(shippingOption);

    // Don't select category (leave it empty)
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  // ================================================================
  // Section 5: Pairwise Testing
  // ================================================================

  test("Test 15: Product creation fails with invalid Name & Category ", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    // Leave Name empty
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    // Select shipping
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes");
    fireEvent.click(shippingOption);

    // Leave category empty
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("Test 16: Product creation fails with invalid Description & Quantity", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });

    // Leave Description empty
    // Invalid quantity
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "-5" },
    });

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    // Select Category
    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    // Select Shipping
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes");
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Quantity must be more than zero"
      );
    });
  });

  test("Test 17: Product creation fails with invalid Price & Photo ", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "-100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    // No Photo Uploaded

    // Select Category
    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    // Select Shipping
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.getByText("Yes");
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Price must be positive");
    });
  });

  test("Test 18: Product creation fails with invalid Shipping & Category", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "James" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "a new product" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    // Select Category
    // Leave Shipping empty
    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("Test 19: Product creation fails with invalid Name & Description", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    // Leave Name & Description empty
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    // Select Category
    await waitFor(async () => {
      const categoryDropdown = screen.getByText(/Select a Category/i);
      fireEvent.mouseDown(categoryDropdown);
      const categoryOption = await screen.getByText(/Electronics/i);
      fireEvent.click(categoryOption);
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("Test 20: Product creation fails when photo size exceeds 1MB", async () => {
    await act(async () => {
      render(
        <Router>
          <CreateProduct />
        </Router>
      );
    });

    // Create a large file (1.5MB)
    const largeFile = new File(["a".repeat(1.5 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [largeFile] },
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Photo size must be less than 1MB."
      );
    });
  });
});
