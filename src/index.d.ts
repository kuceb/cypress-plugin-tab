/// <reference types="cypress" />

declare namespace Cypress {
  interface TabCommandOptions {
    /**
     * Whether or not to use the Shift+Tab modifier
     */
    shift?: boolean

    /**
     * Ally.js focusable strategy to use.
     *
     * `quick` - (default) The "quick" strategy uses `document.querySelectorAll` and is able to
     *  find most focusable elements. Elements that are made focusable by way of CSS
     *  properties cannot be queried that way, though.
     *
     * `strict` - The "strict" strategy makes use of `TreeWalker` to "manually" iterate over the DOM. It is slower than "quick".
     *
     * `all` - The "all" strategy will find all the elements that are either focus relevant or only tabbable - including
     *  elements that would be focusable, were they not visually hidden or disabled.
     */
    strategy?: 'quick' | 'strict' | 'all'
  }

  interface Chainable {
    tab(options?: Partial<TabCommandOptions>): Chainable
  }
}
