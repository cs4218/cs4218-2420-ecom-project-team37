import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryProduct from "./CategoryProduct";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";

// Mock dependencies
jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
  },
}));
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("CategoryProduct Component", () => {
  const mockProducts = [
    {
      _id: "1",
      name: "Test Product 1",
      slug: "test-product-1",
      description: "This is a test product description",
      price: 99.99,
    },
    {
      _id: "2",
      name: "Test Product 2",
      slug: "test-product-2",
      description: "This is another test product description",
      price: 149.99,
    },
  ];

  const mockCategory = {
    _id: "cat1",
    name: "Test Category",
    slug: "test-category",
  };

  const mockNavigate = jest.fn();
  const mockCart = [];
  const mockSetCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: "test-category" });
    useNavigate.mockReturnValue(mockNavigate);
    useCart.mockReturnValue([mockCart, mockSetCart]);
  });

  test("renders loading state initially", async () => {
    let component;
    await act(async () => {
      component = render(<CategoryProduct />);
    });

    expect(screen.getByText(/Category -/i)).toBeInTheDocument();
    expect(screen.getByText(/0 result found/i)).toBeInTheDocument();
  });

  test("fetches and displays products", async () => {
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = () => {
        resolve({ data: { products: mockProducts, category: mockCategory } });
      };
    });

    axios.get.mockImplementation(() => apiPromise);

    await act(async () => {
      render(<CategoryProduct />);
    });

    await act(async () => {
      resolveApiCall();
      await flushPromises();
    });

    // Check that UI was updated with the correct data
    expect(
      screen.getByText(`Category - ${mockCategory.name}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${mockProducts.length} result found`),
    ).toBeInTheDocument();
    expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockProducts[1].name)).toBeInTheDocument();

    // Check if prices are formatted correctly
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("$149.99")).toBeInTheDocument();

    // Check if descriptions are truncated
    expect(
      screen.getByText(`${mockProducts[0].description.substring(0, 60)}...`),
    ).toBeInTheDocument();
  });

  test('navigates to product detail when "More Details" is clicked', async () => {
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = () => {
        resolve({ data: { products: mockProducts, category: mockCategory } });
      };
    });

    axios.get.mockImplementation(() => apiPromise);

    await act(async () => {
      render(<CategoryProduct />);
    });

    await act(async () => {
      resolveApiCall();
      await flushPromises();
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText("More Details")[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      `/product/${mockProducts[0].slug}`,
    );
  });

  test("handles API error gracefully", async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    let rejectApiCall;
    const apiPromise = new Promise((resolve, reject) => {
      rejectApiCall = () => {
        const mockError = new Error("API Error");
        mockError.response = { status: 500 };
        reject(mockError);
      };
    });

    axios.get.mockImplementation(() => apiPromise);

    await act(async () => {
      render(<CategoryProduct />);
    });

    await act(async () => {
      rejectApiCall();
      await flushPromises();
    });

    expect(console.log).toHaveBeenCalled();

    console.log = originalConsoleLog;
  });

  test("renders empty state when no products are returned", async () => {
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = () => {
        resolve({ data: { products: [], category: mockCategory } });
      };
    });

    axios.get.mockImplementation(() => apiPromise);

    await act(async () => {
      render(<CategoryProduct />);
    });

    await act(async () => {
      resolveApiCall();
      await flushPromises();
    });

    expect(
      screen.getByText(`Category - ${mockCategory.name}`),
    ).toBeInTheDocument();
    expect(screen.getByText("0 result found")).toBeInTheDocument();

    expect(screen.queryByText(mockProducts[0].name)).not.toBeInTheDocument();
  });

  test("does not fetch products when slug is not provided", async () => {
    useParams.mockReturnValue({ slug: undefined });

    await act(async () => {
      render(<CategoryProduct />);
      await flushPromises();
    });

    expect(axios.get).not.toHaveBeenCalled();
  });
});