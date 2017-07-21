
import * as path from 'path'
import { Transform } from 'stream'
import * as zlib from 'zlib'

import * as chalk from 'chalk'
import * as fs from 'fs-extra'
import * as JSONStream from 'JSONStream'
import * as levelup from 'levelup'
import * as marked from 'marked'
import * as memdown from 'memdown'
import * as striptags from 'striptags'
import * as toml from 'toml'
import * as File from 'vinyl'

import parser from './front_matter_parser'

/*
{ languageCode: 'en-us',
  baseURL: 'https://cru-albania-ds.gitlab.io/',
  theme: 'hugo-code-editor-theme',
  title: 'Digital Strategies - Albania',
  copyright: 'This web page is Copyright CRU, 2017',
  author: { name: 'Digital Strategies, CRU Albania' },
  params:
   { author: 'Albania Digital Strategies',
     locale: 'en-US',
     gitlab: 'cru-albania-ds',
     gitlab_api_token: 'QZz3h5a7LSR-WWetU18x',
     mailchimp: '//gordonburgett.us11.list-manage.com/subscribe/post?u=fbcbfba66020e12dd41b9cf1b&amp;id=7153a2604f' },
  Languages:
   { en:
      { languageName: 'English',
        title: 'Digital Strategies - Albania',
        weight: 1 },
     sq:
      { languageName: 'Shqip',
        title: 'Strategji Digjitale - Shqipëria',
        weight: 2 } } }
 */
interface IHugoConfig {
  languageCode?: string,
  baseUrl?: string,
  theme?: string,
  title?: string,
  copyright?: string,
  author?: { name?: string, [key: string]: any },
  params?: {
    [key: string]: any,
  },
  languages?: {
    [language: string]: {
      languageName: string,
      title: string,
      weight: number,
    },
  },

  [key: string]: any
}

const hugoConfig: IHugoConfig = toml.parse(fs.readFileSync('./config.toml').toString())

interface IHugoDoc {
  id: string,
  relativeUrl?: string,
  date?: string,
  lang?: string,
  title?: string,
  categories?: string[],
  tags?: string[]
  author?: string[]
  body?: string

  [key: string]: any
}

const hugoize = (doc: IHugoDoc) => {
  /*
  { id: 'post/2017-04-18_hosting_php_server_tutorial.md',
  date: '2017-04-18T14:00:00+02:00',
  title: 'Hosting a PHP application',
  categories: ["tutorials"],
  tags: ["lamp", "php", "hapitjeter"],
  author: 'gordon',
  body: '+++\ndate = "2017-04-18T14:00:00+02:00"\ntitle =...
  */

  // doc to link
  if (doc.id) {
    const loc = path.parse(doc.id)

    loc.base = path.basename(loc.base, loc.ext)
    loc.ext = ''  // replace .md with null - no .html

      // ensure '.sq.md' files are written with '/sq/' in front
    let lang = path.extname(loc.base)
    if (lang && hugoConfig.Languages[lang.slice(1)]) {
      loc.base = path.basename(loc.base, lang)

      lang = lang.slice(1)
      loc.dir = path.join(lang, loc.dir)
    }

     // add lang to doc
    doc.lang = lang || 'en'

      // handle index
    if (loc.base === '_index') {
      loc.name = ''
      loc.base = ''
    }

      // not a relative path, absolute from domain
    loc.dir = '/' + loc.dir

    doc.relativeUrl = path.format(loc)
  }

  // de-capitalize front-matter keys like Tags, Categories, Description, etc. for better searching later
  for (const k in doc) {
    if (!doc.hasOwnProperty(k)) {
      continue
    }
    const lowerk = k.toLowerCase()
    if (lowerk !== k) {
      doc[lowerk] = doc[k]
      delete(doc[k])
    }
  }

  return doc
}

const buildDocument = () => new Transform({
  objectMode: true,

  transform(obj: any, encoding, callback) {
    const file = obj as File
    try {
      let doc: IHugoDoc = {
        id: file.relative,
      }

      let data: string
      if (file.isBuffer()) {
        data = file.contents.toString(encoding)
      } else if (file.isStream()) {
        data = fs.readFileSync(file.path).toString()
      } else {
        callback(new Error('uknown file type: ' + file))
        return
      }

      const { frontMatter, contents } = parser(data)
      if (frontMatter) {
        Object.assign(doc, frontMatter)
      }

        // process the markdown then strip out the tags to get the raw text content
      doc.body = striptags(marked(contents))

      doc = hugoize(doc)

      callback(null, doc)
    } catch (e) {
      callback(e, null)
    }
  },
})

function exportIndex(index, file: string, c: Console, done: (err?) => void) {
  index.dbReadStream({ gzip: true })
    .pipe(JSONStream.stringify(false))
    .pipe(zlib.createGzip())
    .pipe(fs.createWriteStream(file))
    .on('close', () => {
      fs.stat(file, (statErr, filestats) => {
        if (statErr) {
          done(statErr)
          return
        }
        if (filestats.size < 50) {
          done(`Error writing out the search index!  The resulting filesize is ${filestats.size} bytes!`)
          return
        }

        if (c) {
          c.log(chalk.gray(`wrote out public/search_index.gz with file size ${(filestats.size / 1024).toFixed(1)} KB.`))

          if (filestats.size > 4 * 1024 * 1024) {
            c.log(chalk.red(`gzipped search index is ${(filestats.size / 1024 / 1024).toFixed(1)} MB! This is a lot to download.  Find a way to reduce the size or improve caching.`))
            return
          } else if (filestats.size > 1 * 1024 * 1024) {
            c.log(chalk.yellow(`gzipped search index is ${(filestats.size / 1024).toFixed(1)} KB!  ` +
                "That's starting to get big."))
          }
        }

        done()
      })
    })
}

module.exports = (gulp, c?: Console) => {
  const exportFile = './public/search_index.gz'

  gulp.task('test-hugoize', () => {
    const log = (c || console).log
    return gulp.src('./content/**/*.md')
        .pipe(buildDocument())
        .pipe(new Transform({
          objectMode: true,

          transform(obj: any, encoding, callback) {
            log((obj as IHugoDoc).id)
            callback(undefined, obj)
          },
        }))
  })

  gulp.task('build-search-index', (done) => {
    const options = {
    }
    const searchIndex = require('search-index')
    searchIndex(options, (openDatabaseError, index) => {
      if (openDatabaseError) {
        done(openDatabaseError)
        return
      }

      fs.mkdir('./public', (mdErr) => {
        if (mdErr && mdErr.code !== 'EEXIST') {
          done(mdErr)
          return
        }

        gulp.src('./content/**/*.md')
        .pipe(buildDocument())
        .pipe(index.defaultPipeline())
        .pipe(index.add())
        .on('finish', (pipeErr) => {
          if (pipeErr) {
            done(pipeErr)
            return
          }

          index.countDocs((countErr, count) => {
            if (countErr) {
              done(countErr)
              return
            }
            if (count === 0) {
              done('No documents loaded in search index!')
              return
            }

            if (c) { c.log(chalk.gray(`loaded ${count} documents in search index.  Exporting to ${exportFile}`)) }
            exportIndex(index, exportFile, c, (exportErr) => {
              if (exportErr) { done(exportErr); return }

              if (c) { c.log(chalk.gray('closing temporary search index...')) }
              index.close((closeErr) => {
                if (closeErr) {
                  done(closeErr)
                  return
                }

                if (c) { c.log(chalk.gray('removing temporary search index files...')) }
                fs.remove('si', (rmErr) => {
                  done(rmErr)
                })
              })
            })
          }, 500)
        })
      })
    })
  })
}
