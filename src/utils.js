const TABBABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'iframe',
  '[tabindex]',
  '[contenteditable]',
  'audio[controls]',
  'video[controls]',
  'summary',
].join(', ')

const getTabSequence = (doc) => {
  const candidates = Array.from(doc.querySelectorAll(TABBABLE_SELECTOR)).filter(
    isTabbable,
  )
  const positiveTabIndex = candidates
    .filter((el) => getTabIndex(el) > 0)
    .sort(compareByTabOrder)
  const naturalTabOrder = candidates.filter((el) => getTabIndex(el) === 0)

  return positiveTabIndex.concat(naturalTabOrder)
}

const getTabSearchStart = (doc, fallbackEl, options = {}) => {
  const fragmentTarget = options.allowFragmentTarget
    ? getFragmentNavigationTarget(doc, fallbackEl)
    : null

  if (fragmentTarget) {
    return fragmentTarget
  }

  return fallbackEl
}

const findNextTabStop = (el) => {
  const seq = getTabSequence(el.ownerDocument)
  const index = seq.indexOf(el)

  if (index !== -1) {
    return seq[index === seq.length - 1 ? 0 : index + 1]
  }

  const nextIndex = seq.findIndex((candidate) => isAfter(el, candidate))

  return nextIndex === -1 ? seq[0] : seq[nextIndex]
}

const findPreviousTabStop = (el) => {
  const seq = getTabSequence(el.ownerDocument)
  const index = seq.indexOf(el)

  if (index !== -1) {
    return seq[index <= 0 ? seq.length - 1 : index - 1]
  }

  const previousIndex = findPreviousIndex(el, seq)

  return previousIndex === -1 ? seq[seq.length - 1] : seq[previousIndex]
}

const findPreviousIndex = (el, seq) => {
  for (let index = seq.length - 1; index >= 0; index -= 1) {
    if (isBefore(el, seq[index])) {
      return index
    }
  }

  return -1
}

const compareByTabOrder = (left, right) => {
  const tabIndexDiff = getTabIndex(left) - getTabIndex(right)

  if (tabIndexDiff !== 0) {
    return tabIndexDiff
  }

  const { Node } = left.ownerDocument.defaultView
  const position = left.compareDocumentPosition(right)

  if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
    return -1
  }

  if (position & Node.DOCUMENT_POSITION_PRECEDING) {
    return 1
  }

  return 0
}

const isFocusable = (el) => {
  if (!el || el.nodeType !== 1) {
    return false
  }

  if (isDisabled(el) || isHidden(el) || isInert(el)) {
    return false
  }

  if (getTabIndex(el) >= 0) {
    return true
  }

  if (typeof el.focus !== 'function') {
    return false
  }

  const nodeName = el.nodeName.toLowerCase()

  if (nodeName === 'a' || nodeName === 'area') {
    return el.hasAttribute('href')
  }

  if (nodeName === 'input') {
    return el.type !== 'hidden'
  }

  if (nodeName === 'iframe') {
    return true
  }

  if (nodeName === 'audio' || nodeName === 'video') {
    return el.hasAttribute('controls')
  }

  if (nodeName === 'summary') {
    return true
  }

  if (
    nodeName === 'button' ||
    nodeName === 'select' ||
    nodeName === 'textarea'
  ) {
    return true
  }

  return el.hasAttribute('contenteditable')
}

const isTabbable = (el) => {
  if (!isFocusable(el)) {
    return false
  }

  if (isDisabled(el) || isHidden(el) || isInert(el)) {
    return false
  }

  return getTabIndex(el) >= 0
}

const isDisabled = (el) => {
  return 'disabled' in el && Boolean(el.disabled)
}

const isHidden = (el) => {
  if (el.hidden) {
    return true
  }

  const win = el.ownerDocument.defaultView
  const style = win.getComputedStyle(el)

  if (style.visibility === 'hidden' || style.display === 'none') {
    return true
  }

  return el.getClientRects().length === 0
}

const isInert = (el) => {
  return Boolean(el.closest('[inert]'))
}

const getTabIndex = (el) => {
  return typeof el.tabIndex === 'number' ? el.tabIndex : -1
}

const isAfter = (source, candidate) => {
  const { Node } = source.ownerDocument.defaultView
  const position = source.compareDocumentPosition(candidate)

  return Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)
}

const isBefore = (source, candidate) => {
  const { Node } = source.ownerDocument.defaultView
  const position = source.compareDocumentPosition(candidate)

  return Boolean(position & Node.DOCUMENT_POSITION_PRECEDING)
}

const getFragmentNavigationTarget = (doc, el) => {
  if (!doc || !el || el.nodeType !== 1) {
    return null
  }

  if (el.nodeName.toLowerCase() !== 'a') {
    return null
  }

  const href = el.getAttribute('href')

  if (!href || !href.startsWith('#') || href === '#') {
    return null
  }

  const currentHash = doc.location && doc.location.hash

  if (currentHash !== href) {
    return null
  }

  const targetId = href.slice(1)
  const target = doc.getElementById(targetId)

  if (!target || !doc.documentElement.contains(target)) {
    return null
  }

  return target
}

module.exports = {
  findNextTabStop,
  findPreviousTabStop,
  getTabSearchStart,
  getTabSequence,
  isFocusable,
}
