import { readFile, createReadStream } from 'fs';
import { createInterface } from 'readline';
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
}
