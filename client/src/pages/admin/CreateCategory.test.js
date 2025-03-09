import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  within,
} from "@testing-library/react";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";
import { expect } from "@jest/globals";
import { act } from "@testing-library/react";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/Header", () => () => (
  <div data-testid="mock-header">Mock Header</div>
));
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => ({
  __esModule: true,
  default: () => ({
    categories: [],
    loading: false,
  }),
}));

describe("Create Category Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, category: [] },
    });
    axios.post.mockResolvedValue({
      data: { success: true, message: "Category created" },
    });
    jest.restoreAllMocks();
  });

  it("should render create category page successfully", async () => {
    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Manage Category" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText(/enter new category/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/actions/i)).toBeInTheDocument();
  });

  it("should have empty inputs initially", async () => {
    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter new category/i).value).toBe("");
    });
  });

  it("should be able to type into category field", async () => {
    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    const input = screen.getByPlaceholderText(/enter new category/i);
    fireEvent.change(input, { target: { value: "Test2" } });

    await waitFor(() => {
      expect(input.value).toBe("Test2");
    });
  });

  it("should create a category successfully", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          {
            _id: "cid_1",
            name: "Category1",
            slug: "category1",
          },
        ],
      },
    });

    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "category created",
        category: [
          {
            _id: "cid_2",
            name: "Category2",
            slug: "category2",
            __v: 0,
          },
        ],
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
      target: { value: "Category2" },
    });
    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Category2 is created");
  });

  it("should not create a category when input is empty", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [{ name: "Test" }],
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByText("Submit"));

    expect(axios.post).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Category name is required");
  });

  it("should show error when creating duplicate category", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [{ _id: "1", name: "Electronics", slug: "electronics" }],
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    const input = screen.getByPlaceholderText(/enter new category/i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    fireEvent.change(input, { target: { value: "Electronics" } });
    fireEvent.click(submitButton);

    expect(axios.post).not.toHaveBeenCalled();

    expect(toast.error).toHaveBeenCalledWith("Category already exists");
  });

  it("should display error message when unable to create category", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Category creation failed" },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    const input = screen.getByPlaceholderText(/enter new category/i);
    fireEvent.change(input, { target: { value: "NewCategory" } });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        {
          name: "NewCategory",
        },
      );
    });

    expect(toast.error).toHaveBeenCalledWith("Category creation failed");
  });

  it("should display error message when unable to create and retrieve categories", async () => {
    axios.get.mockRejectedValue({
      data: {
        success: false,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "Test",
            slug: "test",
            __v: 0,
          },
        ],
      },
    });
    axios.post.mockRejectedValue({
      data: {
        success: false,
        message: "cannot create category",
        category: [
          {
            _id: "cid_2",
            name: "Test2",
            slug: "test2",
            __v: 0,
          },
        ],
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
      target: { value: "Test2" },
    });
    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it("should update a category successfully", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
        ],
      },
    });

    axios.put.mockResolvedValue({
      data: {
        success: true,
        message: "Category updated successfully",
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );

    const editButton = await screen.findByText(/edit/i);
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(editButton);
    });

    const modalInput = await screen.findByDisplayValue("category1");
    expect(modalInput).toBeInTheDocument();

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.change(modalInput, { target: { value: "updatedCategory" } });
    });

    const modal = screen.getByRole("dialog");
    const submitButton = within(modal).getByRole("button", { name: /submit/i });

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cid_1",
        { name: "updatedCategory" },
      ),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("updatedCategory is updated"),
    );
  });

  it("should not update category with empty input", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [{ _id: "cid_1", name: "category1" }],
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    const editButton = await screen.findByText(/edit/i);
    fireEvent.click(editButton);

    const input = await screen.findByDisplayValue("category1");
    fireEvent.change(input, { target: { value: "" } });

    const modal = screen.getByRole("dialog");
    const submitButton = within(modal).getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.put).not.toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith("Input cannot be empty");
  });

  it("should display error message when update fail due to API", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
        ],
      },
    });

    axios.put.mockRejectedValue({
      response: {
        data: {
          success: false,
          message: "Category not updated",
        },
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );

    const editButton = await screen.findByText(/edit/i);
    fireEvent.click(editButton);

    const modalInput = await screen.findByDisplayValue("category1");
    expect(modalInput).toBeInTheDocument();

    fireEvent.change(modalInput, { target: { value: "updatedCategory" } });

    const modal = screen.getByRole("dialog");
    const submitButton = within(modal).getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cid_1",
        { name: "updatedCategory" },
      ),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Category not updated"),
    );
  });

  it("should show error message when update is unsuccessful", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [{ _id: "cid_1", name: "category1" }],
      },
    });

    axios.put.mockResolvedValue({
      data: { success: false, message: "Category update failed" },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );

    const editButton = await screen.findByText(/edit/i);
    fireEvent.click(editButton);

    const modalInput = await screen.findByDisplayValue("category1");
    fireEvent.change(modalInput, { target: { value: "Updated Category" } });

    const modal = screen.getByRole("dialog");
    const submitButton = within(modal).getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cid_1",
        { name: "Updated Category" },
      ),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Category update failed"),
    );
  });

  it("should delete a category successfully", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
        ],
      },
    });

    axios.delete.mockResolvedValue({
      data: {
        success: true,
        message: "Category deleted successfully",
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );

    const deleteButton = await screen.findByText(/delete/i);

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/cid_1",
      ),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("category is deleted"),
    );
  });

  it("should display error when success is false in delete category", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
        ],
      },
    });

    axios.delete.mockResolvedValue({
      data: {
        success: false,
        message: "Category not deleted successfully",
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(async () => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    const deleteButton = await screen.findByText(/delete/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/cid_1",
      );
    });
    expect(toast.error).toHaveBeenCalledWith(
      `Category not deleted successfully`,
    );
  });

  it("should display error message when unable to delete category", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
        ],
      },
    });

    axios.delete.mockRejectedValue({
      response: {
        data: {
          success: false,
          message: "Category not deleted",
        },
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );

    const deleteButton = await screen.findByText(/delete/i);

    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/cid_1",
      ),
    );

    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });
  it("should close the modal when close button is clicked", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        message: "All Categories List",
        category: [
          {
            _id: "cid_1",
            name: "category1",
            slug: "category1",
            __v: 0,
          },
        ],
      },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );

    const editButton = await screen.findByText(/edit/i);
    fireEvent.click(editButton);

    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(modal).toHaveStyle("display: none");
    });
  });

  it("should show error when API returns success: false", async () => {
    axios.get.mockResolvedValue({
      data: { success: false, message: "Failed to fetch categories" },
    });

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category",
      ),
    );
  });

  it("should show error message when update request fails", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [{ _id: "cid_1", name: "category1" }],
      },
    });

    axios.put.mockRejectedValue(new Error("Network error"));

    render(
      <Router>
        <CreateCategory />
      </Router>,
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"),
    );

    const editButton = await screen.findByText(/edit/i);
    fireEvent.click(editButton);

    const modalInput = await screen.findByDisplayValue("category1");
    fireEvent.change(modalInput, { target: { value: "Updated Category" } });

    const submitButton = within(screen.getByRole("dialog")).getByRole(
      "button",
      { name: /submit/i },
    );
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cid_1",
        { name: "Updated Category" },
      ),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong"),
    );
  });
});
