import { render } from '@testing-library/react';
import { EditorSkeleton } from '../components/EditorSkeleton';

describe('EditorSkeleton', () => {
  it('renders a placeholder with an accessible loading label', () => {
    const { container } = render(<EditorSkeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-label', 'Loading editor');
  });
});
