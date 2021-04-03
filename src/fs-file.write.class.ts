import { writeFile, createWriteStream, appendFile, WriteFileOptions, WriteStream, ReadStream } from 'fs';
/**
 * Contains methods that write to file
 */
export interface PromiseLikeWriteStream extends WriteStream, PromiseLike<void> {}

export class FSFileWrite {
  constructor(public readonly path: string) {}

  /**
   * Writes string to file
   * @param txt - content to write
   */
  async txt(txt: string) {
    return new Promise<void>((resolve, reject) => {
      writeFile(this.path, txt, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Serialize onject to JSON and writes it to file
   * @param obj - object to serialize
   */
  async json(obj: object) {
    await this.txt(JSON.stringify(obj));
  }

  /**
   * Creates fs WriteStream for this path.
   * @param options - node fs.createWriteStream options
   * @returns thenable stream, which resolves on stream close
   */
  createWriteStream(options?: SecondArgument<typeof createWriteStream>) {
    const stream = createWriteStream(this.path, options) as PromiseLikeWriteStream;
    const promise = new Promise<void>((resolve, reject) => {
      stream.on('close', () => {
        resolve();
      });
      stream.on('error', err => reject(err));
    });
    stream.then = promise.then.bind(promise);
    return stream;
  }

  /**
   * Asynchronously append data to a file, creating the file if it does not yet exist.
   * @param data - string or Buffer to append
   * @param options
   */
  async appendFile(data: string | Buffer, options?: WriteFileOptions) {
    return new Promise<void>((resolve, reject) => {
      const cb = (err: Error | null) => {
        if (err) return reject(err);
        resolve();
      };
      if (options) {
        appendFile(this.path, data, options, cb);
      } else {
        appendFile(this.path, data, cb);
      }
    });
  }

  /**
   * Writes stream to file.
   * @param stream - input stream
   */

  async writeFromStream(stream: ReadStream){
    const target = this.createWriteStream();
    stream.pipe(target);
    await target
  }
}

type SecondArgument<T> = T extends (arg1: any, arg2: infer U, ...args: any[]) => any ? U : any;
