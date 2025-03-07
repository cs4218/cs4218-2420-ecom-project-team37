import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { useSearch } from "../context/search";
import axios from "axios";
import { BrowserRouter, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[]]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("axios");
jest.spyOn(console, "log").mockImplementation(() => { });

const mockCart = [
  {
    _id: "1",
    name: "Test Product",
    description: "Test Description",
    price: 100,
  },
];

const mockUser = {
  name: "Daniel",
  email: "Daniel@gmail.com",
  phone: "12345678",
  address: "123 Test St",
};

const mockNavigate = jest.fn();

// Mock DropIn component
jest.mock("braintree-web-drop-in-react", () => {
  return function MockDropIn(props) {
    return (
      <div data-testid="braintree-dropin">
        <button onClick={() => props.onInstance({ requestPaymentMethod: () => ({ nonce: "test-nonce" }) })}>
          Set Instance
        </button>
      </div>
    );
  };
});

const mockInstance = {
  requestPaymentMethod: () => Promise.resolve({ nonce: "test-nonce" })
};

describe("CartPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ user: mockUser, token: "test-token" }, jest.fn()]);
    useCart.mockReturnValue([mockCart, jest.fn()]);
    localStorage.setItem("cart", JSON.stringify(mockCart));
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders cart page correctly for logged in user", () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    expect(screen.getByText(`Hello ${mockUser.name}`)).toBeInTheDocument();
    expect(
      screen.getByText(`You Have ${mockCart.length} items in your cart`)
    ).toBeInTheDocument();
  });

  it("renders cart page correctly for guest user", () => {
    useAuth.mockReturnValue([{}, jest.fn()]);

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Hello Guest")).toBeInTheDocument();
  });

  it("displays cart items correctly", () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    expect(screen.getByText(mockCart[0].name)).toBeInTheDocument();
    expect(screen.getByText(`Price : ${mockCart[0].price}`)).toBeInTheDocument();
    expect(
      screen.getByText(mockCart[0].description.substring(0, 30))
    ).toBeInTheDocument();
  });

  it("removes item from cart when remove button is clicked", () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([mockCart, setCart]);

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    expect(setCart).toHaveBeenCalled();
  });

  it("shows address update button when user is not logged in", () => {
    useAuth.mockReturnValue([{}, jest.fn()]);

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Plase Login to checkout")).toBeInTheDocument();
  });

  it("shows payment interface when all conditions are met", async () => {
    jest.clearAllMocks();
    const mockSetAuth = jest.fn();
    useAuth.mockReturnValue([{ user: mockUser, token: null }, mockSetAuth]);
    
    axios.get.mockResolvedValue({ data: { clientToken: "test-token" } });
    useCart.mockReturnValue([mockCart, jest.fn()]);

    const { rerender } = render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check specifically for braintree token calls
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Change auth token
    useAuth.mockReturnValue([{ user: mockUser, token: "new-token" }, mockSetAuth]);
    rerender(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check that braintree endpoint was called again
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
      const braintreeCalls = axios.get.mock.calls.filter(
        call => call[0] === "/api/v1/product/braintree/token"
      );
      expect(braintreeCalls.length).toBe(2); 
    });

    // Set up the mock instance
    const dropInButton = screen.getByText("Set Instance");
    fireEvent.click(dropInButton);

    // Verify payment interface
    await waitFor(() => {
      const paymentButton = screen.getByText("Make Payment");
      expect(paymentButton).toBeInTheDocument();
      expect(paymentButton).not.toBeDisabled();
    });
  });

  it("handles successful payment", async () => {
    jest.clearAllMocks();
    const mockSetCart = jest.fn();
    const mockSetAuth = jest.fn();
    
    // Mock auth and cart contexts with required user address
    useAuth.mockReturnValue([{ 
      user: { ...mockUser, address: "123 Test St" }, 
      token: "test-token" 
    }, mockSetAuth]);
    useCart.mockReturnValue([mockCart, mockSetCart]);
    
    // Mock axios responses
    axios.get.mockResolvedValue({ data: { clientToken: "test-token" } });
    axios.post.mockResolvedValue({ data: { success: true } });

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Wait for the client token to be fetched and DropIn to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
    });

    // Find and click the payment button
    const paymentButton = screen.getByText("Make Payment");
    fireEvent.click(paymentButton);

    // Verify the payment flow
    await waitFor(() => {
      // Check if axios.post was called with correct parameters
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/braintree/payment", {
        nonce: "test-nonce",
        cart: mockCart
      });
      
      // Verify cart was cleared
      expect(mockSetCart).toHaveBeenCalledWith([]);
      expect(localStorage.removeItem).toHaveBeenCalledWith("cart");
      
      // Verify navigation and toast
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      expect(toast.success).toHaveBeenCalledWith("Payment Completed Successfully ");
    });
  });

  it("calculates total price correctly", () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Total : $100.00")).toBeInTheDocument();
  });
});
