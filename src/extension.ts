import * as vscode from 'vscode';
import { DocstringService } from './docstringService';
import { CSharpParser } from './csharpParser';

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Docstring Generator is now active!');

    const service = new DocstringService(context);
    const parser = new CSharpParser();

    // Command: Generate docstring for current function/method
    let generateAtCursor = vscode.commands.registerCommand('aiDocstring.generateAtCursor', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        try {
            const position = editor.selection.active;
            const document = editor.document;
            const languageId = document.languageId;

            // Check if language is supported
            if (!['csharp', 'python', 'typescript'].includes(languageId)) {
                vscode.window.showWarningMessage(`Language '${languageId}' is not supported`);
                return;
            }

            // Find the function/method at cursor position
            const codeElement = parser.findElementAtPosition(document, position);

            if (!codeElement) {
                vscode.window.showWarningMessage('No function or class found at cursor position');
                return;
            }

            if (codeElement.hasDocstring) {
                const choice = await vscode.window.showInformationMessage(
                    'This element already has a docstring. Do you want to replace it?',
                    'Yes', 'No'
                );
                
                if (choice !== 'Yes') {
                    return;
                }
                
                // Will need to remove existing docstring
                await removeExistingDocstring(editor, codeElement.line);
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating AI docstring...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Generate docstring
                const docstring = await service.generateDocstring(
                    codeElement.code,
                    languageId,
                    codeElement.type
                );

                progress.report({ increment: 50 });

                // Insert the docstring
                await editor.edit(editBuilder => {
                    const insertPosition = new vscode.Position(codeElement.line, 0);
                    const elementLine = document.lineAt(codeElement.line);
                    const indentMatch = elementLine.text.match(/^(\s*)/);
                    const indent = indentMatch ? indentMatch[1] : '';
                    
                    // Format the docstring with proper indentation
                    const formattedDocstring = docstring
                        .split('\n')
                        .map(line => indent + line)
                        .join('\n') + '\n';
                    
                    editBuilder.insert(insertPosition, formattedDocstring);
                });

                progress.report({ increment: 100 });
            });

            vscode.window.showInformationMessage('Docstring generated successfully!');

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate docstring: ${error}`);
            console.error('Error generating docstring:', error);
        }
    });

    // Command: Generate docstrings for entire file
    let generateForFile = vscode.commands.registerCommand('aiDocstring.generateForFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const languageId = document.languageId;

        // Check if language is supported
        if (!['csharp', 'python', 'typescript'].includes(languageId)) {
            vscode.window.showWarningMessage(`Language '${languageId}' is not supported`);
            return;
        }

        const elements = parser.findAllElements(document);
        const undocumented = elements.filter(e => !e.hasDocstring);

        if (undocumented.length === 0) {
            vscode.window.showInformationMessage('All elements are already documented!');
            return;
        }

        const choice = await vscode.window.showInformationMessage(
            `Found ${undocumented.length} undocumented elements. Generate docstrings for all?`,
            'Yes', 'No'
        );

        if (choice !== 'Yes') {
            return;
        }

        // Process in reverse order (bottom-to-top) to avoid line number shifts
        const sortedElements = undocumented.sort((a, b) => b.line - a.line);
        let successCount = 0;
        let failCount = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating docstrings...",
            cancellable: true
        }, async (progress, token) => {
            // Generate all docstrings first
            const docstringsToInsert: { element: any, docstring: string }[] = [];
            
            for (let i = 0; i < sortedElements.length; i++) {
                if (token.isCancellationRequested) {
                    break;
                }

                const element = sortedElements[i];
                progress.report({
                    increment: (50 / sortedElements.length),
                    message: `Generating for ${element.name} (${i + 1}/${sortedElements.length})`
                });

                try {
                    const docstring = await service.generateDocstring(
                        element.code,
                        languageId,
                        element.type
                    );
                    
                    docstringsToInsert.push({ element, docstring });
                    
                } catch (error) {
                    failCount++;
                    console.error(`Failed to generate docstring for ${element.name}:`, error);
                }
            }
            
            // Now insert all docstrings in a single edit operation
            if (docstringsToInsert.length > 0) {
                const success = await editor.edit(editBuilder => {
                    for (const { element, docstring } of docstringsToInsert) {
                        const insertPosition = new vscode.Position(element.line, 0);
                        const line = document.lineAt(element.line);
                        const indentMatch = line.text.match(/^(\s*)/);
                        const indent = indentMatch ? indentMatch[1] : '';

                        // Format the docstring with proper indentation
                        const formattedDocstring = docstring
                            .split('\n')
                            .map(line => indent + line)
                            .join('\n') + '\n';

                        editBuilder.insert(insertPosition, formattedDocstring);
                        
                        progress.report({
                            increment: (50 / docstringsToInsert.length),
                            message: `Inserting for ${element.name}`
                        });
                    }
                });

                if (success) {
                    successCount = docstringsToInsert.length;
                } else {
                    failCount += docstringsToInsert.length;
                }
            }
        });

        const message = failCount > 0 
            ? `Generated ${successCount} docstrings successfully. ${failCount} failed.`
            : `Generated ${successCount} docstrings successfully!`;
        
        vscode.window.showInformationMessage(message);
    });

    // Command: Clean up duplicate docstrings
    let cleanupDocstrings = vscode.commands.registerCommand('aiDocstring.cleanup', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const lines = text.split('\n');
        const cleanedLines: string[] = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            // Check if this is a docstring line
            if (trimmed.startsWith('///')) {
                // Collect all consecutive docstring lines
                const docstringLines: string[] = [];
                let j = i;
                
                while (j < lines.length && lines[j].trim().startsWith('///')) {
                    docstringLines.push(lines[j]);
                    j++;
                }

                // Look ahead to find what this docstring should document
                let nextCodeLineIndex = j;
                while (nextCodeLineIndex < lines.length && lines[nextCodeLineIndex].trim() === '') {
                    nextCodeLineIndex++;
                }

                if (nextCodeLineIndex < lines.length) {
                    const nextLine = lines[nextCodeLineIndex].trim();
                    
                    // Check if next line is a code element that should have documentation
                    const isCodeElement = 
                        // Classes, interfaces, enums
                        /^(public|private|protected|internal)?\s*(static\s+)?(partial\s+)?(abstract\s+)?(sealed\s+)?(class|interface|enum)\s+\w+/.test(nextLine) ||
                        // Methods (not interface methods with semicolons)
                        (/^(public|private|protected|internal)?\s*(static\s+)?(async\s+)?(override\s+)?(virtual\s+)?[\w<>\[\]]+\s+\w+\s*\(/.test(nextLine) && !nextLine.endsWith(';')) ||
                        // Properties
                        /^(public|private|protected|internal)?\s*(static\s+)?(virtual\s+)?(override\s+)?[\w<>\[\]]+\s+\w+\s*{/.test(nextLine);

                    if (isCodeElement) {
                        // Keep the docstring and add any blank lines between it and the code
                        cleanedLines.push(...docstringLines);
                        for (let k = j; k < nextCodeLineIndex; k++) {
                            cleanedLines.push(lines[k]);
                        }
                        i = nextCodeLineIndex;
                        continue;
                    }
                }

                // Skip this misplaced docstring
                i = j;
            } else {
                cleanedLines.push(line);
                i++;
            }
        }

        // Apply the changes
        await editor.edit(editBuilder => {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            editBuilder.replace(fullRange, cleanedLines.join('\n'));
        });

        // Format the document after cleanup
        await vscode.commands.executeCommand('editor.action.formatDocument');
        
        vscode.window.showInformationMessage('Cleaned up misplaced docstrings and formatted document');
    });

    // Helper function to remove existing docstring
    async function removeExistingDocstring(editor: vscode.TextEditor, elementLine: number): Promise<boolean> {
        const document = editor.document;
        
        // Look above the element for docstring lines
        let startLine = elementLine - 1;
        while (startLine >= 0 && document.lineAt(startLine).text.trim() === '') {
            startLine--;
        }
        
        if (startLine < 0 || !document.lineAt(startLine).text.trim().startsWith('///')) {
            return false; // No docstring found
        }
        
        // Find the first line of the docstring
        let firstLine = startLine;
        while (firstLine > 0 && document.lineAt(firstLine - 1).text.trim().startsWith('///')) {
            firstLine--;
        }
        
        // Delete the entire docstring
        return await editor.edit(editBuilder => {
            editBuilder.delete(new vscode.Range(
                new vscode.Position(firstLine, 0),
                new vscode.Position(startLine + 1, 0)
            ));
        });
    }

    context.subscriptions.push(generateAtCursor, generateForFile, cleanupDocstrings);
}

export function deactivate() {
    console.log('AI Docstring Generator deactivated');
}