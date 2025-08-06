// src/templates.ts
export interface Template {
    example: string;
    description?: string;
}

export function getTemplate(language: string, elementType: string): Template {
    if (language === 'csharp') {
        switch (elementType) {
            case 'method':
                return {
                    example: `/// <summary>
/// Brief description of what the method does.
/// </summary>
/// <param name="paramName">Description of parameter.</param>
/// <returns>Description of return value.</returns>
/// <exception cref="ExceptionType">When this exception is thrown.</exception>`,
                    description: 'C# XML documentation for methods'
                };
            
            case 'class':
                return {
                    example: `/// <summary>
/// Brief description of the class and its purpose.
/// </summary>`,
                    description: 'C# XML documentation for classes'
                };
            
            case 'property':
                return {
                    example: `/// <summary>
/// Gets or sets the property description.
/// </summary>`,
                    description: 'C# XML documentation for properties'
                };
            
            case 'interface':
                return {
                    example: `/// <summary>
/// Defines the contract for interface purpose.
/// </summary>`,
                    description: 'C# XML documentation for interfaces'
                };
            
            default:
                return {
                    example: `/// <summary>
/// TODO: Add description.
/// </summary>`,
                    description: 'Default C# XML documentation'
                };
        }
    }
    
    // Add support for other languages in the future
    return {
        example: '// TODO: Add documentation',
        description: 'Generic documentation comment'
    };
}