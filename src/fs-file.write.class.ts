import { writeFile, createWriteStream } from 'fs';
/**
 * Contains methods that write to file
 */
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
   * Creates standart node fs WriteStream for this path.
   * @param options - node fs.createWriteStream options
   */
  createWriteStream(options?: SecondArgument<typeof createWriteStream>) {
    return createWriteStream(this.path, options);
  }
}

type SecondArgument<T> = T extends (arg1: any, arg2: infer U, ...args: any[]) => any ? U : any;
