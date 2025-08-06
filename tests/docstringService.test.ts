import { expect } from 'chai';
import * as path from 'path';
// import * as vscode from 'vscode';

import proxyquire from 'proxyquire';

// Create vscode mock
const vscodeMock = {
    window: {
        showInformationMessage: () => Promise.resolve(),
        showErrorMessage: () => Promise.resolve(),
        showWarningMessage: () => Promise.resolve()
    },
    workspace: {
        getConfiguration: (section: string) => ({
            get: (key: string) => {
                // Return test values for your configuration
                if (key === 'azureOpenAI.endpoint') return undefined;
                if (key === 'azureOpenAI.apiKey') return undefined;
                if (key === 'azureOpenAI.deploymentName') return 'gpt-4';
                if (key === 'model') return 'gpt-4';
                return undefined;
            }
        })
    },
    Uri: {
        file: (filePath: string) => ({ fsPath: filePath, scheme: 'file' })
    },
    ExtensionContext: {},  // Add this since you use it as a type
    '@noCallThru': true
};

// Import DocstringService with mocked vscode
const { DocstringService } = proxyquire('../src/docstringService', {
    'vscode': {
        ...vscodeMock,
        '@noCallThru': true  // This prevents proxyquire from trying to load the real vscode
    }
});

describe('DocstringService', () => {
    let service: any;

    before(() => {
        const context = {
            globalState: {},
            workspaceState: {},
            subscriptions: [],
            extensionPath: '',
            asAbsolutePath: (relativePath: string) => relativePath,
            storagePath: '',
            globalStoragePath: '',
            logPath: '',
            extension: {},
            extensionUri: {},
            environmentVariableCollection: {},
            languageModelAccessInformation: {},
            extensionMode: 1,
            storageUri: undefined,
            globalStorageUri: vscodeMock.Uri.file(''),
            logUri: vscodeMock.Uri.file(''),
            secrets: {}
        };
        
        service = new DocstringService(context);
    });

    it('should return a mock docstring if no API key is set', async () => {
        const code = 'public void HelloWorld() { }';
        const language = 'csharp';
        const elementType = 'method';
        const docstring = await service.generateDocstring(code, language, elementType);
        expect(docstring).to.be.a('string');
        expect(docstring.length).to.be.greaterThan(0);
    });
});

// import { DocstringService } from '../src/docstringService';
// import * as vscode from 'vscode';

// describe('DocstringService', () => {
//     let context: vscode.ExtensionContext;
//     let service: DocstringService;

//     before(() => {
//         // Mock context for testing
//         context = {
//             globalState: {} as any,
//             workspaceState: {} as any,
//             subscriptions: [],
//             extensionPath: '',
//             asAbsolutePath: (relativePath: string) => relativePath,
//             storagePath: '',
//             globalStoragePath: '',
//             logPath: '',
//             extension: {} as any,
//             extensionUri: {} as any,
//             environmentVariableCollection: {} as any,
//             languageModelAccessInformation: {} as any,
//             extensionMode: 1,
//             storageUri: undefined,
//             globalStorageUri: vscode.Uri.file(''),
//             logUri: vscode.Uri.file(''),
//             secrets: {} as any
//         };
//         service = new DocstringService(context);
//     });

//     it('should return a mock docstring if no API key is set', async () => {
//         const code = 'public void HelloWorld() { }';
//         const language = 'csharp';
//         const elementType = 'method';
//         const docstring = await service.generateDocstring(code, language, elementType);
//         expect(docstring).to.be.a('string');
//         expect(docstring.length).to.be.greaterThan(0);
//     });
// });
