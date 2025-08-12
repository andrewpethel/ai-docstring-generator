import * as vscode from 'vscode';

export interface CodeElement {
    name: string;
    type: 'class' | 'method' | 'property' | 'interface' | 'enum';
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
            const lineText = document.lineAt(i).text.trim();
            
            // Check for class, interface, or enum
            if (/^(public|private|protected|internal)?\s*(static\s+)?(abstract\s+)?(sealed\s+)?(partial\s+)?(class|interface|enum)\s+\w+/.test(lineText)) {
                const type = lineText.includes('class') ? 'class' : 
                             lineText.includes('interface') ? 'interface' : 'enum';
                
                return {
                    name: this.extractElementName(lineText),
                    type: type,
                    code: this.extractElementCode(document, i, type),
                    line: i,
                    indentation: document.lineAt(i).firstNonWhitespaceCharacterIndex,
                    hasDocstring: this.hasDocstringAbove(document, i)
                };
            }
            
            // Check for method
            if (/^(public|private|protected|internal)?\s*(static\s+)?(virtual\s+)?(override\s+)?(async\s+)?[\w<>[\]]+\s+\w+\s*\(/.test(lineText)) {
                return {
                    name: this.extractMethodName(lineText),
                    type: 'method',
                    code: this.extractElementCode(document, i, 'method'),
                    line: i,
                    indentation: document.lineAt(i).firstNonWhitespaceCharacterIndex,
                    hasDocstring: this.hasDocstringAbove(document, i)
                };
            }
            
            // Check for property
            if (/^(public|private|protected|internal)?\s*(static\s+)?(virtual\s+)?(override\s+)?[\w<>[\]]+\s+\w+\s*{\s*(get|set)/.test(lineText)) {
                return {
                    name: this.extractPropertyName(lineText),
                    type: 'property',
                    code: this.extractElementCode(document, i, 'property'),
                    line: i,
                    indentation: document.lineAt(i).firstNonWhitespaceCharacterIndex,
                    hasDocstring: this.hasDocstringAbove(document, i)
                };
            }
        }
        
        return null;
    }

    findAllElements(document: vscode.TextDocument): CodeElement[] {
        const elements: CodeElement[] = [];
        
        // Find all classes, interfaces, methods, properties and enums
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text.trim();
            
            // Skip empty lines and comments
            if (lineText === '' || lineText.startsWith('//') && !lineText.startsWith('///')) {
                continue;
            }
            
            // Check for class, interface, or enum
            if (/^(public|private|protected|internal)?\s*(static\s+)?(abstract\s+)?(sealed\s+)?(partial\s+)?(class|interface|enum)\s+\w+/.test(lineText)) {
                const type = lineText.includes('class') ? 'class' : 
                             lineText.includes('interface') ? 'interface' : 'enum';
                
                elements.push({
                    name: this.extractElementName(lineText),
                    type: type,
                    code: this.extractElementCode(document, i, type),
                    line: i,
                    indentation: document.lineAt(i).firstNonWhitespaceCharacterIndex,
                    hasDocstring: this.hasDocstringAbove(document, i)
                });
            }
            
            // Check for method (skip interface methods with semicolons)
            if (/^(public|private|protected|internal)?\s*(static\s+)?(virtual\s+)?(override\s+)?(async\s+)?[\w<>[\]]+\s+\w+\s*\(/.test(lineText) && 
                !lineText.trim().endsWith(';')) {
                
                elements.push({
                    name: this.extractMethodName(lineText),
                    type: 'method',
                    code: this.extractElementCode(document, i, 'method'),
                    line: i,
                    indentation: document.lineAt(i).firstNonWhitespaceCharacterIndex,
                    hasDocstring: this.hasDocstringAbove(document, i)
                });
            }
            
            // Check for property
            if (/^(public|private|protected|internal)?\s*(static\s+)?(virtual\s+)?(override\s+)?[\w<>[\]]+\s+\w+\s*{\s*(get|set)/.test(lineText)) {
                elements.push({
                    name: this.extractPropertyName(lineText),
                    type: 'property',
                    code: this.extractElementCode(document, i, 'property'),
                    line: i,
                    indentation: document.lineAt(i).firstNonWhitespaceCharacterIndex,
                    hasDocstring: this.hasDocstringAbove(document, i)
                });
            }
        }
        
        return elements;
    }

    private extractElementName(line: string): string {
        // Extract class, interface, or enum name
        const match = line.match(/(class|interface|enum)\s+(\w+)/);
        return match ? match[2] : 'Unknown';
    }

    private extractMethodName(line: string): string {
        // Extract method name
        const match = line.match(/\s+(\w+)\s*\(/);
        return match ? match[1] : 'Unknown';
    }

    private extractPropertyName(line: string): string {
        // Extract property name
        const match = line.match(/\s+(\w+)\s*{/);
        return match ? match[1] : 'Unknown';
    }

    private extractElementCode(document: vscode.TextDocument, lineNumber: number, type: string): string {
        // Extract a representative code snippet for the element
        const lineText = document.lineAt(lineNumber).text;
        
        if (type === 'method') {
            // For methods, include parameters
            const endOfLine = document.lineAt(lineNumber).range.end;
            const lineCount = document.lineCount;
            
            // Find the end of the method signature
            for (let i = lineNumber; i < lineCount; i++) {
                const line = document.lineAt(i).text;
                if (line.includes(')') && !line.includes('(')) {
                    // Found the closing parenthesis
                    return document.getText(new vscode.Range(
                        new vscode.Position(lineNumber, 0),
                        new vscode.Position(i, line.indexOf(')') + 1)
                    ));
                }
            }
        }
        
        // For other elements, just use the current line
        return lineText;
    }

    private hasDocstringAbove(document: vscode.TextDocument, lineNumber: number): boolean {
        if (lineNumber <= 0) {
            return false;
        }
        
        // Look at lines above for XML comments
        let line = lineNumber - 1;
        
        // Skip blank lines
        while (line >= 0 && document.lineAt(line).text.trim() === '') {
            line--;
        }
        
        if (line < 0) {
            return false;
        }
        
        // Check if the line above is a docstring
        const lineText = document.lineAt(line).text.trim();
        
        // If it's an XML comment (docstring) or ends with a summary tag, there's a docstring
        return lineText.startsWith('///') || 
               lineText.includes('</summary>') || 
               lineText.includes('</param>') || 
               lineText.includes('</returns>');
    }
}