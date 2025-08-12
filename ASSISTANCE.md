````markdown
# AI Docstring Generator - Troubleshooting Guide

## Clearing VS Code Extension Cache (PowerShell)

```powershell
# Close all VS Code instances first!
Get-Process code -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear extension cache on Windows
Remove-Item "$env:USERPROFILE\.vscode\extensions\ai-docstring-generator*" -Recurse -Force -ErrorAction SilentlyContinue

# Also clear the VS Code extension database cache
Remove-Item "$env:APPDATA\Code\User\globalStorage\state.vscdb" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:APPDATA\Code\User\globalStorage\state.vscdb.backup" -Force -ErrorAction SilentlyContinue

# Clear any development extension host cache
Remove-Item "$env:APPDATA\Code\User\workspaceStorage" -Recurse -Force -ErrorAction SilentlyContinue
```

## Complete Fix Process

### 1. Clean Everything

```powershell
# Clean build output
Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue

# Clean node_modules (optional but recommended)
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
npm install
```

### 2. Verify TypeScript Configuration

```powershell
Get-Content tsconfig.json
```

### 3. Rebuild

```powershell
npm run compile

# Verify the output structure
Get-ChildItem -Path "out" -Recurse
```

### 4. Check Main File Exists

```powershell
# This should show the file if it exists
Test-Path "out\src\extension.js"
Get-Item "out\src\extension.js" -ErrorAction SilentlyContinue
```

### 5. Package Extension

```powershell
vsce package --verbose
```

### 6. Install Fresh

```powershell
# Make sure VS Code is completely closed
Get-Process code -ErrorAction SilentlyContinue | Stop-Process -Force

# Uninstall any existing version
code --uninstall-extension ai-docstring-generator

# Install the new package
code --install-extension ai-docstring-generator-0.1.0.vsix --verbose
```

### 7. Check Extension Host Log

1. Open VS Code
2. Go to `View > Output`
3. Select "Extension Host" from the dropdown
4. Look for any errors related to your extension

## Alternative: Run in Extension Development Host

1. Open your project in VS Code
2. Press `F5` to launch a new VS Code window with your extension loaded
3. Open the Command Palette (`Ctrl+Shift+P`) and try your commands
4. Check the Debug Console for any errors

## Additional PowerShell Diagnostic Commands

```powershell
# Check if all required files exist
@("package.json", "tsconfig.json", "out\src\extension.js") | ForEach-Object {
    "$_ exists: $(Test-Path $_)"
}

# List all compiled files
Get-ChildItem -Path "out" -Filter "*.js" -Recurse | Select-Object FullName
```

## Common Issues and Solutions

### Issue: "command 'aiDocstring.generateForFile' not found"

**Cause**: Extension failed to activate properly

**Solution**:
1. Check Extension Host output for activation errors
2. Verify all dependencies are installed
3. Ensure TypeScript compilation succeeded
4. Check that `out/src/extension.js` exists

### Issue: V8 Fatal Error During Installation

**Cause**: Corrupted package or system-level Node.js issue

**Solution**:
1. Clear all caches (see above)
2. Rebuild from clean state
3. Check for malformed JSON files
4. Verify Node.js version compatibility

### Issue: Extension Activates but Commands Don't Work

**Cause**: Runtime errors in extension code

**Solution**:
1. Run in Extension Development Host (F5)
2. Check Debug Console for errors
3. Add try-catch blocks to activation function
4. Verify all imports resolve correctly

## Build and Deployment Checklist

- [ ] All TypeScript files compile without errors
- [ ] `out/src/extension.js` exists after compilation
- [ ] `package.json` main field points to correct file
- [ ] `.vscodeignore` includes `!out/**` to ensure compiled files are packaged
- [ ] All dependencies listed in `package.json` are installed
- [ ] Extension activates without errors in development host
- [ ] Commands appear in Command Palette
- [ ] VSIX package builds successfully
- [ ] Extension installs without V8 errors

## Quick Recovery Script

```powershell
# Complete clean and rebuild
Get-Process code -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Path @("out", "node_modules", "*.vsix") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.vscode\extensions\ai-docstring-generator*" -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run compile
vsce package
code --install-extension ai-