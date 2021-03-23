import { readFile, createReadStream, ReadStream } from 'fs';
import { createInterface } from 'readline';
import { FSAsyncIterable } from './fs-async-iterable.class';
import { FSIterable } from './fs-iterable.class';
/**
 * Contains methods, that reads from file
 */
export class FSFileRead {
  constructor(public readonly path: string) {}

  /**
   * Returns all file content as string. On error trows
   * NodeJS.ErrnoException
   * @returns {Promise<string>}
   */
  public async txt(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      readFile(this.path, (err, data) => {
        if (err) return reject(err);
        resolve(data.toString());
      });
    });
  }

  /**
   * Read file and parses it to json object
   * @returns {Promise<any>}
   */
  public async json(): Promise<any> {
    return JSON.parse(await this.txt());
  }

  /**
   * Read text files line by line
   * @returns {FSIterable<string>}
   */
  public lineByLine(): FSIterable<string> {
    const fileStream = createReadStream(this.path);
    const readLine = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    const iterable = new FSIterable<string>();

    readLine.on('line', line => {
      iterable.push(line);
    });
    readLine.on('close', () => {
      iterable.end();
    });
    return iterable;
  }
  /**
   * Read csv as array of arrays
   * @param splitter
   * @returns {FSIterable<string[]>}
   */
  public csvArrays(splitter: string): FSIterable<string[]> {
    return this.lineByLine().map(line => line.split(splitter));
  }

  /**
   * Read csv as objects. Take first line as object keys
   * @param splitter
   * @returns {FSIterable<Record<string,string>>}
   */
  public csvWithHeader(splitter: string): FSIterable<Record<string, string>> {
    const iter = this.csvArrays(splitter);
    let header: string[];
    return iter
      .filter(item => {
        if (header) return true;
        header = item;
        return false;
      })
      .map(line =>
        header.reduce((obj, key, index) => {
          obj[key] = line[index];
          return obj;
        }, {} as Record<string, string>)
      );
  }
  /**
   * Read text file line-by-line with async iterator
   */
  public lineByLineAsync(): FSAsyncIterable<string> {
    const fileStream = createReadStream(this.path);
    const readLine = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    const reader = async function*() {
      for await (const line of readLine) {
        yield line;
      }
      fileStream.close();
    };
    return new FSAsyncIterable(reader());
  }

  /**
   * Read csv file as splitted strings array line-by-line with async iterator.
   * @param splitter - text symbol which used as delimeter
   * @returns {FSAsyncIterable<string[]>}
   */
  public csvArraysAsync(splitter: string): FSAsyncIterable<string[]> {
    return this.lineByLineAsync().map(async line => line.split(splitter));
  }

  /**
   * Read csv files and converts it to objects with keys from first line of file
   * @param splitter - text symbol which used as delimeter
   * @returns {FSAsyncIterable<Record<string, string>>}
   */
  public csvWithHeaderAsync(splitter: string): FSAsyncIterable<Record<string, string>> {
    const iter = this.csvArraysAsync(splitter)[Symbol.asyncIterator]();
    const reader = async function*() {
      const firstlineres = await iter.next();
      if (!firstlineres.done) {
        const firstline = firstlineres.value;
        for await (const line of iter as any) {
          yield firstline.reduce((obj, key, index) => {
            obj[key] = line[index];
            return obj;
          }, {} as Record<string, string>);
        }
      }
    };
    return new FSAsyncIterable(reader());
  }

  /**
   * Open stream for read from file. Return stream, which can be awaitable while stream closed.
   *
   * @param options - standard Node fs.createReadStream options
   * @returns {PromiseLikeReadStream} - work as standart node ReadStream, but can act as
   * Pomise wich resolves on stream 'close' event
   */
  public createReadStream(options?: SecondArgument<typeof createReadStream>): PromiseLikeReadStream {
    const stream = createReadStream(this.path, options) as PromiseLikeReadStream;
    const promise = new Promise<void>((resolve, reject) => {
      stream.on('close', () => {
        resolve();
      });
      stream.on('error', err => reject(err));
    });
    stream.then = promise.then.bind(promise);
    return stream;
  }
}

type SecondArgument<T> = T extends (arg1: any, arg2: infer U, ...args: any[]) => any ? U : any;
export interface PromiseLikeReadStream extends ReadStream, PromiseLike<void> {}
