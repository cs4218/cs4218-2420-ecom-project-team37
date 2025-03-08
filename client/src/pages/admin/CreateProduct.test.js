import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";
import { expect } from "@jest/globals";
import { message } from "antd";

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
  test("should render create product page correctly", async () => {
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );

    expect(
      screen.getByRole("heading", { name: "Create Product" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Select a Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Photo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write a Name/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Write a Description/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write a Price/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Write a Quantity/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Select Shipping/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /CREATE PRODUCT/i }),
    ).toBeInTheDocument();
  });

  // ================================================================
  // Section 2: Category Retrieval Tests
  // ================================================================
  test("should successfully get and displays categories", async () => {
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

    render(
      <Router>
        <CreateProduct />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );
    const categoryDropdown = screen.getByText(/Select a Category/i);
    fireEvent.mouseDown(categoryDropdown);
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("categoryID1");
    expect(options[1]).toHaveTextContent("categoryID2");
  });

  test("should display error message when category retrieval is false", async () => {
    axios.get.mockRejectedValue(new Error("API request failed"));

    render(
      <Router>
        <CreateProduct />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category",
      );
    });
  });

  // ================================================================
  // Section 3: Input Field Behavior
  // ================================================================
  test("should display input fields to be initially empty", async () => {
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
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

  test("should be able to fill up input fields: name, description, price, and quantity", async () => {
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
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
      "description",
    );
    expect(screen.getByPlaceholderText(/Write a Price/i).value).toBe("1");
    expect(screen.getByPlaceholderText(/Write a Quantity/i).value).toBe("1");
  });

  test("should display shipping options 'Yes' and 'No' correctly", async () => {
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  test("should fail to create product when photo size exceeds 1MB", async () => {
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
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
        "Photo size must be less than 1MB.",
      );
    });
  });

  test("should fail to create product when Price is invalid", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          { _id: "categoryID1", name: "Electronics", slug: "electronics" },
        ],
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
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
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    const categoryDropdown = screen.getByText(/Select a Category/i);
    fireEvent.mouseDown(categoryDropdown);
    const categoryOption = await screen.findByText(/Electronics/i);
    fireEvent.click(categoryOption);

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = screen.getByText("Yes");
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Price must be positive");
    });
  });

  test("should fail to create product when Quantity is invalid", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          { _id: "categoryID1", name: "Electronics", slug: "electronics" },
        ],
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
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
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    const categoryDropdown = screen.getByText(/Select a Category/i);
    fireEvent.mouseDown(categoryDropdown);
    const categoryOption = await screen.findByText(/Electronics/i);
    fireEvent.click(categoryOption);

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = screen.getByText("Yes");
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Quantity must be more than zero",
      );
    });
  });

  test("should display error when category fetch fails", async () => {
    axios.get.mockResolvedValue({
      data: { success: false, message: "Failed to fetch categories" },
    });
  
    render(
      <Router>
        <CreateProduct />
      </Router>
    );
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch categories");
    });
  });

  test("should display server error message on product creation failure", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [{ _id: "1", name: "Electronics" }],
      },
    });
  
    axios.post.mockResolvedValue({
      data: { success: false, message },
    });
  
    render(
      <Router>
        <CreateProduct />
      </Router>
    );
  
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  
    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "Laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "Powerful laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "1000" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "5" },
    });
  
    fireEvent.mouseDown(screen.getByText(/Select a Category/i));
    fireEvent.click(await screen.findByText(/Electronics/i));
  
    // Upload photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });
  
    // Select shipping
    fireEvent.mouseDown(screen.getByText(/Select Shipping/i));
    fireEvent.click(screen.getByText("Yes"));
  
    // Submit
    fireEvent.click(screen.getByText("CREATE PRODUCT"));
  
    // Verify server error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(message);
    });
  });

  test("should log error when product creation encounters an exception", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [{ _id: "1", name: "Electronics" }],
      },
    });
  
    const error = new Error("Network error");
    axios.post.mockRejectedValue(error);
  
    jest.spyOn(console, "log").mockImplementation(() => {});
  
    render(
      <Router>
        <CreateProduct />
      </Router>
    );
  
    // Select category
    const categoryDropdown = screen.getByText(/Select a Category/i);
    fireEvent.mouseDown(categoryDropdown);
    const categoryOption = await screen.findByText(/Electronics/i);
    fireEvent.click(categoryOption);

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText(/upload photo/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for image preview
    await waitFor(() => {
      expect(screen.getByAltText(/product_photo/i)).toBeInTheDocument();
    });

    // Fill in input fields
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
    const shippingOption = await screen.findByText("Yes", {
      selector: ".ant-select-item-option-content",
    });
    fireEvent.click(shippingOption);
    
    // Submit
    fireEvent.click(screen.getByText("CREATE PRODUCT"));
  
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(error);
    });
  
    console.log.mockRestore();
  });

  // ================================================================
  // Section 4: Pairwise Testing
  // ================================================================

  test("should successfully create a product with all valid fields", async () => {
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

    render(
      <Router>
        <CreateProduct />
      </Router>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    // Select category
    const categoryDropdown = screen.getByText(/Select a Category/i);
    fireEvent.mouseDown(categoryDropdown);
    const categoryOption = await screen.findByText(/Electronics/i);
    fireEvent.click(categoryOption);

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText(/upload photo/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for image preview
    await waitFor(() => {
      expect(screen.getByAltText(/product_photo/i)).toBeInTheDocument();
    });

    // Fill in input fields
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
    const shippingOption = await screen.findByText("Yes", {
      selector: ".ant-select-item-option-content",
    });
    fireEvent.click(shippingOption);

    // Click Create Product button
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    // Ensure API call is made and toast notification appears
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Created Successfully",
      );
    });
  });

  test("should fail to create product with these invalid fields: name, description, price and shipping", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          { _id: "categoryID1", name: "Electronics", slug: "electronics" },
        ],
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
    // Leave Name, description, price and shipping empty
    // Valid category, photo, quantity

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    // Select category
    const categoryDropdown = screen.getByText(/Select a Category/i);
    fireEvent.mouseDown(categoryDropdown);
    const categoryOption = await screen.findByText(/Electronics/i);
    fireEvent.click(categoryOption);

    // Write quantity
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("should fail to create product with these invalid fields: photo, description, quantity", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          { _id: "categoryID1", name: "Electronics", slug: "electronics" },
        ],
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
    // Leave photo, description, quantity empty
    // Valid category, name, price, shipping

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    // Select category
    const categoryDropdown = screen.getByText(/Select a Category/i);
    fireEvent.mouseDown(categoryDropdown);
    const categoryOption = await screen.findByText(/Electronics/i);
    fireEvent.click(categoryOption);

    // Fill in input fields
    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "NewLaptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "1499.99" },
    });

    // Select shipping option
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.findByText("Yes", {
      selector: ".ant-select-item-option-content",
    });
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("should fail to create product with these invalid fields: category, name, price, shipping", async () => {
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
    // Leave category, name, price, shipping empty
    // Valid photo, description, quantity

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });
    // Fill in input fields
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "A powerful laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });

  test("should fail to create product with these invalid fields: category, photo, quantity", async () => {
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );
    // Leave category, photo, quantity empty
    // Valid name, description, price, shipping

    // Fill in input fields
    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "Laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "A powerful laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "1499.99" },
    });

    // Select shipping option
    const shippingDropdown = screen.getByText(/Select Shipping/i);
    fireEvent.mouseDown(shippingDropdown);
    const shippingOption = await screen.findByText("Yes", {
      selector: ".ant-select-item-option-content",
    });
    fireEvent.click(shippingOption);

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });
  
  test("should fail to create product with these invalid fields: name, price, shipping", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          { _id: "categoryID1", name: "Electronics", slug: "electronics" },
        ],
      },
    });
    render(
      <Router>
        <CreateProduct />
      </Router>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    // Select category
    const categoryDropdown = screen.getByText(/Select a Category/i);
    fireEvent.mouseDown(categoryDropdown);
    const categoryOption = await screen.findByText(/Electronics/i);
    fireEvent.click(categoryOption);

    // Leave name, price, shipping empty
    // Valid category, photo, description, quantity

    // Upload Photo
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Upload Photo/i), {
      target: { files: [file] },
    });
    // Fill in input fields
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "A powerful laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "10" },
    });

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  });
});
