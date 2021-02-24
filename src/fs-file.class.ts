import { stat, Stats, access, constants, unlink } from 'fs';
import { basename } from 'path';
import { FSFileWrite } from './fs-file.write.class';
import { FSFileRead } from './fs-file.read.class';

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
   * @type {FSFileRead}
   */
  public read: FSFileRead = new FSFileRead(this.path);

  /**
   * Contains all methods for writing file
   * @type {FSFileWrite}
   */
  public write: FSFileWrite = new FSFileWrite(this.path);

  /**
   * Returns file Stats object
   * @
   * @returns {Promise<Stats>}
   */
  public async stat(): Promise<Stats> {
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
