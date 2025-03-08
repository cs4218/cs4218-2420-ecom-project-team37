import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryForm from "./CategoryForm";

describe("CategoryForm", () => {
  it("renders the input and submit button", () => {
    const handleSubmit = jest.fn();
    const setValue = jest.fn();
    const value = "initial value";

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value={value}
        setValue={setValue}
      />,
    );

    const input = screen.getByPlaceholderText("Enter new category");
    expect(input).toBeInTheDocument();
    expect(input.value).toBe(value);

    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toBeInTheDocument();
  });

  it("calls setValue when the input value changes", () => {
    const handleSubmit = jest.fn();
    const setValue = jest.fn();
    const value = "";

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value={value}
        setValue={setValue}
      />,
    );

    const input = screen.getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "new category" } });
    expect(setValue).toHaveBeenCalledWith("new category");
  });

  it("calls handleSubmit when the form is submitted", () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const setValue = jest.fn();
    const value = "some category";

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value={value}
        setValue={setValue}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalled();
  });
});