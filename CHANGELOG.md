# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TypeScript monorepo architecture with 6 core packages
- @frw/common - Shared types, errors, utilities
- @frw/crypto - Ed25519 signatures and key management
- @frw/protocol - URL parsing, validation, content resolution
- @frw/ipfs - IPFS network integration
- @frw/sandbox - Secure JavaScript VM execution
- @frw/storage - Cache and storage abstractions
- Complete CLI tool with all commands functional (init, register, publish, verify, serve, keys, ipfs)
- Electron browser application with React + TailwindCSS UI
- Custom frw:// protocol handler with Electron net.fetch integration
- IPFS content fetching from local gateway (localhost:8080)
- Browser UI components: AddressBar, Navigation, ContentViewer, VerificationBadge, StatusBar
- IPC communication between main and renderer processes
- Signature verification system integrated into browser
- Name resolution system (frw://alice/ → IPFS CID)
- Configuration system (~/.frw/config.json) for registered names and published sites
- Comprehensive documentation suite:
  - Installation Guide
  - User Guide
  - Quick Start Guide
  - Browser Plan
  - IPFS Setup Guide
  - English README
- Jest testing framework configuration
- Initial unit tests for crypto and protocol packages
- GitHub issue templates and PR template
- Code of Conduct
- Production roadmap documentation
- Vite build configuration for Electron + React
- PostCSS configuration with TailwindCSS and Autoprefixer
- Password-protected keypair generation
- Local preview server (frw serve)
- Content signing with Ed25519
- IPFS publishing workflow

### Changed
- Migrated from single directory structure to monorepo
- Updated protocol handler to use Electron's net.fetch instead of node-fetch
- Simplified Electron startup to prevent double instance launch
- Updated README.md from French to English
- Project references for TypeScript inter-package dependencies

### Fixed
- Double Electron instance launch on development start
- IPFS connection errors (ECONNREFUSED) by using proper Electron API
- Protocol handler async issues with proper callback handling
- Browser failing to load content from IPFS
- Build errors with TypeScript strict mode
- Missing type definitions for dependencies

### Security
- Ed25519 signature verification on all content
- Sandboxed iframe rendering for security
- Password protection for private keys
- Content integrity verification before display

## [0.2.0-alpha.1] - 2025-11-09

Working browser with IPFS integration.

### Highlights
- FRW Browser successfully loads content from IPFS
- CLI tool fully functional for publishing and verification
- End-to-end workflow operational: create → publish → browse
- Complete documentation for installation and usage

## [0.1.0-alpha.1] - 2025-11-08

Initial monorepo setup and core packages.
