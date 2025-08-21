# AI Docstring Generator for VS Code

An intelligent VS Code extension that automatically generates documentation comments for C# code using Azure OpenAI. Currently focused on C# with XML documentation comments, with plans to expand to other languages.

![AI Docstring Generator Demo](https://img.shields.io/badge/version-0.1.0-blue.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-Extension-green.svg)
![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)

## 🚀 Features

- **Smart Documentation Generation**: Uses Azure OpenAI to generate contextual XML documentation comments
- **C# Support**: Full support for classes, methods, properties, and interfaces
- **Cursor-Based Generation**: Generate documentation for the code element at your cursor position
- **Batch Processing**: Document all undocumented elements in a file at once
- **Fallback Support**: Works without API key using mock documentation for testing

## 📸 Demo

```csharp
// Before: Undocumented method
public async Task<User> GetUserByIdAsync(int userId, bool includeDeleted = false)
{
    var user = await _repository.GetByIdAsync(userId);
    return includeDeleted ? user : user?.IsDeleted == false ? user : null;
}

// After: AI-generated documentation
/// <summary>
/// Retrieves a user by their unique identifier.
/// </summary>
/// <param name="userId">The unique identifier of the user to retrieve.</param>
/// <param name="includeDeleted">Whether to include soft-deleted users in the search. Default is false.</param>
/// <returns>A task that represents the asynchronous operation. The task result contains the User object if found; otherwise, null.</returns>
public async Task<User> GetUserByIdAsync(int userId, bool includeDeleted = false)
{
    var user = await _repository.GetByIdAsync(userId);
    return includeDeleted ? user : user?.IsDeleted == false ? user : null;
}
```

## 🛠️ Installation

### From Source (Currently the only option)
```bash
# Clone the repository
git clone https://github.com/yourusername/vscode-docstring-generator.git
cd ai-docstring-generator

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension (requires vsce)
npm install -g vsce
vsce package

# Install the generated .vsix file
code --install-extension ai-docstring-generator-0.1.0.vsix
```

## ⚙️ Configuration


### Azure OpenAI Setup
Add your Azure OpenAI credentials in VS Code settings:

```json
{
  "aiDocstring.azureOpenAI.endpoint": "https://your-resource.openai.azure.com/",
  "aiDocstring.azureOpenAI.apiKey": "your-api-key",
  "aiDocstring.model": "your-deployment-name"
}
```

**Note**: The extension will work without credentials using mock documentation for testing purposes.

## 🎯 Usage


### Commands Available

1. **Generate Docstring at Cursor**
  - Command: `AI Docstring: Generate Docstring at Cursor`
  - Places documentation above the current code element

2. **Generate Docstrings for File**
  - Command: `AI Docstring: Generate Docstrings for File`
  - Processes entire file and adds documentation where missing

3. **Clean Up Duplicate Docstrings**
  - Command: `AI Docstring: Clean Up Duplicate Docstrings`
  - Removes misplaced or duplicate docstrings and formats the file


### How to Use

1. Open a C# file in VS Code
2. Place your cursor on a method, class, property, or interface
3. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
4. Run "AI Docstring: Generate Docstring at Cursor" or "AI Docstring: Generate Docstrings for File"
5. (Optional) Run "AI Docstring: Clean Up Duplicate Docstrings" to tidy up documentation

## 🌍 Language Support

### Currently Supported
- ✅ **C#** - XML documentation comments
  - Classes (including abstract, sealed, static)
  - Methods (including async, generic)
  - Properties
  - Interfaces

### Planned Support
- 🔄 **TypeScript/JavaScript** - JSDoc comments
- 🔄 **Python** - Docstrings
- 🔄 **Java** - Javadoc


## 🏗️ Architecture

The extension consists of several key components:

- **`src/extension.ts`** - VS Code extension entry point and command registration
- **`src/csharpParser.ts`** - Parses C# code to identify documentable elements
- **`src/docstringService.ts`** - Handles AI communication and documentation generation
- **`src/templates.ts`** - Provides language-specific documentation templates


## 🧪 Testing

The project includes unit tests using Mocha and Chai (see the `tests/` directory):

```bash
# Run tests
npm test

# Note: Tests use mocked VS Code API for isolated testing
```
## 📊 Docstring Assessment Feature

The extension can generate a Markdown assessment report of your code's docstring quality, using industry-standard criteria for C# XML documentation. Look for files like `SampleCodeWithoutComments_Assessment.md` in your project root after running the assessment command.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
```bash
# Install dependencies
npm install

# Watch TypeScript files for changes
npm run watch

# Run tests
npm test
```

### Debugging the Extension
1. Open project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test commands in the new VS Code window

### Adding Language Support
To add support for a new language:
1. Create a new parser in `src/parsers/`
2. Add templates in `src/templates.ts`
3. Update the extension to handle the new language

## 🐛 Known Issues

- Parsing complex generic types may miss some edge cases
- Nested classes require cursor to be on the specific class declaration
- No keyboard shortcuts assigned yet

## 📈 Roadmap

### Version 0.2.0
- [ ] Add keyboard shortcuts
- [ ] Support for TypeScript/JavaScript
- [ ] Improved error handling and user feedback
- [ ] Configuration for documentation style preferences

### Version 0.3.0
- [ ] Python support with multiple docstring formats
- [ ] Java support with Javadoc
- [ ] Documentation coverage reporting
- [ ] Bulk operations with progress indicators

### Future Versions
- [ ] Integration with CI/CD pipelines
- [ ] Custom organization style guides
- [ ] Support for more languages (Go, Rust, etc.)
- [ ] Caching for improved performance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/yourusername/vscode-docstring-generator)
- [Issue Tracker](https://github.com/yourusername/vscode-docstring-generator/issues)

---

**Note**: This is a hackathon project from 2025. It requires an Azure OpenAI subscription for full functionality. The extension will use mock responses if no API credentials are configured (for local/test use only).
