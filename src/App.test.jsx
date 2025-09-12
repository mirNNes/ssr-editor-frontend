import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

// API call mock
jest.mock("./api", () => ({
  getItems: () => Promise.resolve([]),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
}));

// Testa att rubriken renderas
test("renderar rubriken", async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.getByRole("heading", { name: /SSR/i })).toBeInTheDocument();
  });
});

test("Skapa-knappen visas", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Skapa/i })).toBeInTheDocument();
  });
});
