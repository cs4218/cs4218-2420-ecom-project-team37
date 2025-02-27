import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import toast from "react-hot-toast";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));
jest.spyOn(console, "log").mockImplementation(() => {});

// Mock hooks because Profile is wrapped in Header
jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [[]]),
}));
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

// Mock Layout
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  phone: "1234567890",
  address: "123 Street Name",
};

describe("Profile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ user: mockUser }, jest.fn()]);
  });

  it("renders Profile component correctly", () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    expect(screen.getByText("USER PROFILE")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(
      mockUser.name
    );
    expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue(
      mockUser.email
    );
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeDisabled();
    expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
      mockUser.phone
    );
    expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
      mockUser.address
    );
  });

  it("updates form input fields correctly", () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput).toHaveValue("Jane Doe");

    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput).toHaveValue("test@example.com");

    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    fireEvent.change(phoneInput, { target: { value: "99999999" } });
    expect(phoneInput).toHaveValue("99999999");

    const addressInput = screen.getByPlaceholderText("Enter Your Address");
    fireEvent.change(addressInput, { target: { value: "456 New Street" } });
    expect(addressInput).toHaveValue("456 New Street");

    const passwordInput = screen.getByPlaceholderText("Enter Your Password");
    fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
    expect(passwordInput).toHaveValue("newpassword123");
  });

  it("submits form and updates user profile", async () => {
    axios.put.mockResolvedValue({
      data: {
        updatedUser: {
          ...mockUser,
          name: "Updated Name",
          phone: "99999999",
        },
      },
    });
  
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
  
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Updated Name" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "99999999" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "123456" },
    });
  
    fireEvent.click(screen.getByText("UPDATE"));
  
    await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", expect.objectContaining({
          name: "Updated Name",
          email: "john@example.com",
          phone: "99999999",
          address: "123 Street Name",
          password: "123456"
        }));
      });
  });
  

  it("handles API errors successfully", async () => {
    axios.put.mockRejectedValue(new Error("API Error"));

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("shows an error toast when invalid data sent to API", async () => {
    axios.put.mockResolvedValue({
      data: { error: new Error("Invalid data Error"), message: "Some fields are empty" },
    });

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Some fields are empty");
    });
  });
});
