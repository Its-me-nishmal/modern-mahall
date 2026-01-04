# Modern Mahall - Testing Guide

## 🧪 Test Suite Overview

This project uses **Jest** with **React Testing Library** for comprehensive testing.

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Structure

```
__tests__/
├── api/
│   └── authRoutes.test.ts      # Backend API endpoint tests
├── components/
│   ├── Auth.test.tsx            # Auth component tests
│   └── ErrorPage.test.tsx       # Error page tests
├── hooks/
│   └── useDebounce.test.ts     # Custom hooks tests
└── utils/
    └── validation.test.ts       # Validation schema tests
```

## Test Coverage Goals

- **Statements**: 60%+
- **Branches**: 50%+
- **Functions**: 50%+
- **Lines**: 60%+

## Writing Tests

### Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

test('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### API Tests

```typescript
import request from 'supertest';
import app from '../backend/index';

test('POST /api/endpoint', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ data: 'test' });
    
  expect(response.status).toBe(200);
});
```

### Hook Tests

```typescript
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../hooks/useMyHook';

test('hook works correctly', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current).toBeDefined();
});
```

## Mocks

### localStorage
```typescript
localStorage.setItem('key', 'value');
expect(localStorage.setItem).toHaveBeenCalled();
```

### fetch
```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' })
  })
);
```

## Best Practices

1. **Test user behavior**, not implementation
2. **Use semantic queries** (`getByRole`, `getByLabelText`)
3. **Clean up after tests** (Jest does this automatically)
4. **Mock external dependencies** (API calls, localStorage)
5. **Test edge cases** (empty states, errors, loading)

## CI/CD Integration

Tests run automatically in CI pipelines. Make sure all tests pass before merging:

```bash
npm test -- --coverage --watchAll=false
```

## Troubleshooting

### Tests timing out
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for unresolved promises

### Module not found
- Check `moduleNameMapper` in `jest.config.json`
- Ensure imports use correct paths

### Tests passing locally but failing in CI
- Check environment variables
- Verify Node version matches CI

## Next Steps

- Add E2E tests with Playwright/Cypress
- Increase coverage to 80%+
- Add visual regression tests
- Set up continuous testing in CI/CD
