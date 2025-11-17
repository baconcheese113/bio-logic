Don't use "any" type in TypeScript. Instead, use more specific types or generics to ensure type safety and better code maintainability.
naming conventions for files should be consistent throughout the project. Use lowercase letters and hyphens to separate words (e.g., my-file-name.ts).

Less code is better code. Avoid unnecessary complexity and strive for simplicity in your implementations.

Ask for clarity if any requirements or specifications are ambiguous or unclear before proceeding with development.

Types should almost always live with the data they describe. This helps maintain coherence and makes it easier to manage types as the codebase evolves. Even better if we can infer types directly from the data structures themselves.

After making UI changes, verify the implementation works correctly by using the Playwright MCP browser tools to navigate the application, interact with elements, and take screenshots. This ensures changes behave as expected in the actual browser environment.