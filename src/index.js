const {
  findNextTabStop,
  findPreviousTabStop,
  getTabSearchStart,
  isFocusable,
} = require('./utils')

const { _, Promise } = Cypress

Cypress.Commands.add(
  'tab',
  { prevSubject: ['optional', 'element'] },
  (subject, opts = {}) => {
    const options = _.defaults({}, opts, {
      shift: false,
    })

    if (subject) {
      const doc = subject[0].ownerDocument
      const useActiveElement = shouldFollowFocusFromChain()
      const el = useActiveElement ? doc.activeElement : subject[0]
      const useSubjectAsSearchAnchor =
        useActiveElement && isVirtualTabAnchor(subject[0])
      const searchStart = useSubjectAsSearchAnchor ? subject[0] : el
      const searchOptions = {
        allowFragmentTarget: searchStart !== el,
      }

      return performTab(el, options, searchStart, searchOptions)
    }

    const win = cy.state('window')
    const activeElement = win.document.activeElement

    return performTab(activeElement, options, activeElement)
  },
)

const performTab = (el, options, searchAnchor = el, searchOptions = {}) => {
  const doc = el.ownerDocument
  const activeElement = ensureFocused(el)
  const searchStart = getTabSearchStart(doc, searchAnchor, searchOptions)
  const newElm = options.shift
    ? findPreviousTabStop(searchStart)
    : findNextTabStop(searchStart)
  const isTabbable = newElm ? true : isFocusable(el)

  if (!isTabbable && el && !(el === doc.body)) {
    pluginError(`
      Subject is not a tabbable or focusable element
      - Use cy.get(\'body\').tab() if you wish to tab into the first element on the page
      - Use cy.focused().tab() if you wish to tab into the currently active element
    `)
  }

  const simulatedDefault = () => {
    if (newElm && newElm.select) {
      newElm.select()
    }

    return cy.now('focus', cy.$$(newElm))
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(resolve)
  })
    .then(() => {
      return keydown(activeElement, options, simulatedDefault, () =>
        ensureFocused(activeElement),
      )
    })
    .finally(() => {
      keyup(activeElement, options)
    })
}

const ensureFocused = (el) => {
  if (el.ownerDocument.activeElement === el) {
    return el
  }

  if (typeof el.focus === 'function') {
    el.focus()
  }

  if (el.ownerDocument.activeElement !== el) {
    cy.now('focus', cy.$$(el))
  }

  return el
}

const shouldFollowFocusFromChain = () => {
  const current = cy.state('current')

  if (!current || typeof current.get !== 'function') {
    return false
  }

  const chainerId = current.get('chainerId')
  let command = current.get('prev')

  while (command && typeof command.get === 'function') {
    if (
      command.get('chainerId') !== chainerId ||
      command.get('type') === 'parent'
    ) {
      break
    }

    if (!command.get('query')) {
      return true
    }

    command = command.get('prev')
  }

  return false
}

const isVirtualTabAnchor = (el) => {
  if (!el || el.nodeType !== 1 || el.nodeName.toLowerCase() !== 'a') {
    return false
  }

  const href = el.getAttribute('href')
  const doc = el.ownerDocument

  return Boolean(
    href && href.startsWith('#') && href !== '#' && doc.location.hash === href,
  )
}

const tabKeyEventPartial = {
  key: 'Tab',
  code: 'Tab',
  keyCode: 9,
  which: 9,
  charCode: 0,
}

const fireKeyEvent = (
  type,
  el,
  eventOptionsExtend,
  bubbles = false,
  cancelable = false,
) => {
  const win = el.ownerDocument.defaultView

  const eventInit = _.extend(
    {
      bubbles,
      cancelable,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    },
    eventOptionsExtend,
  )

  const keyboardEvent = new win.KeyboardEvent(type, eventInit)

  const cancelled =
    !el.dispatchEvent(keyboardEvent) || keyboardEvent.defaultPrevented

  return cancelled
}

const keydown = (el, options, onSucceed, onCancel) => {
  const eventOptions = _.extend({}, tabKeyEventPartial, {
    shiftKey: options.shift,
  })

  const cancelled = fireKeyEvent('keydown', el, eventOptions, true, true)

  if (cancelled) {
    return onCancel()
  }

  return onSucceed()
}

const keyup = (el, options) => {
  const eventOptions = _.extend({}, tabKeyEventPartial, {
    shiftKey: options.shift,
  })

  return fireKeyEvent('keyup', el, eventOptions, true, false)
}

const pluginError = (mes) => {
  throw new Error(`[cypress-plugin-tab]: ${mes}`)
}
