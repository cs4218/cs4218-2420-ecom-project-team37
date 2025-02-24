import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Header from "./Header";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[]]),
}));

jest.mock("../hooks/useCategory", () =>
  jest.fn(() => [
    { name: "Electronics", slug: "electronics" },
    { name: "Clothing", slug: "clothing" },
  ])
);

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

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

describe("Header Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders only login and register links when user is not authenticated", () => {
    const useAuthMock = require("../context/auth").useAuth;
    useAuthMock.mockReturnValue([null, jest.fn()]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("Register")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("renders category links correctly", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Clothing")).toBeInTheDocument();

    expect(screen.getByText("Electronics").closest("a")).toHaveAttribute(
      "href",
      "/category/electronics"
    );
    expect(screen.getByText("Clothing").closest("a")).toHaveAttribute(
      "href",
      "/category/clothing"
    );
  });

  it("clears auth state, removes auth from localStorage, and shows a toast on logout", () => {
    const setAuthMock = jest.fn();
    const useAuthMock = require("../context/auth").useAuth;

    useAuthMock.mockReturnValue([
      { user: { name: "John Doe", role: 0 }, token: "mockToken" },
      setAuthMock,
    ]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(setAuthMock).toHaveBeenCalledWith({
      user: null,
      token: "",
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");

    expect(require("react-hot-toast").success).toHaveBeenCalledWith(
      "Logout Successfully"
    );
  });

  it("renders Dashboard link with /dashboard/admin when user is an admin", () => {
    const useAuthMock = require("../context/auth").useAuth;

    useAuthMock.mockReturnValue([
      { user: { name: "Admin User", role: 1 }, token: "mockToken" },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const dashboardLink = screen.getByText("Dashboard");

    expect(dashboardLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin"
    );
  });

  it("renders Dashboard link with /dashboard/user when user is not an admin", () => {
    const useAuthMock = require("../context/auth").useAuth;

    useAuthMock.mockReturnValue([
      { user: { name: "Non Admin", role: 0 }, token: "mockToken" },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const dashboardLink = screen.getByText("Dashboard");

    expect(dashboardLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/user"
    );
  });
});
