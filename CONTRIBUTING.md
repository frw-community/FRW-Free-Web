# Contributing to FRW

## Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/frw-free-web-modern.git
cd frw-free-web-modern

# Install dependencies
npm install

# Build all packages
npm run build

# Install CLI globally
cd apps/cli
npm link
```

## Project Structure

```
frw-free-web-modern/
├── packages/           # Core libraries (publishable npm packages)
│   ├── common/        # @frw/common - Shared types and utilities
│   ├── crypto/        # @frw/crypto - Ed25519 signatures
│   ├── ipfs/          # @frw/ipfs - IPFS integration
│   ├── protocol/      # @frw/protocol - URL parsing and validation
│   ├── sandbox/       # @frw/sandbox - JavaScript VM
│   └── storage/       # @frw/storage - Cache and storage
├── apps/              # Applications
│   ├── cli/          # Command-line tool
│   └── browser/      # Electron browser
├── docs/             # Technical documentation
├── tests/            # Integration tests
└── examples/         # Example FRW sites
```

## Development Workflow

### Working on Packages

```bash
# Build specific package
npm run build --workspace=@frw/crypto

# Test specific package
npm test --workspace=@frw/protocol

# Watch mode for development
npm run dev --workspace=@frw/ipfs
```

### Working on Applications

```bash
# CLI development
cd apps/cli
npm run dev

# Browser development
cd apps/browser
npm run electron:dev
```

## Testing

```bash
# Run all tests
npm test

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

## Code Style

- TypeScript strict mode enforced
- ESLint configuration with Prettier
- Run `npm run lint` to check
- Run `npm run lint:fix` before committing
- Follow existing code patterns

## Commit Guidelines

Format: `type(scope): description`

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `chore` - Maintenance

Example:
```
feat(browser): add bookmark management
fix(crypto): resolve signature verification issue
docs(readme): update installation instructions
```

## Pull Request Process

1. Fork repository
2. Create feature branch (`git checkout -b feature/feature-name`)
3. Write tests for new features
4. Ensure all tests pass (`npm test`)
5. Update documentation
6. Run linting (`npm run lint:fix`)
7. Commit with clear messages
8. Push and submit PR with detailed description

## PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests passing
- [ ] No linting errors
- [ ] TypeScript compiles without errors
- [ ] CHANGELOG.md updated (if user-facing)

## Areas to Contribute

### High Priority
- Test coverage improvements
- Performance optimizations
- Security audits
- Browser UI enhancements

### Documentation
- Tutorial creation
- API documentation
- Example sites
- Video walkthroughs

### Features
- Tab support in browser
- Bookmark system
- History management
- Search functionality
- Mobile client

## Testing Guidelines

- Unit tests for all public APIs
- Integration tests for workflows
- Security tests for crypto operations
- E2E tests for user journeys

## Security Issues

Report security vulnerabilities to security@frw.dev (do not open public issues).

Use PGP encryption if possible. Acknowledge within 48 hours. Coordinated disclosure after patch.

## Questions?

- GitHub Issues for bugs/features
- GitHub Discussions for questions
- Discord (coming soon) for real-time chat

## Code of Conduct

Respectful collaboration expected. Harassment-free environment. See CODE_OF_CONDUCT.md.
