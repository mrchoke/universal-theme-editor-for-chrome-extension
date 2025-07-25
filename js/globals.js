// == GLOBALS & STATE ==
let activeElement = null
let cssRules = {} // Stores all the custom CSS rules. e.g. { ".selector": { "color": "#ff0000" } }
let originalValues = {} // Stores original values for undo
let currentHistory = {} // Stores current session changes for reset
let debugMode = false // Debug mode toggle - default OFF
let elementHierarchy = [] // Store element hierarchy for selection
const HIGHLIGHT_CLASS = 'universal-editor-highlight'

// Debug function
function debugLog (...args) {
  if (debugMode) {
    console.log(...args)
  }
}

// Debug error function
function debugError (...args) {
  if (debugMode) {
    console.error(...args)
  }
}

// Debug warning function
function debugWarn (...args) {
  if (debugMode) {
    console.warn(...args)
  }
}

/**
 * Saves the current state to localStorage
 */
function saveState () {
  try {
    localStorage.setItem('universal-theme-editor-rules', JSON.stringify(cssRules))
    localStorage.setItem('universal-theme-editor-original', JSON.stringify(originalValues))
  } catch (e) {
    debugWarn('Could not save state:', e)
  }
}

/**
 * Loads the saved state from localStorage
 */
function loadState () {
  try {
    const savedRules = localStorage.getItem('universal-theme-editor-rules')
    const savedOriginal = localStorage.getItem('universal-theme-editor-original')

    if (savedRules) {
      cssRules = JSON.parse(savedRules)
      applyAllRules()
    }

    if (savedOriginal) {
      originalValues = JSON.parse(savedOriginal)
    }
  } catch (e) {
    debugWarn('Could not load state:', e)
  }
}

/**
 * Applies all CSS rules to the page
 */
function applyAllRules () {
  let styleEl = document.getElementById('universal-dynamic-styles')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'universal-dynamic-styles'
    document.head.appendChild(styleEl)
  }

  let cssText = ''
  for (const selector in cssRules) {
    cssText += `${selector} {\n`
    for (const property in cssRules[selector]) {
      cssText += `  ${property}: ${cssRules[selector][property]} !important;\n`
    }
    cssText += '}\n'
  }

  styleEl.textContent = cssText
}

/**
 * Generates a CSS selector for a given element.
 * @param {HTMLElement} el The element to generate a selector for.
 * @returns {string} The generated CSS selector.
 */
function generateSelector (el) {
  if (!el) return ''
  if (el.id) {
    return `#${el.id}`
  }

  let parts = []
  let currentEl = el
  while (currentEl.parentElement && currentEl.tagName.toLowerCase() !== 'body') {
    let part = currentEl.tagName.toLowerCase()
    const classes = Array.from(currentEl.classList).filter(c => !c.startsWith('universal-') && c !== 'hover' && c !== 'focus')
    if (classes.length > 0) {
      part += '.' + classes.join('.')
    }

    parts.unshift(part)

    // Stop if we find a parent with an ID
    if (currentEl.parentElement.id) {
      parts.unshift(`#${currentEl.parentElement.id}`)
      break
    }

    // Stop after a few levels to avoid overly specific selectors
    if (parts.length >= 3) break

    currentEl = currentEl.parentElement
  }
  return parts.join(' > ')
}

/**
 * Extracts numeric value from a CSS value string
 * @param {string} value CSS value (e.g., "16px", "1.5em")
 * @returns {number} Numeric part of the value
 */
function extractNumericValue (value) {
  if (!value || value === 'auto' || value === 'none') return 0
  const match = value.toString().match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

/**
 * Checks if an element is an image
 * @param {HTMLElement} el The element to check
 * @returns {boolean} True if the element is an image
 */
function isImageElement (el) {
  return el.tagName.toLowerCase() === 'img' ||
    el.tagName.toLowerCase() === 'svg' ||
    (el.style && el.style.backgroundImage && el.style.backgroundImage !== 'none')
}

/**
 * Detects the user's operating system
 */
function detectOS () {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('mac')) {
    return 'macOS'
  } else if (userAgent.includes('win')) {
    return 'Windows'
  } else if (userAgent.includes('linux')) {
    return 'Linux'
  } else {
    return 'Unknown'
  }
}

/**
 * Gets the appropriate modifier key name for the current OS
 */
function getModifierKeyName () {
  const os = detectOS()
  return os === 'macOS' ? 'Option' : 'Alt'
}
