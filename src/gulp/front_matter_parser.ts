#! node

import * as yaml from 'js-yaml'
import * as toml from 'toml'

const newline = /\r?\n/
const tomlDelim = /^\++\w*$/
const jsonDelim = /^{/
const yamlDelim = /^-+\w*$/

const parser = (contents: string) => {
  const lines = contents.split(newline)
  let index = 0
  let type: string
  let endDelim: RegExp
  for (index = 0; index < lines.length; ++index) {
    if (lines[index].trim().length === 0) {
      continue
    }

    if (tomlDelim.test(lines[index])) {
      type = 'toml'
      endDelim = tomlDelim
      index++
      break
    } else if (yamlDelim.test(lines[index])) {
      type = 'yaml'
      endDelim = yamlDelim
      index++
      break
    } else if (jsonDelim.test(lines[index])) {
      type = 'json'
      endDelim = /^\w*$/  // empty line
      break
    } else {
      // no front matter
      return { frontMatter: {}, contents }
    }
  }

  const frontMatter = []
  for (; index < lines.length; index++) {
    if (endDelim.test(lines[index])) {
      break
    }
    frontMatter.push(lines[index])
  }

  const frontMatterStr = frontMatter.join('\n')
  contents = lines.slice(index + 1).join('\n')

  switch (type) {
    case 'toml':
      try {
        const tomlData = toml.parse(frontMatterStr)
        return { frontMatter: tomlData, contents }
      } catch (e) {
        throw new Error('Parsing error on line ' + e.line + ', column ' + e.column +
                ': ' + e.message)
      }

    case 'json':
      try {
        const jsonData = JSON.parse(frontMatterStr)
        return { frontMatter: jsonData, contents }
      } catch (e) {
        throw new Error('Error parsing JSON: ' + e + '\n\n' + frontMatterStr)
      }

    case 'yaml':
      try {
        const yamlData = yaml.safeLoad(frontMatterStr)
        return { frontMatter: yamlData || {}, contents }
      } catch (e) {
        throw new Error('Error parsing YAML: ' + e + '\n\n' + frontMatterStr)
      }
  }

  throw new Error('uknown front-matter type: ' + type)
}

export default parser
