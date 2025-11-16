# Contributing to FRW Chrome Extension

Thank you for your interest in contributing to the FRW Chrome Extension.

## Development Setup

```bash
# Clone repository
git clone https://github.com/frw-community/FRW-Free-Web-Modern.git
cd FRW-Free-Web-Modern/apps/chrome-extension

# Install dependencies
npm install

# Build extension
npm run build

# Run tests
npm test
```

## Project Structure

```
chrome-extension/
├── src/
│   ├── background/       # Service worker
│   ├── core/            # Resolver and IPFS fetcher
│   ├── viewer/          # Content display page
│   └── popup/           # Extension popup UI
├── tests/               # Unit tests
├── icons/               # Extension icons
└── manifest.json        # Extension manifest
```

## Making Changes

### Code Style

- TypeScript strict mode
- 2 spaces for indentation
- ESLint configuration in `.eslintrc.js`
- Run `npm run lint` before committing

### Testing

All new features must include unit tests:

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Coverage requirements:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Run the linter: `npm run lint`
7. Commit with descriptive messages
8. Push to your fork
9. Submit a pull request

### Commit Messages

Use clear, descriptive commit messages:

```
Add omnibox keyword search functionality

- Implement chrome.omnibox listener
- Add URL parsing for frw:// protocol
- Update tests for omnibox handler
```

## Reporting Issues

When reporting bugs, include:

- Browser version (Chrome, Edge, Brave, etc.)
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console logs (if applicable)

## Feature Requests

Feature requests are welcome. Please:

- Check existing issues first
- Describe the use case
- Explain why it would be useful
- Consider submitting a PR

## Areas for Contribution

### Priority Areas

- Settings page for custom bootstrap nodes
- Bookmark manager for FRW sites
- Content pinning to local IPFS
- Enhanced error handling

### Good First Issues

Look for issues tagged with `good-first-issue` in the issue tracker.

## Code Review

All contributions will be reviewed for:

- Code quality and style
- Test coverage
- Documentation
- Performance impact
- Security implications

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Open an issue or start a discussion in the repository.
