const SELF_CLOSING = [
  'img',
  'br',
  'hr'
]

const JSX_ATTR_ALIAS = {
  'className': 'class'
}

/**
 * Outdent a string based on the first indented line's leading whitespace
 */
function outdent (str) {
  return str.replace(RegExp('^' + (str.match(/^(\t| )+/) || '')[0], 'gm'), '')
}

/**
 * Encode special attribute characters to HTML entities in a String.
 */
function encodeAttr (str) {
  return (str + '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const toAttr = (obj) =>
  Object
    .keys(obj || {})
    .reduce((acc, key) => {
      const value = obj[key]
      if (value == null) return acc

      const attr = JSX_ATTR_ALIAS[key] || key
      return acc + ` ${attr}="${encodeAttr(value)}"`
    }, '')

function createElement (el, props, ...children) {
  const attr = toAttr(props)

  if (SELF_CLOSING.indexOf(el) !== -1) {
    return `<${el}${attr} />`
  }

  return `<${el + attr}>${[].concat(...children).join('')}</${el}>`
}

export {
  createElement,
  toAttr,
  encodeAttr,
  outdent
}
