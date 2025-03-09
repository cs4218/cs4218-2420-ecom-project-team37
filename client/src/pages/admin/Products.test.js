import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";
import Products from "./Products";

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

describe("Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the All Products List heading", () => {
    render(
      <Router>
        <Products />
      </Router>,
    );

    expect(screen.getByText("All Products List")).toBeInTheDocument();
  });

  it("renders product links with correct href attributes", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        products: [
          {
            _id: "pid_123",
            name: "Novel",
            slug: "novel-slug",
            description: "A bestselling novel",
            price: 14.99,
          },
        ],
      },
    });

    render(
      <Router>
        <Products />
      </Router>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });

    const productLink = await screen.findByRole("link", { name: /Novel/i });
    expect(productLink).toBeInTheDocument();

    expect(productLink).toHaveAttribute(
      "href",
      "/dashboard/admin/product/novel-slug",
    );
    expect(await screen.findByText("A bestselling novel")).toBeInTheDocument();
  });

  it("should display an error message", async () => {
    axios.get.mockRejectedValue("API call failed");

    render(
      <Router>
        <Products />
      </Router>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
    });
  });
});
