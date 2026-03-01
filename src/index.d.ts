/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      tab(options?: Partial<{ shift: boolean }>): Chainable<Subject>
    }
  }
}

export {}
