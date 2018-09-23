import createParser from './create-parser'
import { createElement } from './utils'

export { createParser }

export default createParser({
  createElement,
  processResult: (res) => res.join('').trim()
})
