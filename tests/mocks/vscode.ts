// tests/mocks/vscode.ts
export const window = {
    showInformationMessage: () => Promise.resolve(),
    showErrorMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve()
};

export const workspace = {
    getConfiguration: () => ({
        get: (key: string) => undefined
    })
};

export const Uri = {
    file: (path: string) => ({ fsPath: path, scheme: 'file' })
};