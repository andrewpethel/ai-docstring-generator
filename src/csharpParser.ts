// src/csharpParser.ts
import * as vscode from 'vscode';

export interface CodeElement {
    name: string;
    type: 'class' | 'method' | 'property' | 'interface';
    code: string;
    line: number;
    indentation: number;
    hasDocstring: boolean;
}

export class CSharpParser {
    findElementAtPosition(document: vscode.TextDocument, position: vscode.Position): CodeElement | null {
        const line = position.line;
        
        // Search upward for method or class declaration
        for (let i = line; i >= 0; i--) {
            const lineText = document.lineAt(i).text;
            const trimmed = lineText.trim();
            
            // Check for method
            const methodMatch = trimmed.match(/^(public|private|protected|internal)?\s*(static)?\s*(async)?\s*[\w<>]+\s+(\w+)\s*\(/);
            if (methodMatch) {
                return this.extractMethod(document, i);
            }
            
            // Check for class
            const classMatch = trimmed.match(/^(public|private|protected|internal)?\s*(static|abstract|sealed)?\s*class\s+(\w+)/);
            if (classMatch) {
                return this.extractClass(document, i);
            }
        }
        
        return null;
    }
    
    findAllElements(document: vscode.TextDocument): CodeElement[] {
        const elements: CodeElement[] = [];
        
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            const trimmed = lineText.trim();
            
            // Skip if already has documentation
            if (i > 0 && document.lineAt(i - 1).text.trim().startsWith('///')) {
                continue;
            }
            
            // Check for various C# constructs
            if (trimmed.match(/^(public|private|protected|internal)?\s*(static|abstract|sealed)?\s*class\s+\w+/)) {
                const element = this.extractClass(document, i);
                if (element) elements.push(element);
            } else if (trimmed.match(/^(public|private|protected|internal)?\s*(static)?\s*(async)?\s*[\w<>]+\s+\w+\s*\(/)) {
                const element = this.extractMethod(document, i);
                if (element) elements.push(element);
            }
        }
        
        return elements;
    }
    
    private extractMethod(document: vscode.TextDocument, startLine: number): CodeElement | null {
        const lines: string[] = [];
        let bracketCount = 0;
        let foundOpenBracket = false;
        
        for (let i = startLine; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            lines.push(line);
            
            for (const char of line) {
                if (char === '{') {
                    bracketCount++;
                    foundOpenBracket = true;
                } else if (char === '}') {
                    bracketCount--;
                }
            }
            
            if (foundOpenBracket && bracketCount === 0) {
                break;
            }
        }
        
        const code = lines.join('\n');
        const firstLine = document.lineAt(startLine).text;
        const methodMatch = firstLine.match(/\s+(\w+)\s*\(/);
        
        return {
            name: methodMatch ? methodMatch[1] : 'Unknown',
            type: 'method',
            code: code,
            line: startLine,
            indentation: firstLine.length - firstLine.trimStart().length,
            hasDocstring: startLine > 0 && document.lineAt(startLine - 1).text.trim().startsWith('///')
        };
    }
    
    private extractClass(document: vscode.TextDocument, startLine: number): CodeElement | null {
        const firstLine = document.lineAt(startLine).text;
        const classMatch = firstLine.match(/class\s+(\w+)/);
        
        // For demo, just get class declaration line
        return {
            name: classMatch ? classMatch[1] : 'Unknown',
            type: 'class',
            code: firstLine,
            line: startLine,
            indentation: firstLine.length - firstLine.trimStart().length,
            hasDocstring: startLine > 0 && document.lineAt(startLine - 1).text.trim().startsWith('///')
        };
    }
}