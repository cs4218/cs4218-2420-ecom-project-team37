import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import SearchInput from "./SearchInput";

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("axios");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("SearchInput Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates search keyword when user types", () => {
    const setValuesMock = jest.fn();
    const useSearchMock = require("../../context/search").useSearch;

    useSearchMock.mockReturnValue([
      { keyword: "", results: [] },
      setValuesMock,
    ]);

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText("Search");

    fireEvent.change(searchInput, { target: { value: "Book" } });

    expect(setValuesMock).toHaveBeenCalledWith({
      keyword: "Book",
      results: [],
    });
  });

  it("makes API call and navigates on form submit", async () => {
    const setValuesMock = jest.fn();
    const useSearchMock = require("../../context/search").useSearch;

    useSearchMock.mockReturnValue([
      { keyword: "Book", results: [] },
      setValuesMock,
    ]);

    axios.get.mockResolvedValueOnce({
      data: [{ id: 1, name: "Book One" }],
    });

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText("Search");
    const searchButton = screen.getByText("Search");

    fireEvent.change(searchInput, { target: { value: "Book" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/Book");
      expect(setValuesMock).toHaveBeenCalledWith({
        keyword: "Book",
        results: [{ id: 1, name: "Book One" }],
      });
      expect(mockNavigate).toHaveBeenCalledWith("/search");
    });
  });

  it("logs an error when the API request fails", async () => {
    const setValuesMock = jest.fn();
    const useSearchMock = require("../../context/search").useSearch;

    useSearchMock.mockReturnValue([
      { keyword: "Book", results: [] },
      setValuesMock,
    ]);

    const consoleLogMock = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("API request failed"));

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText("Search");
    const searchButton = screen.getByText("Search");

    fireEvent.change(searchInput, { target: { value: "Book" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/Book");

      expect(setValuesMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ results: expect.any(Array) }),
      );

      expect(consoleLogMock).toHaveBeenCalledWith(expect.any(Error));
    });

    consoleLogMock.mockRestore();
  });
});
