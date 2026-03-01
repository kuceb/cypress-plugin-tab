import 'cypress-plugin-tab'

cy.get('body').tab()
cy.get('body').tab().tab().tab()
cy.focused().tab({ shift: true })
cy.get('input').tab().type('next field')

// @ts-expect-error shift must be a boolean
cy.get('body').tab({ shift: 'true' })
