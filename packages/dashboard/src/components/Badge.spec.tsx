import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge tone="good">ok</Badge>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
