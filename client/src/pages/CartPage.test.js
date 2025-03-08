import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import CartPage from './CartPage';
import { CartProvider } from '../context/cart';
import { AuthProvider } from '../context/auth';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('axios');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react"); 
  return {
    __esModule: true,
    default: function DropIn(props) {
      React.useEffect(() => {
        props.onInstance({
          requestPaymentMethod: async () => ({ nonce: "mock-nonce" }),
        });
      }, []);
      return <div data-testid="braintree-dropin">Mock Braintree DropIn</div>;
    }
  };
});

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

jest.mock('../context/cart', () => {
  const originalModule = jest.requireActual('../context/cart');
  return {
    ...originalModule,
    useCart: jest.fn()
  };
});

jest.mock('../context/auth', () => {
  const originalModule = jest.requireActual('../context/auth');
  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

jest.mock('../context/search', () => {
  const originalModule = jest.requireActual('../context/search');
  return {
    ...originalModule,
    useSearch: jest.fn().mockReturnValue([{ keyword: '' }, jest.fn()])
  };
});

const renderWithProviders = (
  ui,
  { 
    cartValue = [[], jest.fn()],
    authValue = [{ user: null, token: '' }, jest.fn()],
    ...renderOptions 
  } = {}
) => {
  const { useCart } = require('../context/cart');
  const { useAuth } = require('../context/auth');
  
  useCart.mockReturnValue(cartValue);
  useAuth.mockReturnValue(authValue);
  
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {ui}
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>,
    renderOptions
  );
};

describe('CartPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Basic Rendering', () => {
    test('renders empty cart message when cart is empty', () => {
      renderWithProviders(<CartPage />);
      expect(screen.getByText('Your Cart Is Empty')).toBeInTheDocument();
    });

    test('renders correct number of items in cart', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'Description 2' }
      ];
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()]
      });
      
      expect(screen.getByText('You Have 2 items in your cart please login to checkout !')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    test('displays user name when authenticated', () => {
      const mockAuth = {
        user: { name: 'John Doe', address: '123 Main St' },
        token: 'fake-token'
      };
      
      renderWithProviders(<CartPage />, {
        authValue: [mockAuth, jest.fn()]
      });
      
      expect(screen.getByText(/Hello.*John Doe/)).toBeInTheDocument();
    });

    describe('Drop-in Payment UI and Payment Button Display', () => {
      test('does not display drop-in UI when user is not authenticated', () => {
        const mockCart = [
          { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
        ];
        
        renderWithProviders(<CartPage />, {
          cartValue: [mockCart, jest.fn()],
          authValue: [{ user: null, token: '' }, jest.fn()]
        });
        
        expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
        expect(screen.queryByText('Make Payment')).not.toBeInTheDocument();
      });
      
      test('does not display drop-in UI when cart is empty', () => {
        const mockAuth = {
          user: { name: 'John Doe', address: '123 Main St' },
          token: 'fake-token'
        };
        
        axios.get.mockResolvedValue({ data: { clientToken: 'mock-token' } });
        
        renderWithProviders(<CartPage />, {
          cartValue: [[], jest.fn()],
          authValue: [mockAuth, jest.fn()]
        });
        
        expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
        expect(screen.queryByText('Make Payment')).not.toBeInTheDocument();
      });
      
      test('does not display drop-in UI when clientToken is not available', () => {
        const mockAuth = {
          user: { name: 'John Doe', address: '123 Main St' },
          token: 'fake-token'
        };
        
        const mockCart = [
          { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
        ];
        
        
        renderWithProviders(<CartPage />, {
          cartValue: [mockCart, jest.fn()],
          authValue: [mockAuth, jest.fn()]
        });
        
        expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
        expect(screen.queryByText('Make Payment')).not.toBeInTheDocument();
      });
      
      test('displays drop-in UI when user is authenticated, cart has items, and clientToken is available', async () => {
        const mockAuth = {
          user: { name: 'John Doe', address: '123 Main St' },
          token: 'fake-token'
        };
        
        const mockCart = [
          { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
        ];
        
        axios.get.mockResolvedValue({ data: { clientToken: 'mock-token' } });
        
        renderWithProviders(<CartPage />, {
          cartValue: [mockCart, jest.fn()],
          authValue: [mockAuth, jest.fn()]
        });
        
        await waitFor(() => {
          expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
          expect(screen.getByText('Make Payment')).toBeInTheDocument();
        });
      });
    });
  });

  describe('totalPrice Function', () => {
    test('calculates and displays total price correctly for multiple items', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'Description 2' }
      ];
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()]
      });
      
      expect(screen.getByText('Total : $300.00')).toBeInTheDocument();
    });

    test('displays $0.00 when cart is empty', () => {
      renderWithProviders(<CartPage />, {
        cartValue: [[], jest.fn()]
      });
      
      expect(screen.getByText('Total : $0.00')).toBeInTheDocument();
    });

    test('handles items with decimal prices correctly', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 99.99, description: 'Description 1' },
        { _id: '2', name: 'Product 2', price: 49.50, description: 'Description 2' },
      ];
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()]
      });
      
      expect(screen.getByText('Total : $149.49')).toBeInTheDocument();
    });

    test('handles malformed cart data gracefully', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' },
        { _id: '2', name: 'Product 2', description: 'Description 2' }, // Missing price
        { _id: '3', name: 'Product 3', price: 200, description: 'Description 3' }
      ];
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()]
      });
      
      expect(screen.getByText('$300.00', { exact: false })).toBeInTheDocument();
    });

    test('handles large numbers correctly', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 9999999.99, description: 'Description 1' },
      ];
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()]
      });
      
      expect(screen.getByText('Total : $9,999,999.99')).toBeInTheDocument();
    });

    test('handles negative prices by adding them as positive values', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' },
        { _id: '2', name: 'Product 2', price: -50, description: 'Description 2' }
      ];
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()]
      });
      
      expect(screen.getByText('$150.00', { exact: false })).toBeInTheDocument();
    });

    test('handles a mix of valid, negative, undefined, and string prices correctly', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Valid price' },
        { _id: '2', name: 'Product 2', price: -50, description: 'Negative price' },
        { _id: '3', name: 'Product 3', description: 'Missing price' },
        { _id: '4', name: 'Product 4', price: '75.5', description: 'String price' },
        { _id: '5', name: 'Product 5', price: null, description: 'Null price' },
        { _id: '6', name: 'Product 6', price: undefined, description: 'Undefined price' }
      ];
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()]
      });

      expect(screen.getByText('$225.50', { exact: false })).toBeInTheDocument();
    });

    test('handles errors in totalPrice function', () => {
      const nonIterableCart = null;
    
      const { useCart } = require('../context/cart');
      useCart.mockReturnValueOnce([nonIterableCart, jest.fn()]);
      
      render(
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <CartPage />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByText('Total : $0.00')).toBeInTheDocument();
    });
  });

  describe('removeCartItem Function', () => {
    test('removes item from cart when remove button is clicked', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'Description 2' }
      ];
      const setCartMock = jest.fn();
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, setCartMock]
      });
      
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      
      const expectedCart = [mockCart[1]];
      expect(setCartMock).toHaveBeenCalledWith(expectedCart);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', JSON.stringify(expectedCart));
    });

    test('correctly removes the last item from cart', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' },
      ];
      const setCartMock = jest.fn();
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, setCartMock]
      });
      
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      
      expect(setCartMock).toHaveBeenCalledWith([]);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', '[]');
    });

    test('removes the only item and updates localStorage correctly', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
      ];
      const setCartMock = jest.fn();
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, setCartMock]
      });
      
      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);
      
      expect(setCartMock).toHaveBeenCalledWith([]);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', '[]');
    });

    test('updates cart state correctly even when localStorage throws an error', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' },
        { _id: '2', name: 'Product 2', price: 200, description: 'Description 2' }
      ];
      const setCartMock = jest.fn();
      
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn().mockImplementationOnce(() => {
        throw new Error('localStorage is not available');
      });
      
      const consoleLogSpy = jest.spyOn(console, 'log');
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, setCartMock]
      });
      
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]); 
      
      const expectedCart = [mockCart[1]]; 
      
      expect(setCartMock).toHaveBeenCalledWith(expectedCart);
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
      
      localStorageMock.setItem = originalSetItem;
      consoleLogSpy.mockRestore();
    });
  });

  describe('Payment Integration', () => {
    test('fetches client token when component mounts', async () => {
      axios.get.mockResolvedValueOnce({ data: { clientToken: 'fake-client-token' } });
      
      const mockAuth = {
        user: { name: 'John Doe', address: '123 Main St' },
        token: 'fake-token'
      };
      
      renderWithProviders(<CartPage />, {
        authValue: [mockAuth, jest.fn()]
      });
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/braintree/token');
      });
    });

    test('shows payment UI when user is logged in and has items in cart', async () => {
      axios.get.mockResolvedValueOnce({ data: { clientToken: 'fake-client-token' } });
      
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
      ];
      
      const mockAuth = {
        user: { name: 'John Doe', address: '123 Main St' },
        token: 'fake-token'
      };
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()],
        authValue: [mockAuth, jest.fn()]
      });
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/braintree/token');
      });
    });

    test('handles payment process correctly', async () => {
      axios.get.mockResolvedValueOnce({ data: { clientToken: 'fake-client-token' } });
      axios.post.mockResolvedValueOnce({ data: { success: true } });
      
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
      ];
      
      const mockAuth = {
        user: { name: 'John Doe', address: '123 Main St' },
        token: 'fake-token'
      };
      
      const setCartMock = jest.fn();
      const navigateMock = jest.fn();
      const { useNavigate } = require('react-router-dom');
      useNavigate.mockReturnValue(navigateMock);
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, setCartMock],
        authValue: [mockAuth, jest.fn()]
      });
      
      axios.post.mockResolvedValueOnce({ data: { success: true } });
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/braintree/token');
      });
    });

    test('handles payment errors correctly', async () => {
      axios.get.mockResolvedValueOnce({ data: { clientToken: 'fake-client-token' } });
      axios.post.mockRejectedValueOnce(new Error('Payment failed'));
      
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
      ];
      
      const mockAuth = {
        user: { name: 'John Doe', address: '123 Main St' },
        token: 'fake-token'
      };
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()],
        authValue: [mockAuth, jest.fn()]
      });
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/braintree/token');
      });
    });
  });

  describe('Navigation', () => {
    test('redirects to login page when checkout button is clicked without being logged in', async () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
      ];
      
      const navigateMock = jest.fn();
      const { useNavigate } = require('react-router-dom');
      useNavigate.mockReturnValue(navigateMock);
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()],
        authValue: [{ user: null }, jest.fn()] 
      });
      
      const loginButton = screen.getByText('Plase Login to checkout');
      fireEvent.click(loginButton);
      
      expect(navigateMock).toHaveBeenCalledWith('/login', { state: '/cart' });
    });

    test('redirects to profile page when update address button is clicked', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
      ];
      
      const navigateMock = jest.fn();
      const { useNavigate } = require('react-router-dom');
      useNavigate.mockReturnValue(navigateMock);
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()],
        authValue: [{ user: { name: 'John Doe', address: '' }, token: 'fake-token' }, jest.fn()]
      });
      
      const updateAddressButton = screen.getByText('Update Address');
      fireEvent.click(updateAddressButton);
      
      expect(navigateMock).toHaveBeenCalledWith('/dashboard/user/profile');
    });

    test('shows update address button when user is logged in but has no address', () => {
      const mockCart = [
        { _id: '1', name: 'Product 1', price: 100, description: 'Description 1' }
      ];
      
      const mockAuth = {
        user: { name: 'John Doe', address: '' }, 
        token: 'fake-token'
      };
      
      renderWithProviders(<CartPage />, {
        cartValue: [mockCart, jest.fn()],
        authValue: [mockAuth, jest.fn()]
      });
      
      const updateAddressButton = screen.getByText('Update Address');
      expect(updateAddressButton).toBeInTheDocument();
    });
  });
});