/* eslint-disable react/react-in-jsx-scope */
import { render, screen } from '@testing-library/react';
import App from './App';
import { vi, expect, test } from "vitest";

vi.mock('d3');

vi.mock('./Chart', () => ({
  default: () => <svg id="timelineSvg" />,
}));

test('renders page', () => {
  render(<App />);
  const linkElement = screen.getByText(/word-cloud/i);
  expect(linkElement).not.toBeNull();
});
