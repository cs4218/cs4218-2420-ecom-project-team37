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
  error: jest.fn()
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
    expect(toast.error).toHaveBeenCalled();
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

  // INTEGRATION TESTS
  
  describe("Integration Tests", () => {
    test("handles cart with malformed product data", async () => {
      const cartWithMalformedData = [
        {
          _id: "1",
          name: "Test Product 1",
          description: "Test description",
          // Missing price
        },
        {
          // Missing _id
          name: "Test Product 2",
          price: "not-a-number",
        },
        {
          _id: "3",
          // Missing name
          description: null,
          price: 199.99,
        }
      ];
      
      useCart.mockReturnValue([cartWithMalformedData, mockSetCart]);
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Component should render without crashing
      expect(screen.getByText(`You have ${cartWithMalformedData.length} items in your cart`)).toBeInTheDocument();
      
      // Total price should handle missing or non-numeric prices
      expect(screen.getByText("Total : $199.99")).toBeInTheDocument();  // Only the valid price should be counted
    });
    
    test("handles non-array cart data in localStorage", async () => {
      // Simulate corrupt localStorage data
      localStorageMock.getItem.mockImplementation(() => "not-an-array");
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Component should not crash
      expect(screen.getByText(/Hello/)).toBeInTheDocument();
    });
    
    test("handles cart items with missing properties", async () => {
      const cartWithInvalidItems = [undefined, null, {}, { _id: "1" }];
      useCart.mockReturnValue([cartWithInvalidItems, mockSetCart]);
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Should properly display the count of items even if they're invalid
      expect(screen.getByText(`You have ${cartWithInvalidItems.length} items in your cart`)).toBeInTheDocument();
    });
    
    test("handles changes in auth state after initial render", async () => {
      // Start with authenticated user
      useAuth.mockReturnValue([mockAuth, mockSetAuth]);
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      expect(screen.getByText(`Hello ${mockUser.name}`)).toBeInTheDocument();
      
      // Simulate logout during session
      await act(async () => {
        useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);
        render(<CartPage />);
        await flushPromises();
      });
      
      // UI should update accordingly
      expect(screen.getByText("Hello Guest")).toBeInTheDocument();
      expect(screen.getByText("Please Login to checkout")).toBeInTheDocument();
    });
    
    test("handles API responses with missing clientToken", async () => {
      // API responds with data but missing clientToken
      axios.get.mockResolvedValue({
        data: { /* missing clientToken */ }
      });
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Payment form should not be displayed
      expect(screen.queryByTestId("braintree-dropin")).not.toBeInTheDocument();
    });
    
    test("handles completely malformed API responses for token", async () => {
      // API responds with incorrect data structure
      axios.get.mockResolvedValue("not-an-object");
      
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Component should not crash
      expect(screen.getByText(`Hello ${mockUser.name}`)).toBeInTheDocument();
      
      console.log = originalConsoleLog;
    });
    
    test("handles payment processing with empty cart", async () => {
      // Mock a situation where cart becomes empty but payment button is still clicked
      useCart.mockReturnValue([[], mockSetCart]);
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Payment form and button should not be displayed with empty cart
      expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
    });
    
    test("handles user with missing address during payment", async () => {
      // User authenticated but missing address
      useAuth.mockReturnValue([
        { 
          user: { 
            name: "Test User",
            email: "test@example.com",
            // Missing address
          }, 
          token: "test-token" 
        }, 
        mockSetAuth
      ]);
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Payment button should be disabled when address is missing
      const paymentButton = screen.getByText("Make Payment");
      expect(paymentButton).toBeDisabled();
    });
    
    test("handles partial payment failures correctly", async () => {
      // Mock API response indicating partial failure
      axios.post.mockResolvedValue({
        data: { 
          success: false,
          message: "Some items could not be processed"
        }
      });
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      const paymentButton = screen.getByText("Make Payment");
      
      await act(async () => {
        fireEvent.click(paymentButton);
        await flushPromises();
      });
      
      // Check error toast was called
      expect(toast.error).toHaveBeenCalled();
      
      // Cart should not be cleared on partial failure
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith("cart");
      expect(mockSetCart).not.toHaveBeenCalledWith([]);
    });
    
    test("handles payment with network disconnect during processing", async () => {
      // Simulate network disconnect during payment processing
      let rejectPayment;
      const paymentPromise = new Promise((resolve, reject) => {
        rejectPayment = () => {
          reject(new Error("Network Error"));
        };
      });
      
      axios.post.mockImplementation(() => paymentPromise);
      
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      const paymentButton = screen.getByText("Make Payment");
      
      await act(async () => {
        fireEvent.click(paymentButton);
        // This simulates the button being clicked and loading state being set
      });
      
      // Should show loading state
      expect(screen.getByText("Processing ....")).toBeInTheDocument();
      
      await act(async () => {
        rejectPayment();
        await flushPromises();
      });
      
      // Check toast.error was called
      expect(toast.error).toHaveBeenCalled();
      
      // After error, should no longer be in loading state
      expect(screen.queryByText("Processing ....")).not.toBeInTheDocument();
      expect(screen.getByText("Make Payment")).toBeInTheDocument();
      
      console.log = originalConsoleLog;
    });
    
    test("handles products with extremely long text correctly", async () => {
      const longTextProduct = {
        _id: "long-text",
        name: "A".repeat(100), // Very long name
        description: "B".repeat(500), // Very long description
        price: 9.99
      };
      
      useCart.mockReturnValue([[longTextProduct], mockSetCart]);
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Component should render without text overflow issues
      // Use a more flexible text matching approach
      expect(screen.getByText(/You have 1 items in your cart/)).toBeInTheDocument();
    });
    
    test("handles extremely large cart quantities", async () => {
      // Create a cart with a large number of items (to test performance handling)
      const largeCart = Array(100).fill().map((_, i) => ({
        _id: `id-${i}`,
        name: `Product ${i}`,
        description: `Description ${i}`,
        price: 10.99
      }));
      
      useCart.mockReturnValue([largeCart, mockSetCart]);
      
      await act(async () => {
        render(<CartPage />);
        await flushPromises();
      });
      
      // Component should handle large quantities properly
      expect(screen.getByText(`You have ${largeCart.length} items in your cart`)).toBeInTheDocument();
      
      // Total should be calculated correctly for large number of items
      expect(screen.getByText(`Total : $1,099.00`)).toBeInTheDocument();
    });
  });
});
