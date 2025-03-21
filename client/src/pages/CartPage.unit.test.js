import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import CartPage from "./CartPage";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";

// Mock dependencies
jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  return function DropIn(props) {
    React.useEffect(() => {
      props.onInstance({
        requestPaymentMethod: async () => ({ nonce: "test-nonce" }),
      });
    }, []);
    return <div data-testid="braintree-dropin" />;
  };
});
jest.mock("react-icons/ai", () => ({
  AiFillWarning: () => <div data-testid="warning-icon" />,
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("CartPage Component", () => {
  const mockCart = [
    {
      _id: "1",
      name: "Test Product 1",
      description: "This is a test product description",
      price: 99.99,
    },
    {
      _id: "2",
      name: "Test Product 2",
      description: "This is another test product description",
      price: 149.99,
    },
  ];

  const mockUser = {
    name: "Test User",
    email: "test@example.com",
    address: "123 Test Street",
  };

  const mockAuth = {
    user: mockUser,
    token: "test-token",
  };

  const mockNavigate = jest.fn();
  const mockSetCart = jest.fn();
  const mockSetAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useCart.mockReturnValue([mockCart, mockSetCart]);
    useAuth.mockReturnValue([mockAuth, mockSetAuth]);

    axios.get.mockResolvedValue({
      data: { clientToken: "test-client-token" },
    });

    axios.post.mockResolvedValue({
      data: { success: true },
    });

    localStorageMock.clear();
    localStorageMock.setItem("cart", JSON.stringify(mockCart));
  });

  test("renders cart page with correct title and user greeting", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.getByText(`Hello ${mockUser.name}`)).toBeInTheDocument();
    expect(
      screen.getByText(`You have ${mockCart.length} items in your cart`),
    ).toBeInTheDocument();
  });

  test("renders cart page with guest greeting when user is not logged in", async () => {
    useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);

    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.getByText("Hello Guest")).toBeInTheDocument();
    expect(
      screen.getByText(
        `You have ${mockCart.length} items in your cart please login to checkout!`,
      ),
    ).toBeInTheDocument();
  });

  test("displays empty cart message when cart is empty", async () => {
    useCart.mockReturnValue([[], mockSetCart]);

    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  test("displays cart items correctly", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    expect(screen.getByText("Price : 99.99")).toBeInTheDocument();
    expect(screen.getByText("Price : 149.99")).toBeInTheDocument();
  });

  test("calculates and displays total price correctly", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.getByText("Total : $249.98")).toBeInTheDocument();
  });

  test("removes item from cart when Remove button is clicked", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    const removeButtons = screen.getAllByText("Remove");

    await act(async () => {
      fireEvent.click(removeButtons[0]);
      await flushPromises();
    });

    expect(mockSetCart).toHaveBeenCalledWith([mockCart[1]]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([mockCart[1]]),
    );
  });

  test("displays user address when available", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.getByText("Current Address")).toBeInTheDocument();
    expect(screen.getByText(mockUser.address)).toBeInTheDocument();
  });

  test("shows update address button when user is logged in", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    const updateAddressButton = screen.getByText("Update Address");
    expect(updateAddressButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(updateAddressButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  test("shows login button when user is not logged in", async () => {
    useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);

    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    const loginButton = screen.getByText("Please Login to checkout");
    expect(loginButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(loginButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
  });

  test("fetches client token on component mount", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
  });

  test("displays payment form when client token is available and user is logged in", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
    expect(screen.getByText("Make Payment")).toBeInTheDocument();
  });

  test("does not display payment form when client token is not available", async () => {
    axios.get.mockResolvedValue({
      data: { clientToken: null },
    });

    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.queryByTestId("braintree-dropin")).not.toBeInTheDocument();
    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
  });

  test("does not display payment form when user is not logged in", async () => {
    useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);

    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(screen.queryByTestId("braintree-dropin")).not.toBeInTheDocument();
    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
  });

  test("processes payment when Make Payment button is clicked", async () => {
    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    const paymentButton = screen.getByText("Make Payment");

    await act(async () => {
      fireEvent.click(paymentButton);
      await flushPromises();
    });

    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/product/braintree/payment",
      {
        nonce: "test-nonce",
        cart: mockCart,
      },
    );

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("cart");
    expect(mockSetCart).toHaveBeenCalledWith([]);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
    expect(toast.success).toHaveBeenCalledWith(
      "Payment Completed Successfully ",
    );
  });

  test("shows loading state during payment processing", async () => {
    let resolvePayment;
    const paymentPromise = new Promise((resolve) => {
      resolvePayment = () => {
        resolve({ data: { success: true } });
      };
    });

    axios.post.mockImplementation(() => paymentPromise);

    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    const paymentButton = screen.getByText("Make Payment");

    await act(async () => {
      fireEvent.click(paymentButton);
    });

    expect(screen.getByText("Processing ....")).toBeInTheDocument();

    await act(async () => {
      resolvePayment();
      await flushPromises();
    });

    expect(screen.queryByText("Processing ....")).not.toBeInTheDocument();
  });

  test("handles payment API error gracefully", async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    axios.post.mockRejectedValue(new Error("Payment API Error"));

    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    const paymentButton = screen.getByText("Make Payment");

    await act(async () => {
      fireEvent.click(paymentButton);
      await flushPromises();
    });

    expect(console.log).toHaveBeenCalled();
    expect(mockSetCart).not.toHaveBeenCalledWith([]);
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith("cart");

    console.log = originalConsoleLog;
  });

  test("handles token API error gracefully", async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    axios.get.mockRejectedValue(new Error("Token API Error"));

    await act(async () => {
      render(<CartPage />);
      await flushPromises();
    });

    expect(console.log).toHaveBeenCalled();
    expect(screen.queryByTestId("braintree-dropin")).not.toBeInTheDocument();

    console.log = originalConsoleLog;
  });
});