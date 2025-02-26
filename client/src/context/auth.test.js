import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { AuthProvider, useAuth } from "./auth";

jest.mock("axios");

// Create an AuthComponent to be wrapped with AuthProvider
const AuthComponent = () => {
  const [auth, setAuth] = useAuth();

  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.name : "No User"}</div>
      <div data-testid="token">{auth.token}</div>
      <button
        data-testid="set-auth-button"
        onClick={() =>
          setAuth({ user: { name: "John Doe" }, token: "mock-token-123" })
        }
      >
        Set Auth
      </button>
    </div>
  );
};

// Mocking localStorage
beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

describe("AuthProvider and useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders with default state", () => {
    render(
      <AuthProvider>
        <AuthComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("No User");
    expect(screen.getByTestId("token")).toHaveTextContent("");
  });

  it("loads auth from localStorage if available", async () => {
    const mockAuthData = {
      user: { name: "John Doe" },
      token: "mock-token-123",
    };

    window.localStorage.getItem.mockReturnValueOnce(
      JSON.stringify(mockAuthData)
    );

    render(
      <AuthProvider>
        <AuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("John Doe");
      expect(screen.getByTestId("token")).toHaveTextContent("mock-token-123");
    });
  });

  it("sets axios default authorization header to token value", async () => {
    const mockAuthData = {
      user: { name: "John Doe" },
      token: "mock-token-123",
    };

    window.localStorage.getItem.mockReturnValueOnce(
      JSON.stringify(mockAuthData)
    );

    render(
      <AuthProvider>
        <AuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBe(
        "mock-token-123"
      );
    });
  });
});
