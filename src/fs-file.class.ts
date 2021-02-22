import { stat, Stats, access, constants, readFile, writeFile, unlink } from 'fs';
import { basename } from 'path';

/**
 * Contains all methods to work with files.
 */
export class FSFile {
  constructor(public readonly path: string) {}

  /**
   * Contains file name.
   */
  public readonly name = basename(this.path);

  /**
   * Contains all methods for file read.
   */
  public read = {
    /**
     * Returns all file content as string. On error trows throws
     * NodeJS.ErrnoException
     */
    txt: async () => {
      return new Promise<string>((resolve, reject) => {
        readFile(this.path, (err, data) => {
          if (err) return reject(err);
          resolve(data.toString());
        });
      });
    },
    /**
     * Read file and parses it to json object
     */
    json: async () => {
      return JSON.parse(await this.read.txt());
    },
  };

  /**
   * Contains all methods for writing file
   */
  public write = {
    /**
     * Writes string to file
     * @param txt - content to write
     */
    txt: async (txt: string) => {
      return new Promise<void>((resolve, reject) => {
        writeFile(this.path, txt, err => {
          if (err) return reject(err);
          resolve();
        });
      });
    },

    /**
     * Serialize onject to JSON and writes it to file
     * @param obj - object to serialize
     */
    json: async (obj: object) => {
      await this.write.txt(JSON.stringify(obj));
    },
  };

  /**
   * Returns file Stats object
   */
  public async stat() {
    return new Promise<Stats>((resolve, reject) => {
      stat(this.path, (err, stat) => {
        if (err) return reject(err);
        resolve(stat);
      });
    });
  }

  /**
   * Checks is file exits. If you need write or read file
   * use isWritable or isReadable to check if it possible.
   */
  public async isExists() {
    return new Promise<boolean>(resolve => {
      access(this.path, constants.F_OK, err => {
        if (err) return resolve(false);
        resolve(true);
      });
    });
  }

  /**
   * Checks possibility to read file.
   */
  public async isReadable() {
    return new Promise<boolean>(resolve => {
      access(this.path, constants.R_OK, err => {
        if (err) return resolve(false);
        resolve(true);
      });
    });
  }

  /**
   * Checks possibility to write into file.
   */
  public async isWritable() {
    return new Promise<boolean>(resolve => {
      access(this.path, constants.W_OK, err => {
        if (err) return resolve(false);
        resolve(true);
      });
    });
  }

  /**
   * Asynchronously removes a file. 
   */
  public async unlink() {
    return new Promise<void>((resolve, reject) => {
      unlink(this.path, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
