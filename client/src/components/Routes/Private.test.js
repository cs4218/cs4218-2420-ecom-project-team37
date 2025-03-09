import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../Spinner", () => () => <div data-testid="spinner">Loading...</div>);
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <div data-testid="outlet">Protected Content</div>,
}));

describe("PrivateRoute Component", () => {
  let mockSetAuth;

  beforeEach(() => {
    jest.clearAllMocks(); 
    mockSetAuth = jest.fn();
  });

  it("should render Spinner when checking authentication", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, mockSetAuth]);
    axios.get.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { ok: true } }), 100)
        )
    );

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("should render protected content when authentication is successful", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, mockSetAuth]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
  });

  it("should render Spinner when authentication fails", async () => {
    useAuth.mockReturnValue([{ token: "invalid-token" }, mockSetAuth]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
  });
  it("should render Spinner without calling API if no token is present", async () => {
    jest.clearAllMocks(); 
  
    useAuth.mockReturnValue([{ token: null }, mockSetAuth]);
  
    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );
  
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });
  
});
