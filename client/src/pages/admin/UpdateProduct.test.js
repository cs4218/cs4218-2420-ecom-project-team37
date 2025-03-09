/* eslint-disable testing-library/no-unnecessary-act */
import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";
import { act } from "@testing-library/react";

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

jest.mock("../../components/Header", () => () => (
  <div data-testid="mock-header">Mock Header</div>
));

describe("Update Product Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "blob:mocked-url");
  });

  const mockProduct = {
    data: {
      success: true,
      message: "Single Product Fetched",
      product: {
        _id: "pid_1",
        name: "Test",
        slug: "Test",
        description: "Test",
        price: 1,
        category: {
          _id: "categoryID1",
        },
        quantity: 1,
        shipping: true,
      },
    },
  };

  const mockCategories = {
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
      ],
    },
  };

  const setupMocks = () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve(mockCategories);
      }
      if (url === "/api/v1/product/get-product/pid_1") {
        return Promise.resolve(mockProduct);
      }
      return Promise.reject(new Error(`Unhandled GET to ${url}`));
    });
  };

  it("renders the update product page without crashing", async () => {
    setupMocks();
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/pid_1",
      );
    });
    expect(
      screen.getByRole("heading", { name: "Update Product" }),
    ).toBeInTheDocument();
  });
  it("should retrieve the product and categories correctly", async () => {
    setupMocks();

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/pid_1",
      );
    });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a name/i).value).toBe(
        mockProduct.data.product.name,
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a description/i).value).toBe(
        mockProduct.data.product.description,
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a price/i).value).toBe(
        mockProduct.data.product.price.toString(),
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a quantity/i).value).toBe(
        mockProduct.data.product.quantity.toString(),
      );
    });

    expect(
      screen.getByRole("button", { name: "UPDATE PRODUCT" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "DELETE PRODUCT" }),
    ).toBeInTheDocument();
  });

  it("should not update product if no changes are made", async () => {
    setupMocks();

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/pid_1",
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a name/i).value).toBe(
        mockProduct.data.product.name,
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a description/i).value).toBe(
        mockProduct.data.product.description,
      );
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("No changes detected.");
    });

    await waitFor(() => {
      expect(axios.put).not.toHaveBeenCalled();
    });
  });

  it("should update the product successfully", async () => {
    setupMocks();

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
          <Route
            path="/dashboard/admin/products"
            element={<div>Product List</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    axios.put.mockResolvedValue({
      data: { success: true, message: "Product Updated successfully" },
    });

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "Updated Product" },
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a name/i).value).toBe(
        "Updated Product",
      );
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Updated Successfully",
      );
    });
  });

  it("should show an error if updating product fails", async () => {
    setupMocks();

    jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>,
    );

    axios.put.mockRejectedValue("Update went wrong");

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "Updated Product" },
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update went wrong");
    });

    console.error.mockRestore();
  });

  it("should not delete product if user cancels confirmation prompt", async () => {
    setupMocks();

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    jest.spyOn(window, "prompt").mockReturnValue("");

    await act(async () => {
      fireEvent.click(screen.getByText("DELETE PRODUCT"));
    });

    await waitFor(() => {
      expect(axios.delete).not.toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith("Product deletion cancelled");
  });

  it("should delete the product successfully", async () => {
    setupMocks();

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
            <Route
              path="/dashboard/admin/products"
              element={<div>Product List</div>}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    axios.delete.mockResolvedValue({
      data: { success: true, message: "Product deleted successfully" },
    });

    jest.spyOn(window, "prompt").mockReturnValue("yes");

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/pid_1",
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a name/i).value).toBe(
        mockProduct.data.product.name,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText("DELETE PRODUCT"));
    });

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        `/api/v1/product/delete-product/${mockProduct.data.product._id}`,
      );
    });

    expect(toast.success).toHaveBeenCalledWith("Product deleted successfully");
  });

  it("should display an error message if deletion fails", async () => {
    setupMocks();

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    axios.delete.mockRejectedValue("Deletion failed");

    jest.spyOn(window, "prompt").mockReturnValue("yes");

    await act(async () => {
      fireEvent.click(screen.getByText("DELETE PRODUCT"));
    });

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith("Delete went wrong");
  });

  it("should show an error if category retrieval fails", async () => {
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/category/get-category`) {
        return Promise.reject("Category fetch failed");
      }
      if (url === "/api/v1/product/get-product/pid_1") {
        return Promise.resolve(mockProduct);
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category",
      );
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a name/i).value).toBe(
        mockProduct.data.product.name,
      );
    });
  });

  it("should handle errors when setting category", async () => {
    setupMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});

    axios.get.mockRejectedValue(new Error("Category fetch failed"));

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });

    console.log.mockRestore();
  });

  it("should show an error if quantity is zero or negative", async () => {
    setupMocks();

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "0" },
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Quantity must be more than zero",
      );
    });
  });

  it("should show an error if price is negative", async () => {
    setupMocks();

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "-10" },
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Price must be positive");
    });
  });

  it("should update input fields when values change", async () => {
    setupMocks();

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "New Description" },
    });

    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "99" },
    });

    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "5" },
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a description/i).value).toBe(
        "New Description",
      );
    });
    expect(screen.getByPlaceholderText(/write a price/i).value).toBe("99");
    expect(screen.getByPlaceholderText(/write a quantity/i).value).toBe("5");
  });
  it("should show error when required fields are missing", async () => {
    setupMocks();

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("All fields are required"),
    );
  });
  test("should fail to update product when photo size exceeds 1MB", async () => {
    setupMocks();

    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={["/dashboard/admin/update-product/pid_1"]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/pid_1",
      );
    });

    await waitFor(() => {
      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
    });

    const dropdowns = screen.getAllByRole("combobox");
    const categoryDropdown = dropdowns[0];
    fireEvent.mouseDown(categoryDropdown);

    const categoryOptions = screen.getAllByText(/Electronics/i);
    fireEvent.click(categoryOptions[categoryOptions.length - 1]);

    fireEvent.change(screen.getByPlaceholderText(/Write a Name/i), {
      target: { value: "Updated Laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Description/i), {
      target: { value: "An even more powerful laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Price/i), {
      target: { value: "1599.99" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write a Quantity/i), {
      target: { value: "15" },
    });

    const shippingDropdown = dropdowns[1];
    fireEvent.mouseDown(shippingDropdown);

    const shippingOption = await screen.findByText("Yes", {
      selector: ".ant-select-item-option-content",
    });
    fireEvent.click(shippingOption);

    const largeFile = new File(["a".repeat(1.5 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/upload photo/i), {
        target: { files: [largeFile] },
      });
    });

    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Photo size must be less than 1MB.",
      );
    });

    global.URL.createObjectURL.mockRestore();
  });

  test("should update a category state", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: {
            success: true,
            category: [
              { _id: "categoryID1", name: "Electronics" },
              { _id: "categoryID2", name: "Furniture" },
            ],
          },
        });
      }
      if (url.includes("/api/v1/product/get-product/pid_1")) {
        return Promise.resolve({
          data: {
            success: true,
            product: {
              _id: "pid_1",
              name: "Old Laptop",
              description: "A powerful laptop",
              price: 1499.99,
              quantity: 10,
              category: { _id: "categoryID1" },
              shipping: true,
            },
          },
        });
      }
    });

    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route
            path="/dashboard/admin/update-product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/pid_1",
      );
    });

    const dropdowns = screen.getAllByRole("combobox");
    const categoryDropdown = dropdowns[0]; 
    fireEvent.mouseDown(categoryDropdown);

    const categoryOption = await screen.findByText("Furniture", {
      selector: ".ant-select-item-option-content",
    });
    fireEvent.click(categoryOption);
    await waitFor(() => {
      const selectedCategory = screen.getByText("Furniture", {
        selector: ".ant-select-selection-item",
      });
      expect(selectedCategory).toBeInTheDocument();
    });
  });

  test("should update a shipping state", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: {
            success: true,
            category: [
              { _id: "categoryID1", name: "Electronics" },
              { _id: "categoryID2", name: "Furniture" },
            ],
          },
        });
      }
      if (url.includes("/api/v1/product/get-product/pid_1")) {
        return Promise.resolve({
          data: {
            success: true,
            product: {
              _id: "pid_1",
              name: "Old Laptop",
              description: "A powerful laptop",
              price: 1499.99,
              quantity: 10,
              category: { _id: "categoryID1" },
              shipping: false, 
            },
          },
        });
      }
    });
  
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route path="/dashboard/admin/update-product/:slug" element={<UpdateProduct />} />
        </Routes>
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/pid_1");
    });
  
    const dropdowns = screen.getAllByRole("combobox");
    const shippingDropdown = dropdowns[1]; 
    fireEvent.mouseDown(shippingDropdown);
  
    const shippingOption = await screen.findByText("Yes", {
      selector: ".ant-select-item-option-content",
    });
    fireEvent.click(shippingOption);
  
    await waitFor(() => {
      const selectedShipping = screen.getByText("Yes", {
        selector: ".ant-select-selection-item",
      });
      expect(selectedShipping).toBeInTheDocument();
    });
  });
  
  test("Handles update failure correctly", async () => {
    axios.put.mockResolvedValue({
      data: {
        success: false,
        message: "Failed to update product",
      },
    });
  
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/update-product/pid_1"]}>
        <Routes>
          <Route path="/dashboard/admin/update-product/:slug" element={<UpdateProduct />} />
        </Routes>
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/pid_1");
    });
  
    fireEvent.change(screen.getByPlaceholderText("Write a Name"), {
      target: { value: "Updated Laptop" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a Description"), {
      target: { value: "Updated description" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a Price"), {
      target: { value: "1299.99" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write a Quantity"), {
      target: { value: "5" },
    });
  
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));
  
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/pid_1",
        expect.any(FormData)
      );
    });
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update product");
    });
  });
  
  
});
