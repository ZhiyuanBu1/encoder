# Advanced Encoding & Decoding System

## Overview

This is a client-side web application that implements a custom quantum-inspired multi-layer encryption system for encoding and decoding text messages. The application features a sophisticated encryption algorithm that combines dynamic character substitution matrices, bit-level scrambling, and key derivation functions to provide secure text transformation. Built as a pure frontend application with a simple Python development server, it offers an intuitive interface for users to encrypt and decrypt messages using custom keys.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla HTML, CSS, and JavaScript without any frameworks
- **Component-based Design**: Modular JavaScript classes handle encryption logic separately from UI interactions
- **Responsive Grid Layout**: CSS Grid-based layout that adapts to different screen sizes
- **Real-time Processing**: Client-side encryption/decryption with immediate feedback

### Encryption System Design
- **Quantum-Inspired Algorithm**: Custom `QuantumLayeredEncoder` class implementing multi-layer encryption
- **Dynamic Substitution Matrices**: Generated quantum matrix and entanglement map for character transformation
- **Key Derivation Function**: Complex hash-based key expansion from user-provided keys
- **Bit-level Operations**: Advanced bit manipulation and scrambling patterns
- **Stateless Processing**: Each encryption/decryption operation is independent

### Development Server
- **Python HTTP Server**: Simple development server using Python's built-in `http.server` module
- **Static File Serving**: Serves HTML, CSS, and JavaScript files with cache control headers
- **Port Management**: Automatic retry logic for port binding conflicts
- **Cross-platform Compatibility**: Works on any system with Python 3

### Security Considerations
- **Client-side Only**: All encryption/decryption happens in the browser
- **No Data Persistence**: No server-side storage or logging of sensitive data
- **Key Management**: User-controlled encryption keys with secure derivation

## External Dependencies

### Runtime Dependencies
- **Python 3**: Required for the development server (built-in modules only)
- **Modern Web Browser**: Supports ES6+ JavaScript features including classes and array methods

### Development Tools
- **No Build System**: Pure vanilla web technologies without compilation or bundling
- **No Package Manager**: No npm, pip, or other package dependencies
- **Standard Libraries Only**: Uses only browser APIs and Python standard library

### Browser APIs Used
- **DOM Manipulation**: Standard document object model interactions
- **Clipboard API**: For copy-to-clipboard functionality
- **Event Handling**: Mouse and keyboard event processing
- **Local Processing**: All computation done client-side using JavaScript engines
