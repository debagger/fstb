import { readFile, createReadStream } from 'fs';
import { createInterface } from 'readline';
import { FSAsyncIterable } from './fs-async-iterable.class';
import { FSIterable } from './fs-iterable.class';
/**
 * Contains methods, that reads from file
 */
export class FSFileRead {
  constructor(public readonly path: string) {}

  /**
   * Returns all file content as string. On error trows throws
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
   * @returns {FSAsyncIterable<string>}
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
   */
  public csvArrays(splitter: string): FSIterable<string[]> {
    return this.lineByLine().map(line => line.split(splitter));
  }

  /**
   * Read csv as objects. Take first line as object keys
   * @param splitter
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

  public csvArraysAsync(splitter: string): FSAsyncIterable<string[]> {
    return this.lineByLineAsync().map(async line => line.split(splitter));
  }

  public csvWithHeaderAsync(splitter: string): FSAsyncIterable<Record<string, string>> {
    const iter = this.csvArraysAsync(splitter)[Symbol.asyncIterator]();
    const reader = async function*() {
      const firstlineres = await iter.next();
      if (!firstlineres.done) {
        const firstline = firstlineres.value;
        for await (const line of iter) {
          yield firstline.reduce((obj, key, index) => {
            obj[key] = line[index];
            return obj;
          }, {} as Record<string, string>);
        }
      }
    };
    return new FSAsyncIterable(reader());
  }
}
