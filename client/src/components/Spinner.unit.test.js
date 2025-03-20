import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Spinner from "./Spinner";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: "/current-page",
  }),
}));

describe("Spinner Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the countdown correctly", () => {
    render(
      <MemoryRouter>
        <Spinner path="login" />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/redirecting to you in 3 second/i),
    ).toBeInTheDocument();
  });

  it("decrements countdown every second", async () => {
    render(
      <MemoryRouter>
        <Spinner path="login" />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/redirecting to you in 3 second/i),
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText(/redirecting to you in 2 second/i),
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText(/redirecting to you in 1 second/i),
    ).toBeInTheDocument();
  });

  it("navigates to the specified path when countdown reaches 0", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Spinner path="login" />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/redirecting to you in 3 second/i),
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: "/current-page",
      });
    });
  });
});
