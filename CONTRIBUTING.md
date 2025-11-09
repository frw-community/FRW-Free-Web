# Contributing to FRW

## Development Setup

```bash
git clone https://github.com/your-org/frw-free-web-modern.git
cd frw-free-web-modern
npm install
```

## Project Structure

```
src/
  crypto/         - Cryptographic operations (Ed25519)
  ipfs/           - IPFS client and operations
  protocol/       - FRW protocol implementation
  cli/            - Command-line interface
  client/         - Electron application
tests/            - Test suite
docs/             - Documentation
examples/         - Example FRW pages
```

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Code Style

- Use ESLint configuration
- Run `npm run lint:fix` before committing
- Follow existing patterns

## Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Write tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit PR with clear description

## Security Issues

Report security vulnerabilities to security@frw.io (do not open public issues).
