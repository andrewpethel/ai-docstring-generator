// src/extension.ts
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
            
            // Find the function/method at cursor position
            const codeElement = parser.findElementAtPosition(document, position);
            
            if (!codeElement) {
                vscode.window.showWarningMessage('No function or class found at cursor position');
                return;
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
                    const insertPosition = new vscode.Position(codeElement.line - 1, codeElement.indentation);
                    editBuilder.insert(insertPosition, docstring + '\n');
                });
                
                progress.report({ increment: 100 });
            });
            
            vscode.window.showInformationMessage('Docstring generated successfully!');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate docstring: ${error}`);
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
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating docstrings...",
            cancellable: true
        }, async (progress, token) => {
            for (let i = 0; i < undocumented.length; i++) {
                if (token.isCancellationRequested) {
                    break;
                }
                
                const element = undocumented[i];
                progress.report({ 
                    increment: (100 / undocumented.length),
                    message: `Processing ${element.name} (${i + 1}/${undocumented.length})` 
                });
                
                try {
                    const docstring = await service.generateDocstring(
                        element.code,
                        document.languageId,
                        element.type
                    );
                    
                    await editor.edit(editBuilder => {
                        const insertPosition = new vscode.Position(element.line - 1, element.indentation);
                        editBuilder.insert(insertPosition, docstring + '\n');
                    });
                    
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    console.error(`Failed to generate docstring for ${element.name}: ${error}`);
                }
            }
        });
        
        vscode.window.showInformationMessage(`Generated ${undocumented.length} docstrings!`);
    });
    
    context.subscriptions.push(generateAtCursor, generateForFile);
}

export function deactivate() {}