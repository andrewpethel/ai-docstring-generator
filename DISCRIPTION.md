# DISCRIPTION.md

## Project Overview

This project is a Visual Studio Code extension called **AI Docstring Generator**. It automatically generates XML documentation comments for C# code using Azure OpenAI, with support for other languages planned. The extension is designed for developer productivity, code quality, and maintainability.

---

## Code Structure

- **src/extension.ts**: Main entry point. Registers VS Code commands, manages activation, and coordinates the docstring generation workflow.
- **src/csharpParser.ts**: Parses C# files to identify classes, methods, properties, interfaces, and enums. Determines where docstrings should be placed and checks for existing documentation.
- **src/docstringService.ts**: Handles communication with Azure OpenAI, builds prompts, and formats AI-generated docstrings. Provides fallback mock docstrings for local/test use.
- **src/templates.ts**: Contains language-specific docstring templates and formatting helpers.
- **tests/**: Contains unit and integration tests using Mocha and Chai, with VS Code API mocked for isolation.
- **c-sharp_file_for_testing/**: Contains sample C# files for manual and automated testing.

---

## Compilation & Build

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Compile TypeScript**:
   ```bash
   npm run compile
   ```
   - Compiles all TypeScript files in `src/` to JavaScript in `out/`.
   - The output structure mirrors the `src/` directory.
3. **Package the extension**:
   ```bash
   vsce package
   ```
   - Produces a `.vsix` file for installation in VS Code.

---

## Testing

- **Unit tests** are located in the `tests/` directory.
- Run all tests with:
  ```bash
  npm test
  ```
- Tests use Mocha and Chai, and mock the VS Code API for isolated logic testing.
- Test coverage includes the parser, docstring service, and command registration.

---

## Code Flow

### 1. Activation
- When a supported file (e.g., `.cs`) is opened, the extension activates via `activate()` in `extension.ts`.
- Commands are registered:
  - `aiDocstring.generateAtCursor`
  - `aiDocstring.generateForFile`
  - `aiDocstring.cleanup`

### 2. Command Execution
- **At Cursor**: Finds the code element at the cursor, checks for an existing docstring, and generates/inserts a new one if needed.
- **For File**: Parses the entire file, finds all undocumented elements, generates docstrings for each, and inserts them in a single edit (bottom-to-top to avoid line shifting).
- **Cleanup**: Scans the file for misplaced or duplicate docstrings and removes/fixes them, then formats the document.

### 3. Parsing
- `CSharpParser` uses regex and line analysis to identify code elements and their locations.
- Determines if a docstring is present above each element.

### 4. Docstring Generation
- `DocstringService` builds a prompt and sends it to Azure OpenAI (or returns a mock docstring if not configured).
- Receives and formats the docstring according to XML documentation standards.

### 5. Insertion
- Docstrings are inserted immediately above their target elements, with matching indentation.
- For batch operations, elements are processed in reverse order to prevent line number shifts.

### 6. Assessment
- The extension can generate a Markdown assessment report of docstring quality, scoring files on presence, structure, clarity, consistency, and completeness.

---

## Development & Debugging

- Use `npm run watch` for live TypeScript compilation.
- Launch the extension in a VS Code Extension Development Host with `F5`.
- Use the Command Palette to run extension commands and test features.
- Review logs in the Debug Console for troubleshooting.

---

## Summary

This extension is modular, testable, and designed for extensibility. It leverages VS Code's API, robust parsing, and AI-powered docstring generation to improve code documentation quality and developer workflow.
