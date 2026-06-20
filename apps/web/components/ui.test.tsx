import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState, ErrorState } from './ui';
describe('dedicated UI states', () => {
  it('renders actionable empty and error states', () => {
    const { rerender } = render(<EmptyState title="No meals yet" body="Create a reusable meal." />);
    expect(screen.getByText('No meals yet')).toBeInTheDocument();
    rerender(<ErrorState error={new Error('Food is in use')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Food is in use');
  });
});
