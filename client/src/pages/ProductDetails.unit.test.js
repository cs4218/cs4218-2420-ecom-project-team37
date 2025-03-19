import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ProductDetails from "./ProductDetails";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

// Mock dependencies
jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("ProductDetails Component", () => {
  const mockProduct = {
    _id: "1",
    name: "Test Product",
    slug: "test-product",
    description: "This is a test product description",
    price: 99.99,
    category: { _id: "cat1", slug: "cat1", name: "Test Category" },
  };

  const mockRelatedProducts = [
    {
      _id: "2",
      name: "Related Product 1",
      slug: "related-product-1",
      description: "Related product description",
      price: 49.99,
    },
  ];

  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: "test-product" });
    useNavigate.mockReturnValue(mockNavigate);
  });

  test("renders loading state initially", async () => {
    await act(async () => {
      render(<ProductDetails />);
    });

    expect(screen.getByText(/Product Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Description/i)).toBeInTheDocument();
    expect(screen.getByText(/Price/i)).toBeInTheDocument();
    expect(screen.getByText(/Category/i)).toBeInTheDocument();
    expect(screen.getByText(/ADD TO CART/i)).toBeInTheDocument();
  });

  test("fetches and displays product details", async () => {
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = () => {
        resolve({ data: { product: mockProduct } });
      };
    });

    let resolveRelatedApiCall;
    const relatedApiPromise = new Promise((resolve) => {
      resolveRelatedApiCall = () => {
        resolve({ data: { products: mockRelatedProducts } });
      };
    });

    axios.get.mockImplementationOnce(() => apiPromise); // Mock product API
    axios.get.mockImplementationOnce(() => relatedApiPromise); // Mock related products API

    await act(async () => {
      render(<ProductDetails />);
    });

    await act(async () => {
      resolveApiCall(); // Resolve product API
      await flushPromises();
    });

    await act(async () => {
      resolveRelatedApiCall(); // Resolve related products API
      await flushPromises();
    });

    expect(screen.getByText(`Name : ${mockProduct.name}`)).toBeInTheDocument();
    expect(
      screen.getByText(`Description : ${mockProduct.description}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Category : ${mockProduct.category.name}`)
    ).toBeInTheDocument();
  });

  test("handles API error gracefully", async () => {
    console.log = jest.fn();

    let rejectApiCall;
    const apiPromise = new Promise((_, reject) => {
      rejectApiCall = () => {
        const mockError = new Error("API Error");
        mockError.response = { status: 500 };
        reject(mockError);
      };
    });

    axios.get.mockImplementation(() => apiPromise);

    await act(async () => {
      render(<ProductDetails />);
    });

    await act(async () => {
      rejectApiCall();
      await flushPromises();
    });

    expect(console.log).toHaveBeenCalled();
  });

  test("navigates to product detail when 'More Details' is clicked on related product", async () => {
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = () => {
        resolve({ data: { product: mockProduct } });
      };
    });
    axios.get.mockImplementation(() => apiPromise);

    let resolveRelatedApiCall;
    const relatedApiPromise = new Promise((resolve) => {
      resolveRelatedApiCall = () => {
        resolve({ data: { products: mockRelatedProducts } });
      };
    });
    axios.get.mockImplementationOnce(() => apiPromise);
    axios.get.mockImplementationOnce(() => relatedApiPromise);

    await act(async () => {
      render(<ProductDetails />);
    });

    await act(async () => {
      resolveApiCall();
      await flushPromises();
    });

    await act(async () => {
      resolveRelatedApiCall();
      await flushPromises();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("More Details"));
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      `/product/${mockRelatedProducts[0].slug}`
    );
  });

  test("renders empty state when no related products are found", async () => {
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = () => {
        resolve({ data: { product: mockProduct } });
      };
    });
    axios.get.mockImplementation(() => apiPromise);

    let resolveRelatedApiCall;
    const relatedApiPromise = new Promise((resolve) => {
      resolveRelatedApiCall = () => {
        resolve({ data: { products: [] } });
      };
    });
    axios.get.mockImplementationOnce(() => apiPromise);
    axios.get.mockImplementationOnce(() => relatedApiPromise);

    await act(async () => {
      render(<ProductDetails />);
    });

    await act(async () => {
      resolveApiCall();
      await flushPromises();
    });

    await act(async () => {
      resolveRelatedApiCall();
      await flushPromises();
    });

    expect(screen.getByText("No Similar Products found")).toBeInTheDocument();
  });

  test("logs error when fetching similar products fails", async () => {
    console.log = jest.fn();

    let resolveProductApiCall;
    const productApiPromise = new Promise((resolve) => {
      resolveProductApiCall = () => {
        resolve({ data: { product: mockProduct } });
      };
    });

    let rejectRelatedApiCall;
    const relatedApiPromise = new Promise((_, reject) => {
      rejectRelatedApiCall = () => {
        const mockError = new Error("Related Products API Error");
        mockError.response = { status: 500 };
        reject(mockError);
      };
    });

    axios.get.mockImplementationOnce(() => productApiPromise);
    axios.get.mockImplementationOnce(() => relatedApiPromise);

    await act(async () => {
      render(<ProductDetails />);
    });

    await act(async () => {
      resolveProductApiCall();
      await flushPromises();
    });

    await act(async () => {
      rejectRelatedApiCall();
      await flushPromises();
    });

    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });
  
});
