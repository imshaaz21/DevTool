# Testing Infrastructure

This project uses Jest and React Testing Library for testing.

## Prerequisites

- Node.js 18.x or 20.x (required for testing)
- npm

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## GitHub Actions CI

The CI workflow automatically runs on:
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches

The workflow will:
1. Run linter (`npm run lint`)
2. Run tests (`npm test`)
3. Build the project (`npm run build`)
4. Upload coverage reports (available as artifacts)

## Note on Node Version

The testing infrastructure requires Node.js 18+ due to Next.js 14 dependencies. If you're running Node 14 locally, the tests will fail. The GitHub Actions workflow uses Node 18 and 20 to ensure compatibility.

To upgrade Node locally, you can use:
- **nvm**: `nvm install 18 && nvm use 18`
- **n**: `n 18`

## Writing Tests

Place your test files in the `__tests__/` directory with the naming convention `*.test.tsx` or `*.test.ts`.

Example test:
```tsx
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```
