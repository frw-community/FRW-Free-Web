# FRW Browser

A Windows browser application with native `frw://` protocol support and embedded web content rendering.

## Overview

FRW Browser is a native Windows application that provides web browsing capabilities with support for both traditional HTTP/HTTPS protocols and the decentralized FRW protocol. The browser renders web content directly within the application window without launching external browsers.

## Current Implementation

### Core Features
- Native Windows interface with menu bar (File, Edit, View, Tools, Help)
- Address bar with URL input and navigation
- Navigation toolbar (Back, Forward, Reload, Home, Go buttons)
- Status bar showing page information and connection status
- Web content display area with embedded rendering
- Support for HTTP, HTTPS, and FRW protocols

### FRW Protocol Support
- Resolution of `frw://` URLs via bootstrap node queries
- IPFS content retrieval with gateway fallback
- Decentralized web page loading and display
- Network status indicators

### User Interface
- Professional Windows-style menu system
- Keyboard shortcuts for common operations
- Responsive layout management
- Status indicators for loading and navigation states

## Technical Architecture

### Components
- **BrowserWindow**: Main application window and UI management
- **CEF Integration**: Chromium Embedded Framework for web rendering
- **FRW Scheme Handler**: Custom protocol handler for `frw://` URLs
- **Resolver Bridge**: Communication with FRW bootstrap nodes
- **IPFS Integration**: Content retrieval from IPFS network

### Configuration
- Settings stored in user application data directory
- Configurable bootstrap nodes and IPFS gateways
- Network timeout and retry parameters
- UI preferences and browser settings

## Installation

### Prerequisites
- Windows 10 or later
- Visual Studio 2019 or later
- CMake 3.16 or later
- CEF (Chromium Embedded Framework) binary distribution

### Build Instructions

1. **Obtain CEF Binary**
   ```
   Download CEF binary from https://cef-builds.spotifycdn.com/index.html
   Example: cef_binary_120.2.13+g1128d61+chromium-120.0.6099.199_windows64
   ```

2. **Set Environment Variable**
   ```powershell
   $env:CEF_ROOT = "C:\path\to\cef_binary_..."
   ```

3. **Build Application**
   ```powershell
   cd apps\browser-frw
   mkdir build
   cd build
   cmake .. -G "Visual Studio 16 2019" -A x64
   cmake --build . --config Release
   ```

4. **Run Browser**
   ```powershell
   .\build\Release\frw-browser.exe
   ```

## Usage

### Basic Navigation
- Enter URLs in the address bar and press Enter or click Go
- Use navigation buttons: Back, Forward, Reload, Home
- Access menu options via the menu bar or keyboard shortcuts

### FRW Protocol
- Navigate to `frw://` URLs (e.g., `frw://example/`)
- Browser resolves names via bootstrap nodes
- Content retrieved from IPFS network

### Menu Options
- **File**: New window, open files, print, exit
- **Edit**: Undo/redo, cut/copy/paste, find
- **View**: Zoom controls, fullscreen, developer tools
- **Tools**: Settings, extensions, task manager
- **Help**: Documentation and about information

## Keyboard Shortcuts

### Navigation
- `Ctrl+T`: New Tab
- `Ctrl+N`: New Window
- `Ctrl+L`: Focus Address Bar
- `Alt+Left`: Back
- `Alt+Right`: Forward
- `Alt+Home`: Home
- `F5`: Reload
- `Esc`: Stop

### Page Operations
- `Ctrl+F`: Find
- `Ctrl+P`: Print
- `Ctrl+S`: Save Page As
- `F12`: Developer Tools

### Editing
- `Ctrl+X`: Cut
- `Ctrl+C`: Copy
- `Ctrl+V`: Paste
- `Ctrl+A`: Select All
- `Ctrl+Z`: Undo

## Development

### Project Structure
```
apps/browser-frw/
├── src/
│   ├── UI/
│   │   └── BrowserWindow.cpp    # Main window implementation
│   ├── CEFWrapperImpl.cpp       # CEF integration stub
│   ├── FrwSchemeHandler.cpp     # FRW protocol handler
│   └── main.cpp                 # Application entry point
├── CMakeLists.txt               # Build configuration
└── README.md                    # This file
```

### Dependencies
- **CEF (Chromium Embedded Framework)**: Web rendering engine
- **Windows API**: Native UI components
- **CMake**: Build system
- **Visual Studio**: Compiler and IDE

### Current Status
The browser is in active development with core functionality implemented:
- Basic web page rendering
- FRW protocol support
- Native Windows interface
- Menu system and navigation controls

### Known Limitations
- CEF integration uses stub implementations
- Limited extension support
- No multi-tab functionality yet
- Windows-only implementation

## Contributing

When contributing to the FRW Browser:
1. Follow existing code style and patterns
2. Test changes with both HTTP/HTTPS and FRW protocols
3. Update documentation for new features
4. Ensure Windows API compatibility

## License

This project is part of the FRW (Free Web) ecosystem. See the main project license for details.
