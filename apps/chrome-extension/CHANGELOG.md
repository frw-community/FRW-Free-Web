# Changelog

All notable changes to the FRW Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-16

### Added
- Initial release of FRW Chrome Extension
- Distributed name resolution via bootstrap nodes
- IPFS content fetching with 5-gateway failover
- Omnibox integration (`frw` + Tab)
- Extension popup with quick navigation
- Cryptographic signature verification
- Content caching (5 min TTL)
- Image preloading for HTML content
- Support for HTML, images, text, and binary content
- Verification badge display
- Cache statistics and management
- Keyboard shortcut (Alt+F) for popup
- Comprehensive unit tests (21 tests, 80%+ coverage)

### Technical
- Manifest V3 compliance
- TypeScript implementation
- Webpack build system
- Jest testing framework
- Support for Chrome 88+, Edge 88+, Brave 1.20+, Opera 74+

## [Unreleased]

### Planned
- Settings page for custom bootstrap nodes
- Bookmark manager for FRW sites
- History tracking
- Content pinning to local IPFS
- Enhanced error messages
- Offline mode improvements
