import { render, screen, waitFor } from "@testing-library/react";
import Orders from "./Orders";
import { useAuth } from "../../context/auth";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");
jest.spyOn(console, "log").mockImplementation(() => {});

// Mock hooks because Orders are wrapped in Header
jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [[]]),
}));
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));


const mockOrders = [
  {
    _id: "123",
    status: "Pending",
    buyer: { name: "John Doe" },
    createAt: "2020-01-25T12:00:00Z",
    payment: { success: true },
    products: [
      {
        _id: "100",
        name: "Book",
        description: "Description of book",
        price: 50,
      },
    ],
  },
];

describe("Orders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ token: "mock-token" }, jest.fn()]);
  });

  it("triggers API call on mount", async () => {
    axios.get.mockResolvedValue({ data: mockOrders });

    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });
  });

  it("renders orders correctly", async () => {
    axios.get.mockResolvedValue({ data: mockOrders });

    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    expect(screen.getByText("All Orders")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Book")).toBeInTheDocument();
      expect(screen.getByText("Price : 50")).toBeInTheDocument();
    });
  });

  it("should handle empty orders", async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  it("should handle missing fields in order data", async () => {
    const incompleteOrders = [
      {
        _id: "789",
        status: "Shipped",
        createAt: "2020-01-24T12:00:00Z",
        payment: {},
        products: [],
      },
    ];

    axios.get.mockResolvedValue({ data: incompleteOrders });

    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Shipped")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
      expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    });
  });

  it("should handle API Errors upon fetching orders", async () => {
    axios.get.mockRejectedValue(new Error("API Error"));

    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  it("renders product images correctly", async () => {
    axios.get.mockResolvedValue({ data: mockOrders });

    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    await waitFor(() => {
      const imgElement = screen.getByAltText("Book");
      expect(imgElement).toBeInTheDocument();
      expect(imgElement).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/100"
      );
    });
  });
});
