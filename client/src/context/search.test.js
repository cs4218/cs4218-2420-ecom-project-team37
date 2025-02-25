import React, { act } from "react";
import { render, screen } from "@testing-library/react";
import { useSearch, SearchProvider } from "./search";

// Provide a SearchComponent to be wrapped with SearchProvideer
const SearchComponent = () => {
  const [auth, setAuth] = useSearch();

  return (
    <div>
      <p data-testid="keyword">{auth.keyword}</p>
      <button
        onClick={() => setAuth({ ...auth, keyword: "search test" })}
        data-testid="button"
      >
        Update Keyword
      </button>
    </div>
  );
};

describe("SearchContext", () => {
  it("provides and updates search context", () => {
    render(
      <SearchProvider>
        <SearchComponent />
      </SearchProvider>
    );

    const keywordElement = screen.getByTestId("keyword");
    const buttonElement = screen.getByTestId("button");

    expect(keywordElement.textContent).toBe("");

    act(() => {
      buttonElement.click();
    });

    expect(keywordElement.textContent).toBe("search test");
  });
});
