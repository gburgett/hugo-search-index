import * as pako from 'pako'
import {Readable} from 'stream'

/**
 * Converts an array buffer to a string
 *
 * @param {Uin8} uint8arr | The buffer to convert
 * @param {Function} callback | The function to call when conversion is complete
 */
function largeuint8ArrToString(uint8arr, callback) {
    const bb = new Blob([uint8arr])
    const f = new FileReader()
    f.onload = (e) => {
        callback((e.target as any).result)
    }

    f.readAsText(bb)
}

function inflate(contents: Uint8Array, cb: (err: Error, inflated?: string) => void) {
    try {
      const inflated = pako.inflate(contents, { to: 'string' })
      cb(null, inflated)
    } catch (err) {
      if (err !== 'incorrect header check') {
        cb(err)
        return
      }

      // the browser already inflated this for us.
      // This happens if the server supports gzip encoding,
      // and sets the 'Content-Encoding: "gzip"' header.
      largeuint8ArrToString(contents, (result) => {
        cb(null, result)
      })
    }
}

export class SearchIndexLoader {

  private lib
  private options

  constructor(lib?: SearchIndexLib, options?: search_index.Options) {
    this.lib = lib || SearchIndex
    this.options = options || {}
  }

  public load(contents: Uint8Array, cb: (err: Error, index?: search_index.Index) => void) {

    inflate(contents, (inflateErr, inflated) => {
      if (inflateErr) {
        cb(inflateErr)
        return
      }

      const options = this.options
      this.lib(this.options, (libErr, si) => {
        if (libErr) {
          cb(libErr)
          return
        }

        let i = 0
        let lines = 0
        const docStream = new Readable({
          objectMode: true,

          read() {
            let chunk: any
            do {
              if (i >= inflated.length) {
                this.push(null)
                return
              }
              let nextNewline = inflated.indexOf('\n', i)
              if (nextNewline <= i) {
                nextNewline = undefined
              }
              const substr = inflated.substring(i, nextNewline)
              chunk = JSON.parse(substr)
              if  (nextNewline) {
                i = nextNewline + 1
              } else {
                i = inflated.length
              }
              lines++
              // console.log(lines + ': ', chunk)
            } while (this.push(chunk))
          },
        })

        docStream
          .pipe(si.dbWriteStream({ merge: false }))
          // tslint:disable-next-line:no-empty // an empty listener lets the pipe keep moving, otherwise it gets stuck
          .on('data', () => {})
          .on('finish', () => {
            cb(null, si)
          })
          .on('error', (error) => {
            cb(error)
          })
      })

    })
  }
}
export default SearchIndexLoader
