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

## Project Vision & Core Principles

### Long-Term Vision
My long term vision is to create a 3d world, kinda like overcooked, where the player picks up samples from the patient, then moves them into the lab and physically loads them into instruments or other equipment. There would be steps which take time to process while running assays, and that's what I'm trying to make sure we account for and build into our current proof of concept. The players could take multiple samples (cases) at the same time since some take time to process. Currently we've set things up so that there's only 1 instance of each "instrument", however that's just to be able to test that each instrument is working. In the future, players will start off with just a single microscope and 1 culture dish. Then they'll be able to purchase new instruments or multple copies of instruments (and place them in a free spot in the 3d world). So I want to prepare for all of that, but for now while we build out the PoC it's fine that we just have 1 of every instrument.

### Current Implementation Guidelines
- **Realistic Instrument Mechanics**: Instruments should have realistic steps (Load -> Process -> Result). Processing takes time, but should NOT block the UI.
- **Non-Blocking "Busy" States**: Instruments run in the background. The player must be free to navigate away and perform other tasks while an instrument is running.
- **Simplicity & Focus**: Avoid unnecessary code. Focus on capturing real scientific challenges, interpretation, and tool usage.
- **Scalable Architecture**: Even if we only have 1 instance of an instrument now, the architecture should support multiple instances in the future.

After every change, see if there is a way to minimize the boilerplate.

Reuse styles from base.css when possible