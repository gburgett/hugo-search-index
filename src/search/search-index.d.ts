
declare type SearchIndexLib = (givenOptions: search_index.Options, moduleReady: (err: Error, searchIndex: search_index.Index) => void) => void

/** 
 * Opens or creates a search index wrapped around a [levelup db](https://github.com/Level/levelup) instance.
 * The search index uses the levelup db for the underlying key-value store of indexed search data.
 * 
 * Exported to the browser by 'dist/search-index.js'
 * Use with webpack using the webpack.ProvidePlugin:
 *   SearchIndex: 'search-index/dist/search-index.min.js',
 * 
 * https://github.com/fergiemcdowall/search-index/blob/4febe838f0291f9a71b0b2db1f063b23ce341101/docs/browser.md#run-search-index-in-the-browser
 * 
 * @param {search_index.Options} - the options to use when opening the search index
 * @param {function} moduleReady - the callback called when the search index is opened.
 */
declare function SearchIndex(givenOptions: search_index.Options, moduleReady: (err: Error, searchIndex: search_index.Index) => void): void

declare namespace search_index {
    /**
     * Options and settings for creating the index
     * https://github.com/fergiemcdowall/search-index/blob/master/docs/API.md#options-and-settings-1
     */
    class Options {
        /** 
         * Specifies how many documents to process, before merging them into the index. When the end of the stream is reached all remaning documents will be merged, even if batchsize is not reached. 
         */
        batchsize?: number

        /** A LevelUp instance */
        indexes?: any
        
        /** Contains field specific overrides to global settings */
        fieldOptions?: any

        /** A bunyan log level. */
        logLevel?: string

        /** Specifies how to split strings into phrases. See https://www.npmjs.com/package/term-vector for examples */
        nGramLength?: number | Array<number> | { gte: number, lte: number }

        /** Specifies how to split strings into phrases. See https://www.npmjs.com/package/term-vector for examples */
        separator?: string

        /** An array of stopwords */
        stopwords?: Array<string>
    }

    class Index {

        /**
         * Returns a readable stream of all fields that can be searched in.
         * https://github.com/fergiemcdowall/search-index/blob/master/docs/API.md#availablefields
         */
        availableFields(): ReadableStream2

        /**
         * Return a readable stream of user defined aggregations, can be used to generate categories by price, age, etc.
         * https://github.com/fergiemcdowall/search-index/blob/master/docs/API.md#buckets
         */
        buckets(): ReadableStream2

        /**
         * Collate documents under all possible values of the given field name, and return a readable stream
         * 
         * @param options query plus category 
         * 
         * https://github.com/fergiemcdowall/search-index/blob/master/docs/API.md#categorize
         */
        categorize(options: { query: Query, category: Category }): ReadableStream2

        /**
         * Returns the total amount of docs in the index
         */
        countDocs(callback: (err: Error, count: number) => void)

        /**
         * Gets a document from the corpus
         * 
         * @param docIDs an array of document IDs
         */
        get(docIDs: Array<any>): ReadableStream2

        /**
         * Use match to create autosuggest and autocomplete functionality. [See also here](https://github.com/fergiemcdowall/search-index/blob/master/docs/autosuggest.md)
         * 
         * @param options 
         */
        match(options: MatchOptions): ReadableStream2

        /**
         * Searches in the index. [See also here](https://github.com/fergiemcdowall/search-index/blob/master/docs/search.md)
         * 
         * (shhhh! search index will also accept "lazy" queries): `q = 'reagan`
         * @param q the query object 
         */
        search(q: string | { query: Query }): ReadableStream2

        /**
         * Returns a count of the documents for the given query including those hidden by pagination
         * @param q the query object
         * @param callback 
         */
        totalHits(q: string | { query: Query }, callback: (err: Error, count: Number) => void): void

        /**
         * Returns a writeable stream that can be used to index documents into the search index.
         * Note that this stream cannot be used concurrently. If documents are being sent on top of one another then it is safer to use concurrentAdd, however add is faster and uses less resources.
         * 
         * @param batchOptions
         */
        add(batchOptions?: IndexingOptions): WritableStream

        concurrentAdd(batchOptions?: IndexingOptions): WritableStream

        /**
         * Prepares a "standard document" (an object where keys become field names, and values become corresponding field values) for indexing. Customised pipeline stages can be inserted before and after processing if required.
         */
        defaultPipeline(batchOptions?: IndexingOptions): WritableStream

        /**
         * Deletes one or more documents from the corpus
         * 
         * @param docIDs 
         * @param callback 
         */
        del(docIDs: Array<any>, callback: (err: Error) => void): void

        /**
         * Empties the index. Deletes everything.
         * 
         * @param callback 
         */
        flush(callback: (err: Error) => void): void

        /**
         * Use dbReadStream() to create a stream of the underlying key-value store. This can be used to pipe indexes around. You can for example replicate indexes to file, or to other (empty) indexes
         * @param options gzip If set to true, the readstream will be compressed into the gzip format
         */
        dbReadStream(options?: { gzip: boolean }): ReadableStream2

        /**
         * Use dbWriteStream() to read in an index created by DBReadStream().
         * @param options merge If set to true, the writestream will merge this index with the existing one, if set to false the existing index must be empty
         */
        dbWriteStream(options?: { merge: boolean }): WritableStream



        /**
         * Closes the index and the underlying levelup db.
         */
        close(callback: (err: Error) => void): void
    }

    /**
     * an object that describes a search query.
     */
    type Query = QueryObject | Array<QueryObject>

    class QueryObject {
        /**  */
        AND?: any
        NOT?: any

        /** A positive or negative number summed into the final hit score */
        BOOST?: number
    }

    /**
     * Argument to Categorize
     * https://github.com/fergiemcdowall/search-index/blob/master/docs/API.md#categorize
     */
    class Category {
        /** Name of the field to categorize on */
        field?: string
        /** if true- return a set of IDs. If false or not set, return a count */
        set?: boolean
    }

    class MatchOptions {
        /** default:'' return all words that begin with this string */
        beginsWith?: string
        /** default:'*' perform matches on data found in this field */
        field?: string
        /** default:3 only preform matches once beginsWith is longer than this number */
        threshold?: number
        /** default:10 maximum amount of matches to return */
        limit?: number
        /** default:'simple' the type of matcher to use, can only be 'simple' for the time being. */
        type?: string
    }

    class IndexingOptions {
        /** default:true : can searches be carried out on this specific field */
        fieldedSearch?: boolean
        /** default:1 : length of word sequences to be indexed. Use this to capture phrases of more than one word. */
        nGramLength?: number
        /** default:true : preserve the case of the text */
        preserveCase?: boolean
        /** default:true : is this field searchable? */
        searchable?: boolean
        /** A regex in the String.split() format that will be used to tokenize this field */
        separator?: RegExp
        /** default:false : can this field be sorted on? If true field is not searchable */
        sortable?: boolean
        /** default: require('stopword').en An array of stop words. */
        stopwords?: Array<string>
        /** specifies which fields to store in index. You may want to index fields that are not shown in results, for example when dealing with synonyms */
        storeable?: Array<string>
        /** default:0 this number will be added to the score for the field allowing some fields to count more or less than others. */
        wieght?: number
    }

    class SearchResult {
        id: any
        score: number
        scoringCriteria: any
        document: any
    }

}


// ---------------------------------
// Streams included via browserify by search-index
declare class EventEmitter {
    addListener(event: string, listener: Function);
    on(event: string, listener: Function);
    once(event: string, listener: Function): void;
    removeListener(event: string, listener: Function): void;
    removeAllListeners(event: string): void;
    setMaxListeners(n: number): void;
    listeners(event: string): { Function; }[];
    emit(event: string, ...args: any[]): void;
}

declare class ReadableStream2 extends EventEmitter {
    readable: boolean;
    setEncoding(encoding: string): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    pipe(destination: WritableStream, options?: { end?: boolean; }): void;
}


declare class WritableStream extends EventEmitter {
    writable: boolean;
    write(str: string, encoding?: string, fd?: string): boolean;
    write(buffer: NodeBuffer): boolean;
    end(): void;
    end(str: any, enconding?: string, callback?: () => void): void;
    destroy(): void;
    destroySoon(): void;
}

// ------------------------------------
