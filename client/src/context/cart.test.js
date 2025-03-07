import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "./cart.js";

// A dummy component that uses the custom hook
const DummyComponent = () => {
  const [cart, setCart] = useCart();
  return (
    <div>
      <span data-testid="cart-length">{cart.length}</span>
      <button onClick={() => setCart([...cart, "item"])}>Add Item</button>
    </div>
  );
};

describe("CartProvider and useCart", () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure isolation
    localStorage.clear();
  });

  test("renders children", () => {
    render(
      <CartProvider>
        <div data-testid="child">Child Component</div>
      </CartProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  test("initializes cart from localStorage if present", () => {
    const storedCart = ["item1", "item2"];
    localStorage.setItem("cart", JSON.stringify(storedCart));

    render(
      <CartProvider>
        <DummyComponent />
      </CartProvider>
    );

    // The effect should load the cart from localStorage
    expect(screen.getByTestId("cart-length").textContent).toBe(
      storedCart.length.toString()
    );
  });

  test("initializes with empty cart if no localStorage data", () => {
    render(
      <CartProvider>
        <DummyComponent />
      </CartProvider>
    );
    // Since localStorage is empty, cart should be an empty array
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  test("updates cart state when an item is added", async () => {
    render(
      <CartProvider>
        <DummyComponent />
      </CartProvider>
    );
    const button = screen.getByRole("button", { name: /add item/i });
    // Initially, the cart is empty
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
    
    // Wrap the click event in act
    await act(async () => {
      userEvent.click(button);
    });
    
    // The cart length should update to 1
    expect(screen.getByTestId("cart-length").textContent).toBe("1");
  });
});
