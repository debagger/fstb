import { readFile } from 'fs';
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
  async txt(): Promise<string> {
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
  async json(): Promise<any> {
    return JSON.parse(await this.txt());
  }
}
