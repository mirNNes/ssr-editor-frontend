import { render, screen } from "@testing-library/react";
import App from "./App";

// API call mock
jest.mock("./api", () => ({
  getItems: () => Promise.resolve([]),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
}));

jest.mock("./socket", () => ({
  socket: {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
});

// Testa att rubriken renderas
test("renderar rubriken", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /SSR/i })).toBeInTheDocument();
});

test("visar login-formulär med tabbar och formulär", () => {
  render(<App />);
  expect(screen.getByPlaceholderText(/E-post/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Lösenord/i)).toBeInTheDocument();
  const loginButtons = screen.getAllByRole("button", { name: /Logga in/i });
  expect(loginButtons.length).toBeGreaterThanOrEqual(1);
  expect(screen.getByRole("button", { name: /Registrera/i })).toBeInTheDocument();
});
