// src/docstringService.ts
import * as vscode from 'vscode';
import { AzureOpenAI } from 'openai';
import { getTemplate } from './templates';

export class DocstringService {
    private client: AzureOpenAI | null = null;
    private context: vscode.ExtensionContext;
    private deploymentName: string = 'gpt-4';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.initializeClient();
    }

    private initializeClient() {
        const config = vscode.workspace.getConfiguration('aiDocstring');
        const endpoint = config.get<string>('azureOpenAI.endpoint');
        const apiKey = config.get<string>('azureOpenAI.apiKey');
        this.deploymentName = config.get<string>('model') || 'gpt-4';

        if (endpoint && apiKey) {
            // Make sure the endpoint ends with a slash
            const normalizedEndpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
            
            this.client = new AzureOpenAI({
                endpoint: normalizedEndpoint,
                apiKey: apiKey,
                apiVersion: "2024-02-01",
                deployment: this.deploymentName
            });
        } else {
            console.warn('Azure OpenAI endpoint and API key not configured. Using mock responses.');
        }
    }

    async generateDocstring(
        code: string,
        language: string,
        elementType: string
    ): Promise<string> {
        if (!this.client) {
            // For demo purposes, return a mock response if no API key
            return this.getMockDocstring(code, language, elementType);
        }

        const prompt = this.buildPrompt(code, language, elementType);

        try {
            const result = await this.client.chat.completions.create({
                model: this.deploymentName,
                messages: [
                    {
                        role: "system",
                        content: "You are a documentation expert. Generate clear, concise docstrings following Microsoft's style guidelines."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            });

            const docstring = result.choices[0].message?.content || '';
            return this.formatDocstring(docstring, language);

        } catch (error) {
            console.error('Failed to generate docstring:', error);
            throw error;
        }
    }

    private buildPrompt(code: string, language: string, elementType: string): string {
        const template = getTemplate(language, elementType);

        return `Generate a ${language} docstring for this ${elementType}:

${code}

Use this format:
${template.example}

Requirements:
- Write a clear, concise summary
- Document all parameters with types and descriptions
- Document the return value
- Include any exceptions that might be thrown
- Follow Microsoft style guidelines
- Be accurate and helpful

Return only the docstring, no additional text.`;
    }

    private formatDocstring(docstring: string, language: string): string {
        // Clean up any markdown formatting from the AI response
        let cleaned = docstring.trim();

        // Remove code block markers if present
        cleaned = cleaned.replace(/^```[a-z]*\n?/, '');
        cleaned = cleaned.replace(/\n?```$/, '');

        // Ensure proper indentation will be handled by the editor
        return cleaned;
    }

    // Mock response for demo without API key
    private getMockDocstring(code: string, language: string, elementType: string): string {
        if (language === 'csharp') {
            if (elementType === 'method') {
                return `/// <summary>
        /// Processes the specified data and returns the result.
        /// </summary>
        /// <param name="input">The input data to process.</param>
        /// <returns>The processed result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when input is null.</exception>`;
            } else if (elementType === 'class') {
                return `/// <summary>
        /// Represents a service for handling core business logic.
        /// </summary>`;
            }
        }

        return '// TODO: Add documentation';
    }
}