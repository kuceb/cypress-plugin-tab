# Release Notes

## 2.0.0

This release updates `cypress-plugin-tab` for Cypress 10+ and drops support for older Cypress project layouts.

### Breaking Changes

- Dropped support for Cypress versions earlier than 10.
- Consumers should use the Cypress 10+ project structure with `cypress.config.js` or `cypress.config.ts`.
- Consumers should load the plugin from `cypress/support/e2e.js` instead of the legacy `cypress/support/index.js`.
- The package now declares Cypress 10+ compatibility via `peerDependencies`.

### Added

- Cypress 10+ project configuration for this repo.
- CI coverage for Cypress 10 and Cypress 15.
- TypeScript compile-time tests for the custom `cy.tab()` command.
- Regression coverage for tabbing out of programmatically focused `tabindex="-1"` elements.

### Fixed

- TypeScript declaration merging for `cy.tab()` in module-based TypeScript setups.
- Tabbing behavior when focus starts on a focusable but non-tabbable element such as `tabindex="-1"`.

### Migration

Install the package:

```bash
npm install -D cypress-plugin-tab
```

Load it from `cypress/support/e2e.js`:

```js
require('cypress-plugin-tab')
```

If your Cypress support file is TypeScript:

```ts
import 'cypress-plugin-tab'
```

If you use TypeScript and want editor support for `cy.tab()`, include the package in your Cypress tsconfig:

```json
{
  "compilerOptions": {
    "types": ["cypress", "cypress-plugin-tab"]
  }
}
```
