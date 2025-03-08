import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from './HomePage';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/cart';
import toast from 'react-hot-toast';
import { Prices } from '../components/Prices';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));
jest.mock('../context/cart', () => ({
  useCart: jest.fn(),
}));
jest.mock('react-hot-toast', () => {
  return {
    __esModule: true,
    default: {
      success: jest.fn(),
      error: jest.fn(),
    }
  };
});
jest.mock('../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout">
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));
jest.mock('react-icons/ai', () => ({
  AiOutlineReload: () => <div data-testid="reload-icon" />,
}));

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('HomePage Component', () => {
  const mockProducts = [
    {
      _id: '1',
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'This is a test product description',
      price: 99.99,
    },
    {
      _id: '2',
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'This is another test product description',
      price: 149.99,
    },
  ];

  const mockCategories = [
    { _id: 'cat1', name: 'Category 1' },
    { _id: 'cat2', name: 'Category 2' },
  ];

  const mockNavigate = jest.fn();
  const mockCart = [];
  const mockSetCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useCart.mockReturnValue([mockCart, mockSetCart]);
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      } else if (url.includes('/api/v1/product/product-count')) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes('/api/v1/product/product-list')) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    axios.post.mockImplementation((url) => {
      if (url.includes('/api/v1/product/product-filters')) {
        return Promise.resolve({ data: { products: mockProducts.slice(0, 1) } });
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    localStorageMock.clear();
  });

  test('renders the homepage with correct title', async () => {
    await act(async () => {
      render(<HomePage />);
    });
    
    expect(screen.getByTestId('layout-title')).toHaveTextContent('ALL Products - Best offers');
  });

  test('fetches and displays products', async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    expect(screen.getByText('All Products')).toBeInTheDocument();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    
    // Check if prices are formatted correctly
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  test('fetches and displays categories', async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });

  test('navigates to product detail when "More Details" is clicked', async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    await act(async () => {
      fireEvent.click(screen.getAllByText('More Details')[0]);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/product/test-product-1');
  });

  test('adds product to cart when "ADD TO CART" is clicked', async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    await act(async () => {
      fireEvent.click(screen.getAllByText('ADD TO CART')[0]);
    });
    
    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProducts[0]]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', JSON.stringify([...mockCart, mockProducts[0]]));
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });

  test('loads more products when "Loadmore" button is clicked', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      } else if (url.includes('/api/v1/product/product-count')) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes('/api/v1/product/product-list/1')) {
        return Promise.resolve({ data: { products: mockProducts } });
      } else if (url.includes('/api/v1/product/product-list/2')) {
        return Promise.resolve({ 
          data: { 
            products: [
              {
                _id: '3',
                name: 'Test Product 3',
                slug: 'test-product-3',
                description: 'This is a third test product description',
                price: 199.99,
              }
            ] 
          } 
        });
      }
      return Promise.reject(new Error('Not mocked'));
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
    
    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2');
  });

  test('shows loading state when loading more products', async () => {
    let resolveLoadMore;
    const loadMorePromise = new Promise(resolve => {
      resolveLoadMore = () => {
        resolve({ 
          data: { 
            products: [
              {
                _id: '3',
                name: 'Test Product 3',
                slug: 'test-product-3',
                description: 'This is a third test product description',
                price: 199.99,
              }
            ] 
          } 
        });
      };
    });
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      } else if (url.includes('/api/v1/product/product-count')) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes('/api/v1/product/product-list/1')) {
        return Promise.resolve({ data: { products: mockProducts } });
      } else if (url.includes('/api/v1/product/product-list/2')) {
        return loadMorePromise;
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText(/Loadmore/i));
    });
    
    expect(screen.getByText('Loading ...')).toBeInTheDocument();
    
    await act(async () => {
      resolveLoadMore();
      await flushPromises();
    });
    
    expect(screen.queryByText('Loading ...')).not.toBeInTheDocument();
    expect(screen.getByText(/Loadmore/i)).toBeInTheDocument();
  });

  test('filters products by category when checkbox is clicked', async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    const categoryCheckboxes = screen.getAllByRole('checkbox');
    
    await act(async () => {
      fireEvent.click(categoryCheckboxes[0]);
      await flushPromises();
    });
    
    expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
      checked: ['cat1'],
      radio: [],
    });
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
  });

  test('filters products by price when radio button is clicked', async () => {
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    const priceRadios = screen.getAllByRole('radio');
    
    await act(async () => {
      fireEvent.click(priceRadios[0]);
      await flushPromises();
    });
    
    expect(axios.post).toHaveBeenCalled();
    expect(axios.post.mock.calls[0][0]).toBe('/api/v1/product/product-filters');
    expect(axios.post.mock.calls[0][1]).toHaveProperty('radio');
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
  });

  test('resets filters when reset button is clicked', async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };
    
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('RESET FILTERS'));
    });
    
    expect(window.location.reload).toHaveBeenCalled();
    
    window.location = originalLocation;
  });

  test('handles API error gracefully when fetching categories', async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.reject(new Error('API Error'));
      } else if (url.includes('/api/v1/product/product-count')) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes('/api/v1/product/product-list')) {
        return Promise.resolve({ data: { products: mockProducts } });
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    expect(console.log).toHaveBeenCalled();
    
    console.log = originalConsoleLog;
  });

  test('handles API error gracefully when fetching products', async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      } else if (url.includes('/api/v1/product/product-count')) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes('/api/v1/product/product-list')) {
        return Promise.reject(new Error('API Error'));
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    expect(console.log).toHaveBeenCalled();
    
    console.log = originalConsoleLog;
  });

  test('handles API error gracefully when filtering products', async () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    axios.post.mockImplementation((url) => {
      if (url.includes('/api/v1/product/product-filters')) {
        return Promise.reject(new Error('API Error'));
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    await act(async () => {
      render(<HomePage />);
      await flushPromises();
    });
    
    const categoryCheckboxes = screen.getAllByRole('checkbox');
    
    await act(async () => {
      fireEvent.click(categoryCheckboxes[0]);
      await flushPromises();
    });
    
    expect(console.log).toHaveBeenCalled();
    
    console.log = originalConsoleLog;
  });
});
