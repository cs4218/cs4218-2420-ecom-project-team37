import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "./cart.js";

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
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  test("updates cart state when an item is added", async () => {
    render(
      <CartProvider>
        <DummyComponent />
      </CartProvider>
    );
    const button = screen.getByRole("button", { name: /add item/i });
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
    
    await act(async () => {
      userEvent.click(button);
    });
    
    expect(screen.getByTestId("cart-length").textContent).toBe("1");
  });
});
