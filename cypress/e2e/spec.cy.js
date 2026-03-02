/// <reference types="cypress"/>
// @ts-check

describe('form behavior', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/forms.html')
  })

  it('tabs forward through the page', () => {
    cy.get('body').tab().tab().tab().then(beFocused)

    cy.get('.navbar-brand').should(beFocused)
  })

  it('tabs forward from a subject element', () => {
    cy.get('input#search-input').tab().tab().tab()
    cy.get(':nth-child(3) > .bd-toc-link').should(beFocused)
  })

  it('keeps focus on the current activeElement when tab is cancelled on a focused query', () => {
    const events = []
    cy.get('input#search-input').focus().should('have.focus')
    cy.get('input#search-input').then(($input) => {
      $input.on('keydown', (e) => e.preventDefault())
    })
    cy.get('input#search-input').then(($input) => {
      $input.on('focus', (e) => events.push('focus'))
      $input.on('blur', (e) => events.push('blur'))
    })

    cy.get('input#search-input').tab()

    cy.get('input#search-input').should(beFocused)
  })

  it('keeps focus on the subject when tab is cancelled from an unfocused query', () => {
    cy.get('input:first').focus().should('have.focus')

    cy.get('input:first').then(($input) => {
      $input.on('keydown', (e) => e.preventDefault())
    })

    cy.get('input#search-input').tab().should('have.id', 'search-input')

    cy.get('#search-input').should('have.focus')
  })

  it('throws on non-tabbable subject', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('valid focusable element')
      done()
    })

    cy.get('body').tab().tab()
    cy.tab()
    cy.get('header:first').tab()
  })

  it('tabs backward with shift-tab', () => {
    cy.get('body').tab({ shift: true })
    cy.get('a:last').should(beFocused)
  })

  it('selects text in an input', () => {
    cy.get('input#search-input').type('foobar').tab().tab({ shift: true })
    cy.window().then(() => {
      expect(selectedText()).eq('foobar')
    })
  })

  it('tabs forward from the focused element', () => {
    cy.get('#overview > div > .anchorjs-link').focus().tab().tab()

    cy.get('.bd-example form input:first').should(beFocused)
  })

  it('can tab out of a programmatically focused tabindex=-1 element', () => {
    cy.document().then((doc) => {
      doc.body.innerHTML = `
        <button id="before">Before</button>
        <div id="programmatic" tabindex="-1">Programmatic</div>
        <button id="after">After</button>
      `
    })

    cy.get('#programmatic').focus().tab()
    cy.get('#after').should(beFocused)
  })

  it('can shift-tab out of a programmatically focused tabindex=-1 element', () => {
    cy.document().then((doc) => {
      doc.body.innerHTML = `
        <button id="before">Before</button>
        <div id="programmatic" tabindex="-1">Programmatic</div>
        <button id="after">After</button>
      `
    })

    cy.get('#programmatic').focus().tab({ shift: true })
    cy.get('#before').should(beFocused)
  })

  it('stays on the current element when tab is cancelled', () => {
    cy.get('body').should(($el) => {
      return $el.on('keydown', (e) => e.preventDefault())
    })

    cy.get('body').tab().tab().tab()

    cy.get('body').should(beFocused)
  })

  it('yields the activeElement when tab is cancelled', () => {
    cy.get('body').should(($el) => {
      return $el.on('keydown', (e) => e.preventDefault())
    })

    cy.get('body').tab().tab().tab().then(beFocused)

    cy.get('body').should(beFocused)
  })

  it('does not simulate the default tab action when keydown is prevented', () => {
    cy.get('input#search-input').then(($input) => {
      $input.on('keydown', (e) => e.preventDefault())
    })

    cy.get('input#search-input').focus().tab().should('have.id', 'search-input')

    cy.get('input#search-input').should('have.focus')
  })

  it('wraps to the first element when the last element is focused', () => {
    cy.get('a:last').tab()
    cy.get('a:first').should(beFocused)
  })

  it('wraps to the last element on shift-tab from the first element', () => {
    cy.get('a:first').tab({ shift: true })
    cy.get('a:last').should(beFocused)
  })

  describe('events', () => {
    beforeEach(() => {
      cy.document().then((doc) => {
        const keydownStub = cy.stub().as('keydown')
        const keyupStub = cy.stub().as('keyup')

        doc.addEventListener('keydown', keydownStub)
        doc.addEventListener('keyup', keyupStub)
      })
    })

    it('fires a keydown event', () => {
      cy.get('body').tab().tab()
      cy.get('@keydown').should('be.calledTwice')
    })

    it('fires a keyup event', () => {
      cy.get('body').tab().tab()
      cy.get('@keydown').should('be.calledTwice')
    })

    it('waits for requestAnimationFrame before keydown', (done) => {
      let hasTripped = false
      let counter = 0

      cy.$$('body').on('keydown', () => {
        counter++

        if (counter === 1) {
          //@ts-ignore
          cy.state('window').requestAnimationFrame(() => {
            hasTripped = true
          })

          return
        }

        expect(hasTripped).ok
        done()
      })

      cy.get('body').tab().tab()
    })
  })
})

describe('fragment navigation', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/issue63.html')
  })

  it('tabs from the fragment target after clicking a skip link', () => {
    cy.get('#first-input').should('not.be.focused')
    cy.get('#skip-to').click().tab()

    cy.get('#first-input').should('be.focused')
    cy.get('#skip-to').click()
    cy.get('#first-input').should('not.be.focused')
    cy.get('#skipped-button').focus().tab()
    cy.get('#first-input').should('be.focused')

    cy.get('#skip-to').focus().tab()
    cy.get('#skipped-button').should('be.focused')
  })

  it('tabs from the fragment target after clicking a skip link alias', () => {
    cy.get('#first-input').should('not.be.focused')
    cy.get('#skip-to').click().as('hi').tab()
    cy.get('#first-input').should('be.focused')
  })
})

describe('tabindex -1 behavior', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/tabindex.html')
  })

  describe('when focus starts on a tabindex -1 element', () => {
    beforeEach(() => {
      cy.get('#title').focus().should('have.focus')
    })

    it('focuses the content link on tab', () => {
      cy.focused().tab()

      cy.get('#contentLink').should('have.focus')
    })

    it('focuses the skip link on shift-tab', () => {
      cy.focused().tab({ shift: true })

      cy.get('#skipLink').should('have.focus')
    })
  })

  describe('when tab order includes a tabindex -1 element', () => {
    it('skips the tabindex -1 element', () => {
      cy.get('body').tab()

      cy.get('#skipLink').should('have.focus')

      cy.focused().tab()

      cy.get('#contentLink').should('have.focus')
    })
  })
})

describe('subject changes', () => {
  it('follows the current activeElement when tab is chained off an action', () => {
    cy.visit('/cypress/fixtures/auto-advance.html')

    cy.get('#digit-1').type('1234').tab()

    cy.get('#submit').should('have.focus')
  })
})

//@ts-ignore
const beFocused = ($el) => {
  const el = $el[0]
  //@ts-ignore
  const activeElement = cy.state('document').activeElement

  expect(el, 'activeElement').eq(activeElement)
}

const selectedText = () => {
  //@ts-ignore
  const selectedText = cy.state('document').getSelection().toString()

  if (selectedText) return selectedText

  /**
   * @type {HTMLInputElement}
   */
  //@ts-ignore

  const activeElement = cy.state('document').activeElement

  let selectedTextIsValue = false

  try {
    selectedTextIsValue =
      activeElement.selectionStart === 0 &&
      activeElement.selectionEnd === activeElement.value.length
  } finally {
    //
  }

  if (selectedTextIsValue) {
    return activeElement.value
  }

  return ''
}
