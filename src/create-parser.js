import {
  outdent,
  encodeAttr
} from './utils'

const TAGS = {
  '': ['<em>', '</em>'],
  _: ['<strong>', '</strong>'],
  '~': ['<s>', '</s>'],
  '\n': ['<br />'],
  ' ': ['<br />'],
  '-': ['<hr />']
}

/** Parse Markdown into an HTML String. */
export default ({
  createElement: h,
  processResult
} = {}) => function parse (md, prevLinks) {
  const tokenizer = /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^``` *(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:!\[([^\]]*?)\]\(([^)]+?)\))|(\[)|(\](?:\(([^)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,6})\s*(.+)(?:\n+|$))|(?:`([^`].*?)`)|( {2}\n\n*|\n{2,}|__|\*\*|[_*]|~~)/gm

  const links = prevLinks || {}
  const context = []
  const result = []

  function tag (token) {
    const desc = TAGS[token.replace(/\*/g, '_')[1] || '']

    if (!desc) return token
    if (!desc[1]) return desc[0]

    const end = (context[context.length - 1] === token)
    context[end ? 'pop' : 'push'](token)
    return desc[end | 0]
  }

  function flush () {
    let str = ''
    while (context.length) str += tag(context[context.length - 1])
    return str
  }

  md = md.replace(/^\[(.+?)\]:\s*(.+)$/gm, (s, name, url) => {
    links[name.toLowerCase()] = url
    return ''
  }).replace(/^\n+|\n+$/g, '')

  let last = 0
  let token
  while ((token = tokenizer.exec(md))) {
    let prev = md.substring(last, token.index)
    let chunk = token[0]
    last = tokenizer.lastIndex

    if (prev.match(/[^\\](\\\\)*\\$/)) {
      // escaped
      // Code/Indent blocks:
    } else if (token[3] || token[4]) {
      chunk = h(
        'pre',
        { className: `code ${(token[4] ? `poetry` : token[2].toLowerCase())}` },
        outdent(encodeAttr(token[3] || token[4]).replace(/^\n+|\n+$/g, ''))
      )

      // > Quotes, -* lists:
    } else if (token[6]) {
      let element = token[6]

      if (element.match(/\./)) {
        token[5] = token[5].replace(/^\d+/gm, '')
      }

      let inner = parse(outdent(token[5].replace(/^\s*[>*+.-]/gm, '')))

      if (element === '>') {
        element = 'blockquote'
      } else {
        element = element.match(/\./) ? 'ol' : 'ul'
        inner = inner.split(/\n/gm).map((content) => h('li', null, content))
      }

      chunk = h(element, null, inner)

      // Images:
    } else if (token[8]) {
      chunk = h('img', { src: token[8], alt: token[7] })

      // Links:
    } else if (token[9]) {
      chunk = '<a>'
    } else if (token[10]) {
      const start = result.indexOf('<a>')
      const content = result.splice(start).splice(1).concat(prev, flush())
      chunk = h('a', { href: token[11] || links[prev.toLowerCase()] }, ...content)
      prev = ''

      // Headings:
    } else if (token[12] || token[14]) {
      const element = 'h' + (token[14] ? token[14].length : (token[13][0] === '=' ? 1 : 2))
      chunk = h(element, null, parse(token[12] || token[15], links))

      // `code`:
    } else if (token[16]) {
      chunk = h('code', null, encodeAttr(token[16]))

      // Inline formatting: *em*, **strong** & friends
    } else if (token[17] || token[1]) {
      chunk = tag(token[17] || '--')
    }

    result.push(prev)
    result.push(chunk)
  }

  return processResult(result.concat(md.substring(last), flush()))
}
