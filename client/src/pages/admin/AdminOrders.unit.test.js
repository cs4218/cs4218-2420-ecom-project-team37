import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminOrders from "./AdminOrders";
import { expect } from "@jest/globals";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/Header", () => () => (
  <div data-testid="mock-header">Mock Header</div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [
    {
      user: { name: "Test User", email: "test@example.com" },
      token: "mocked_token",
    },
    jest.fn(),
  ]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

describe("Admin Orders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the admin orders page successfully", async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Not Processed",
          buyer: { name: "CS 4218 Test Account" },
          createdAt: "2024-01-01T00:00:00Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "NUS T-shirt",
              description: "Plain NUS T-shirt for sale",
              price: 4.99,
            },
          ],
        },
      ],
    });

    render(
      <Router>
        <AdminOrders />
      </Router>,
    );
    expect(screen.getByText(/All Orders/i)).toBeInTheDocument();

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });

    await waitFor(async () => {
      expect(screen.getByText(/CS 4218 Test Account/i)).toBeInTheDocument();
    });

    await waitFor(async () => {
      expect(screen.getByText(/Not Processed/i)).toBeInTheDocument();
    });

    await waitFor(async () => {
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
    });

    await waitFor(async () => {
      expect(screen.getByText("NUS T-shirt")).toBeInTheDocument();
    });

    await waitFor(async () => {
      expect(
        screen.getByText(/Plain NUS T-shirt for sale/i),
      ).toBeInTheDocument();
    });

    await waitFor(async () => {
      expect(screen.getByText(/Price : 4.99/i)).toBeInTheDocument();
    });
  });

  it("should not display the orders if unable to retrieve orders", async () => {
    axios.get.mockRejectedValue({
      data: [
        {
          _id: "1",
          status: "Not Processed",
          buyer: { name: "James" },
          createdAt: "2024-01-01T00:00:00Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Laptop",
              description: "A powerful laptop",
              price: 1499.99,
            },
          ],
        },
      ],
    });

    render(
      <Router>
        <AdminOrders />
      </Router>,
    );

    expect(screen.getByText(/All Orders/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
    await waitFor(() => {
      expect(screen.queryByText(/James/i)).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByText(/Laptop/i)).not.toBeInTheDocument();
    });
  });

  it("should update the status of a product successfully", async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Not Processed",
          buyer: { name: "James" },
          createdAt: "2024-09-15T00:00:00Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Laptop",
              description: "A powerful laptop",
              price: 1499.99,
            },
          ],
        },
      ],
    });

    render(
      <Router>
        <AdminOrders />
      </Router>,
    );

    expect(screen.getByText(/All Orders/i)).toBeInTheDocument();
    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
    await waitFor(async () => {
      expect(screen.getByText(/James/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/Not Processed/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/A powerful laptop/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/price : 1499.99/i)).toBeInTheDocument();
    });

    const dropdown = screen.getByText(/Not Processed/i);
    fireEvent.mouseDown(dropdown);
    const optionToSelect = screen.getByText("Shipped");
    fireEvent.click(optionToSelect);
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/1", {
        status: "Shipped",
      });
    });
  });

  it("should console log message when order status has error updating", async () => {
    console.log = jest.fn();

    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Not Processed",
          buyer: { name: "James" },
          createdAt: "2024-09-15T00:00:00Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Laptop",
              description: "A powerful laptop",
              price: 1499.99,
            },
          ],
        },
      ],
    });

    axios.put.mockRejectedValue({
      data: { success: false },
    });
    render(
      <Router>
        <AdminOrders />
      </Router>,
    );

    expect(screen.getByText(/All Orders/i)).toBeInTheDocument();
    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
    await waitFor(async () => {
      expect(screen.getByText(/James/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/Not Processed/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/A powerful laptop/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/price : 1499.99/i)).toBeInTheDocument();
    });

    const dropdown = screen.getByText(/Not Processed/i);
    fireEvent.mouseDown(dropdown);
    const optionToSelect = screen.getByText("Shipped");
    fireEvent.click(optionToSelect);
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/1", {
        status: "Shipped",
      });
    });
  });

  it("handles orders with failed payment", async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "1",
          status: "Not Processed",
          buyer: { name: "James" },
          createdAt: "2024-09-15T00:00:00Z",
          payment: { success: false },
          products: [
            {
              _id: "p1",
              name: "Laptop",
              description: "A powerful laptop",
              price: 1499.99,
            },
          ],
        },
      ],
    });

    render(
      <Router>
        <AdminOrders />
      </Router>,
    );

    expect(screen.getByText(/All Orders/i)).toBeInTheDocument();
    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
    await waitFor(async () => {
      expect(screen.getByText(/James/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/Not Processed/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/A powerful laptop/i)).toBeInTheDocument();
    });
    await waitFor(async () => {
      expect(screen.getByText(/price : 1499.99/i)).toBeInTheDocument();
    });
  });

  it("should not fetch orders when auth token is not present", () => {
    require("../../context/auth").useAuth.mockReturnValueOnce([
      { user: null, token: null },
      jest.fn(),
    ]);

    render(
      <Router>
        <AdminOrders />
      </Router>,
    );

    expect(axios.get).not.toHaveBeenCalledWith("/api/v1/auth/all-orders");
  });
});
