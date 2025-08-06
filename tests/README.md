# Tests Directory

This directory contains unit tests for the VS Code AI Docstring Generator extension.

## Test Structure

### Current Tests

1. **`docstringService.test.ts`** - Tests for the core documentation generation service
   - Tests API initialization and configuration
   - Tests mock docstring generation when no API key is provided
   - Tests error handling and fallback behavior

2. **`mocks/vscode.ts`** - Mock implementation of the VS Code API
   - Provides test doubles for VS Code-specific functionality
   - Enables unit testing outside of the VS Code environment

## Testing Framework

We use the following tools:
- **Mocha** - Test runner and framework
- **Chai** - Assertion library for BDD/TDD style assertions
- **Proxyquire** - Module mocking to replace VS Code dependencies
- **ts-node** - TypeScript execution for tests

## Why These Tests?

### Unit Testing Approach
We chose unit tests with mocked VS Code dependencies because:
- **Fast execution** - Tests run in milliseconds without launching VS Code
- **Isolated testing** - Each component is tested independently
- **CI/CD friendly** - Can run in any Node.js environment
- **Early bug detection** - Catch issues before integration

### Mocking Strategy
The VS Code API is mocked because:
- The `vscode` module only exists within the VS Code runtime
- Mocking allows us to test business logic without UI dependencies
- We can simulate different configurations and edge cases

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (if configured)
npm run test:watch
```

## Future Improvements

### Test Coverage
- [ ] Add tests for `CSharpParser` class
  - Method extraction logic
  - Class detection
  - Edge cases (nested classes, generics, attributes)
- [ ] Add tests for `templates.ts` functionality
- [ ] Add integration tests for the complete extension flow

### Testing Infrastructure
- [ ] Add code coverage reporting (using `nyc` or similar)
- [ ] Implement integration tests using `@vscode/test-electron`
- [ ] Add performance benchmarks for parsing large files
- [ ] Create fixture files with sample C# code for consistent testing

### Mock Improvements
- [ ] Enhance VS Code mocks to support more APIs as needed
- [ ] Create a mock factory for different test scenarios
- [ ] Add TypeScript type checking for mocks to match VS Code API

### CI/CD Integration
- [ ] Configure GitHub Actions to run tests on PR
- [ ] Add test coverage badges to main README
- [ ] Set up automated testing across different Node.js versions
- [ ] Add linting and formatting checks to test pipeline

## Best Practices

1. **Test Naming** - Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert** - Structure tests clearly with setup, execution, and verification
3. **One Assertion Per Test** - Keep tests focused on a single behavior
4. **Mock Minimally** - Only mock what's necessary for the test
5. **Test Edge Cases** - Include tests for error conditions and boundary values

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Update this README if adding new test categories
3. Ensure all tests pass before submitting PR
4. Add appropriate mocks for any new VS Code