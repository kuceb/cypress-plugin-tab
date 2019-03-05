/// <reference types="cypress" />

	namespace Cypress {
		interface Chainable {
			tab(options?: Partial<{shift: Boolean}>): Chainable<Subject>
		}
	}