Don't use "any" type in TypeScript. Instead, use more specific types or generics to ensure type safety and better code maintainability.

naming conventions for files should be consistent throughout the project. Use lowercase letters and hyphens to separate words (e.g., my-file-name.ts).

Less code is better code. Avoid unnecessary complexity and strive for simplicity in your implementations.

Ask for clarity if any requirements or specifications are ambiguous or unclear before proceeding with development.

Types should almost always live with the data they describe. This helps maintain coherence and makes it easier to manage types as the codebase evolves. Even better if we can infer types directly from the data structures themselves.

## Svelte 5 Runes: $effect vs $derived

**CRITICAL:** Do NOT use `$effect` to synchronize state. This is the #1 cause of infinite loops in Svelte 5.

### When to use $derived:
- Computing values based on other reactive state
- Transforming or filtering data
- Any time you're calculating one value from another
- Example: `let doubled = $derived(count * 2);`

### When to use $effect (RARELY):
- Side effects like analytics, logging, or DOM manipulation
- Canvas/WebGL rendering (e.g., Phaser, Three.js)
- Third-party library integration
- **One-time initialization with guards** (e.g., `if (!initialized && data)`)

### Anti-patterns that cause infinite loops:
```typescript
// ❌ WRONG - synchronizing state with $effect
$effect(() => {
  derivedValue = computation($state);  // Creates infinite loop!
});

// ✅ CORRECT - use $derived instead
let derivedValue = $derived(computation($state));
```

**Remember:** If you're reading reactive state and writing to other state, you almost certainly need `$derived` not `$effect`.

After making UI changes, verify the implementation works correctly by using the Playwright MCP browser tools to navigate the application, interact with elements, and take screenshots. This ensures changes behave as expected in the actual browser environment. The server runs on http://localhost:3000