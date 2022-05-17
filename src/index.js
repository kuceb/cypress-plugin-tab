const inputRegex = /input|select|textarea|button|object/i
const linkRegex = /a|area/i

function isVisible (element) {
  const styles = window.getComputedStyle(element)

  // In theory a parent could have visibility hidden and the child could still
  // have height but not be visible. But for now this works for most cases.
  return (
    styles.visibility !== 'hidden' &&
    styles.display !== 'none' &&
    (element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length)
  )
}

// Based on https://github.com/barneycarroll/tabard/blob/master/es5.js
function getTabbable (target) {
  return Array.from(target.querySelectorAll('*'))
  .filter((element) => {
    const tabbingDisabled = Boolean(element.tabIndex === -1 || element.tabIndex === '-1')
    const tabbingForced = isNaN(parseInt(element.tabIndex, 10))
    const isTabbableInput = Boolean(inputRegex.test(element.tagName) && !element.disabled)
    const isTabbableLink = Boolean(linkRegex.test(element.tagName) && (element.href || element.tabIndex))

    return (
      element !== target && !tabbingDisabled && (tabbingForced || isTabbableInput || isTabbableLink) && isVisible(element)
    )
  })
  .sort((a, b) => {
    return a.tabIndex === b.tabIndex ? 0 : a.tabIndex > b.tabIndex ? 1 : -1
  })
}

const { _, Promise } = Cypress

Cypress.Commands.add('tab', { prevSubject: ['optional', 'element'] }, (subject, opts = {}) => {

  const options = _.defaults({}, opts, {
    shift: false,
  })

  debug('subject:', subject)

  if (subject) {
    return performTab(subject[0], options)
  }

  const win = cy.state('window')
  const activeElement = win.document.activeElement

  return performTab(activeElement, options)

})

const performTab = (el, options) => {

  const doc = el.ownerDocument
  const activeElement = doc.activeElement

  const seq = getTabbable(doc.documentElement)

  let index = seq.indexOf(el)

  if (index === -1) {
    if (el && !(el === doc.body)) {
      pluginError(`
        Subject is not a tabbable element
        - Use cy.get(\'body\').tab() if you wish to tab into the first element on the page
        - Use cy.focused().tab() if you wish to tab into the currently active element
      `)
    }
  }

  debug(seq, index)

  /**
   * @type {HTMLElement}
   */
  const newElm = nextItemFromIndex(index, seq, options.shift)

  const simulatedDefault = () => {
    if (newElm.select) {
      newElm.select()
    }

    return cy.now('focus', cy.$$(newElm))
    // newElm.focus()
    // return newElm
  }

  return new Promise((resolve) => {
    doc.defaultView.requestAnimationFrame(resolve)
  }).then(() => {
  // return Promise.try(() => {
    return keydown(activeElement, options, simulatedDefault, () => doc.activeElement)
  }).finally(() => {
    keyup(activeElement, options)
  })

}

const nextItemFromIndex = (i, seq, reverse) => {
  if (reverse) {
    const nextIndex = i <= 0 ? seq.length - 1 : i - 1

    return seq[nextIndex]
  }

  const nextIndex = i === seq.length - 1 ? 0 : i + 1

  return seq[nextIndex]
}

const tabKeyEventPartial = {
  key: 'Tab',
  code: 'Tab',
  keyCode: 9,
  which: 9,
  charCode: 0,
}

const fireKeyEvent = (type, el, eventOptionsExtend, bubbles = false, cancelable = false) => {
  const win = el.ownerDocument.defaultView

  const eventInit = _.extend({
    bubbles,
    cancelable,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  }, eventOptionsExtend)

  const keyboardEvent = new win.KeyboardEvent(type, eventInit)

  const cancelled = !el.dispatchEvent(keyboardEvent)

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

const debug = function () {
  // console.log(...arguments)
}
