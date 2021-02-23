import { readFile, createReadStream } from 'fs';
import { createInterface } from 'readline';
import { FSAsyncIterable } from './asyncIterable.class';
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
  public lineByLine(): FSAsyncIterable<string> {
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

  public csvArrays(splitter: string): FSAsyncIterable<string[]> {
    return this.lineByLine().map(async line => line.split(splitter));
  }

  public csvWithHeader(splitter: string): FSAsyncIterable<Record<string, string>> {
    const iter = this.csvArrays(splitter)[Symbol.asyncIterator]();
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
