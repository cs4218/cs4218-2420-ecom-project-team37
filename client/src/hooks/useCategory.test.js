import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useCategory from "./useCategory"; // Adjust the import path as needed

// Mock axios
jest.mock("axios");

describe("useCategory hook", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch categories on mount and update state", async () => {
    // Arrange: Define the mock response data
    const categoryData = { category: ["cat1", "cat2"] };
    axios.get.mockResolvedValue({ data: categoryData });

    // Act: Render the hook
    const { result } = renderHook(() => useCategory());

    // Initially, the categories should be an empty array.
    expect(result.current).toEqual([]);

    // Wait for the state to update after the async call.
    await waitFor(() => {
      expect(result.current).toEqual(categoryData.category);
    });

    // Assert: Verify axios.get was called with the correct URL.
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  it("should handle errors gracefully", async () => {
    // Arrange: Simulate an error from axios.get
    const errorMessage = "Network error";
    axios.get.mockRejectedValue(new Error(errorMessage));

    // Spy on console.log to check that errors are logged.
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act: Render the hook
    const { result } = renderHook(() => useCategory());

    // Wait for the async effect to complete.
    await waitFor(() => {
      // On error, the categories should remain an empty array.
      expect(result.current).toEqual([]);
    });

    // Assert: Check that the error was logged.
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    // Cleanup the spy.
    consoleSpy.mockRestore();
  });
});