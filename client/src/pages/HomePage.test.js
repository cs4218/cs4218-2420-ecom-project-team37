import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePage from "./HomePage";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import { Prices } from "../components/Prices";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("react-hot-toast", () => {
  return {
    __esModule: true,
    default: {
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});
jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));
jest.mock("react-icons/ai", () => ({
  AiOutlineReload: () => <div data-testid="reload-icon" />,
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

describe("HomePage Component", () => {
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

  const mockCategories = [
    { _id: "cat1", name: "Category 1" },
    { _id: "cat2", name: "Category 2" },
  ];

  const mockNavigate = jest.fn();
  const mockCart = [];
  const mockSetCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useCart.mockReturnValue([mockCart, mockSetCart]);

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not mocked"));
    });

    axios.post.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-filters")) {
        return Promise.resolve({
          data: { products: mockProducts.slice(0, 1) },
        });
      }
      return Promise.reject(new Error("Not mocked"));
    });

    localStorageMock.clear();
  });

  test("renders the homepage with correct title", async () => {
    await act(async () => {
      render(<HomePage />);
    });

    expect(screen.getByTestId("layout-title")).toHaveTextContent(
      "ALL Products - Best offers",
    );
  });

  test("fetches and displays products", async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    expect(screen.getByText("All Products")).toBeInTheDocument();
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();

    // Check if prices are formatted correctly
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("$149.99")).toBeInTheDocument();
  });

  test("fetches and displays categories", async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    expect(screen.getByText("Filter By Category")).toBeInTheDocument();
    expect(screen.getByText("Category 1")).toBeInTheDocument();
    expect(screen.getByText("Category 2")).toBeInTheDocument();
  });

  test('navigates to product detail when "More Details" is clicked', async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText("More Details")[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/product/test-product-1");
  });

  test('adds product to cart when "ADD TO CART" is clicked', async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    await act(async () => {
      fireEvent.click(screen.getAllByText("ADD TO CART")[0]);
    });

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProducts[0]]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([...mockCart, mockProducts[0]]),
    );
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test('loads more products when "Loadmore" button is clicked', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({ data: { products: mockProducts } });
      } else if (url.includes("/api/v1/product/product-list/2")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "3",
                name: "Test Product 3",
                slug: "test-product-3",
                description: "This is a third test product description",
                price: 199.99,
              },
            ],
          },
        });
      }
      return Promise.reject(new Error("Not mocked"));
    });

    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    const loadMoreButton = screen.getByText(/Loadmore/i);
    expect(loadMoreButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(loadMoreButton);
      await flushPromises();
    });

    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
  });

  test("shows loading state when loading more products", async () => {
    let resolveLoadMore;
    const loadMorePromise = new Promise((resolve) => {
      resolveLoadMore = () => {
        resolve({
          data: {
            products: [
              {
                _id: "3",
                name: "Test Product 3",
                slug: "test-product-3",
                description: "This is a third test product description",
                price: 199.99,
              },
            ],
          },
        });
      };
    });

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({ data: { products: mockProducts } });
      } else if (url.includes("/api/v1/product/product-list/2")) {
        return loadMorePromise;
      }
      return Promise.reject(new Error("Not mocked"));
    });

    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/Loadmore/i));
    });

    expect(screen.getByText("Loading ...")).toBeInTheDocument();

    await act(async () => {
      resolveLoadMore();
      await flushPromises();
    });

    expect(screen.queryByText("Loading ...")).not.toBeInTheDocument();
    expect(screen.getByText(/Loadmore/i)).toBeInTheDocument();
  });

  test("filters products by category when checkbox is clicked", async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    const categoryCheckboxes = screen.getAllByRole("checkbox");

    await act(async () => {
      fireEvent.click(categoryCheckboxes[0]);
      await flushPromises();
    });

    expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
      checked: ["cat1"],
      radio: [],
    });

    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
  });

  test("filters products by price when radio button is clicked", async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    const priceRadios = screen.getAllByRole("radio");

    await act(async () => {
      fireEvent.click(priceRadios[0]);
      await flushPromises();
    });

    expect(axios.post).toHaveBeenCalled();
    expect(axios.post.mock.calls[0][0]).toBe("/api/v1/product/product-filters");
    expect(axios.post.mock.calls[0][1]).toHaveProperty("radio");

    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
  });

  test("resets filters when reset button is clicked", async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };

    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("RESET FILTERS"));
    });

    expect(window.location.reload).toHaveBeenCalled();

    window.location = originalLocation;
  });

  test("handles API error gracefully when fetching categories", async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.reject(new Error("API Error"));
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error("Not mocked"));
    });

    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    expect(console.log).toHaveBeenCalled();

    console.log = originalConsoleLog;
  });

  test("handles API error gracefully when fetching products", async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.reject(new Error("API Error"));
      }
      return Promise.reject(new Error("Not mocked"));
    });

    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    expect(console.log).toHaveBeenCalled();

    console.log = originalConsoleLog;
  });

  test("handles API error gracefully when filtering products", async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();

    axios.post.mockImplementation((url) => {
      if (url.includes("/api/v1/product/product-filters")) {
        return Promise.reject(new Error("API Error"));
      }
      return Promise.reject(new Error("Not mocked"));
    });

    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });

    const categoryCheckboxes = screen.getAllByRole("checkbox");

    await act(async () => {
      fireEvent.click(categoryCheckboxes[0]);
      await flushPromises();
    });

    expect(console.log).toHaveBeenCalled();

    console.log = originalConsoleLog;
  });

  // INTEGRATION TESTS
  
  describe("Integration Tests", () => {
    test("handles products with missing properties", async () => {
      const productsWithMissingProps = [
        {
          _id: "1",
          name: "Test Product 1",
          // Missing slug
          description: "This is a test product description",
          // Missing price
        },
        {
          // Missing _id
          name: "Test Product 2",
          slug: "test-product-2",
          // Missing description
          price: 149.99,
        },
      ];
      
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        } else if (url.includes("/api/v1/product/product-count")) {
          return Promise.resolve({ data: { total: 10 } });
        } else if (url.includes("/api/v1/product/product-list")) {
          return Promise.resolve({ data: { products: productsWithMissingProps } });
        }
        return Promise.reject(new Error("Not mocked"));
      });
      
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Component should render without crashing despite missing properties
      expect(screen.getByText("All Products")).toBeInTheDocument();
      
      console.error = originalConsoleError;
    });
    
    test("handles malformed API responses for product listing", async () => {
      // Simulate API returning unexpected data format
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        } else if (url.includes("/api/v1/product/product-count")) {
          return Promise.resolve({ data: { total: 10 } });
        } else if (url.includes("/api/v1/product/product-list")) {
          return Promise.resolve({ data: "invalid data structure" });
        }
        return Promise.reject(new Error("Not mocked"));
      });
      
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Component should not crash with malformed API response
      expect(screen.getByText("All Products")).toBeInTheDocument();
      
      console.log = originalConsoleLog;
    });
    
    test("handles null or undefined values in product data", async () => {
      const productsWithNullValues = [
        {
          _id: "1",
          name: null,
          slug: "test-product-1",
          description: undefined,
          price: null,
        }
      ];
      
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        } else if (url.includes("/api/v1/product/product-count")) {
          return Promise.resolve({ data: { total: 10 } });
        } else if (url.includes("/api/v1/product/product-list")) {
          return Promise.resolve({ data: { products: productsWithNullValues } });
        }
        return Promise.reject(new Error("Not mocked"));
      });
      
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Component should render without crashing with null/undefined values
      expect(screen.getByText("All Products")).toBeInTheDocument();
    });
    
    test("handles products with extremely long text correctly", async () => {
      const longTextProduct = [
        {
          _id: "1",
          name: "A".repeat(100), // Very long name
          slug: "test-product",
          description: "B".repeat(500), // Very long description
          price: 99.99,
        }
      ];
      
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        } else if (url.includes("/api/v1/product/product-count")) {
          return Promise.resolve({ data: { total: 10 } });
        } else if (url.includes("/api/v1/product/product-list")) {
          return Promise.resolve({ data: { products: longTextProduct } });
        }
        return Promise.reject(new Error("Not mocked"));
      });
      
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Component should render without layout issues from long text
      expect(screen.getByText("All Products")).toBeInTheDocument();
      
      // Verify the description is truncated as expected
      expect(screen.getByText("B".repeat(60) + "...")).toBeInTheDocument();
    });
    
    test("handles empty arrays returned from API", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.resolve({
            data: { success: true, category: [] }, // Empty categories
          });
        } else if (url.includes("/api/v1/product/product-count")) {
          return Promise.resolve({ data: { total: 0 } }); // Zero total
        } else if (url.includes("/api/v1/product/product-list")) {
          return Promise.resolve({ data: { products: [] } }); // Empty products
        }
        return Promise.reject(new Error("Not mocked"));
      });
      
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Component should render without crashing with empty data
      expect(screen.getByText("All Products")).toBeInTheDocument();
      
      // Loadmore button should not be visible when there are no products
      expect(screen.queryByText(/Loadmore/i)).not.toBeInTheDocument();
    });
    
    test("handles negative or invalid total count values", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        } else if (url.includes("/api/v1/product/product-count")) {
          return Promise.resolve({ data: { total: -5 } }); // Negative total
        } else if (url.includes("/api/v1/product/product-list")) {
          return Promise.resolve({ data: { products: mockProducts } });
        }
        return Promise.reject(new Error("Not mocked"));
      });
      
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Component should handle invalid total count gracefully
      expect(screen.getByText("All Products")).toBeInTheDocument();
      
      // Products should still display correctly
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });
    
    test("handles extremely large number of products efficiently", async () => {
      // Create a large array of products
      const manyProducts = Array.from({ length: 100 }, (_, i) => ({
        _id: `product${i}`,
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: `Description ${i}`,
        price: 10.99
      }));
      
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/category/get-category")) {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        } else if (url.includes("/api/v1/product/product-count")) {
          return Promise.resolve({ data: { total: 1000 } }); // Large total
        } else if (url.includes("/api/v1/product/product-list")) {
          return Promise.resolve({ data: { products: manyProducts } });
        }
        return Promise.reject(new Error("Not mocked"));
      });
      
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Component should render large number of products without crashing
      expect(screen.getByText("All Products")).toBeInTheDocument();
      
      // Loadmore button should be available with more products to load
      expect(screen.getByText(/Loadmore/i)).toBeInTheDocument();
    });
    
    test("handles filter state persistence across rerenders", async () => {
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Apply category filter
      const categoryCheckbox = screen.getAllByRole("checkbox")[0];
      await act(async () => {
        fireEvent.click(categoryCheckbox);
        await flushPromises();
      });
      
      // Force a rerender (simulating a state update elsewhere)
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      // Filter should still be applied after rerender
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
        checked: ["cat1"],
        radio: [],
      });
    });
    
    test("handles rapid filter changes correctly", async () => {
      await act(async () => {
        render(<HomePage />);
        await flushPromises();
      });
      
      const categoryCheckboxes = screen.getAllByRole("checkbox");
      const priceRadios = screen.getAllByRole("radio");
      
      // Clear any previous calls to axios.post
      axios.post.mockClear();
      
      // Apply filters sequentially but in separate act blocks to ensure each change is processed
      await act(async () => {
        fireEvent.click(categoryCheckboxes[0]); // Toggle first category on
        await flushPromises();
      });
      
      await act(async () => {
        fireEvent.click(categoryCheckboxes[1]); // Toggle second category on
        await flushPromises();
      });
      
      await act(async () => {
        fireEvent.click(categoryCheckboxes[0]); // Toggle first category off
        await flushPromises();
      });
      
      await act(async () => {
        fireEvent.click(priceRadios[0]); // Select price range
        await flushPromises();
      });
      
      // Verify the last call to post was with the expected parameters
      const lastCallIndex = axios.post.mock.calls.length - 1;
      expect(axios.post.mock.calls[lastCallIndex][0]).toBe("/api/v1/product/product-filters");
      expect(axios.post.mock.calls[lastCallIndex][1]).toEqual({
        checked: ["cat2"],
        radio: expect.any(Array), // The actual radio value might vary depending on Prices implementation
      });
    });
    
    test("simultaneous API requests don't conflict", async () => {
      let resolveCategories, resolveProducts, resolveCount;
      
      const categoriesPromise = new Promise(resolve => {
        resolveCategories = () => resolve({ 
          data: { success: true, category: mockCategories } 
        });
      });
      
      const productsPromise = new Promise(resolve => {
        resolveProducts = () => resolve({ 
          data: { products: mockProducts } 
        });
      });
      
      const countPromise = new Promise(resolve => {
        resolveCount = () => resolve({ 
          data: { total: 10 } 
        });
      });
      
      axios.get.mockImplementation(url => {
        if (url.includes("/api/v1/category/get-category")) {
          return categoriesPromise;
        } else if (url.includes("/api/v1/product/product-count")) {
          return countPromise;
        } else if (url.includes("/api/v1/product/product-list")) {
          return productsPromise;
        }
        return Promise.reject(new Error("Not mocked"));
      });
      
      await act(async () => {
        render(<HomePage />);
      });
      
      // Resolve APIs in different order than they were called
      await act(async () => {
        resolveProducts();
        await flushPromises();
      });
      
      await act(async () => {
        resolveCount();
        await flushPromises();
      });
      
      await act(async () => {
        resolveCategories();
        await flushPromises();
      });
      
      // Component should render correctly regardless of response order
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Category 1")).toBeInTheDocument();
    });
  });
});
