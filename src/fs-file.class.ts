import { stat, Stats, access, constants, unlink, copyFile } from 'fs';
import { basename, dirname } from 'path';
import { FSFileWrite } from './fs-file.write.class';
import { FSFileRead } from './fs-file.read.class';
import { FSDir } from './fs-dir.class';
import { FSFileHash } from './fs-file.hash.class';

/**
 * Options that specifies the behavior of the copyTo operation
 */
export type copyToOptions = {
  /**
   * If true, then the copy operation will fail if dest already exists.
   * COPYFILE_FICLONE_FORCE: The copy operation will attempt to create a
   * copy-on-write reflink. If the platform does not support copy-on-write, then the operation will fail.
   */
  COPYFILE_EXCL?: boolean;
  /**
   * If true then the copy operation will attempt to create a copy-on-write reflink.
   * If the platform does not support copy-on-write, then a fallback copy mechanism is used.
   */
  COPYFILE_FICLONE?: boolean;
  /**
   * If true then the copy operation will attempt to create a copy-on-write reflink.
   * If the platform does not support copy-on-write, then a fallback copy mechanism is used.
   */
  COPYFILE_FICLONE_FORCE?: boolean;
};

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
   * Returns directory wich contains this file
   * @type {FSDir}
   */
  public readonly fsdir: FSDir = new FSDir(dirname(this.path));

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
   *
   */
  public hash: FSFileHash = new FSFileHash(this.path);

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

  /**
   * Copy file. If dest is FSDir, copy file in it with source name.
   * @param {string | FSDir | FSFile} dest
   * @param {copyToOptions} options is an optional parameter that specifies the behavior of the copy operation.
   * COPYFILE_EXCL: The copy operation will fail if dest already exists.
   * COPYFILE_FICLONE: The copy operation will attempt to create a copy-on-write reflink.
   * If the platform does not support copy-on-write, then a fallback copy mechanism is used.
   * COPYFILE_FICLONE_FORCE: The copy operation will attempt to create a
   * copy-on-write reflink. If the platform does not support copy-on-write, then the operation will fail.
   * @returns {Promise<FSFile>} return FSFile of destination file
   */
  public async copyTo(dest: string | FSDir | FSFile, options: copyToOptions = {}): Promise<FSFile> {
    let destPath: string;
    if (typeof dest === 'string') {
      destPath = dest;
    } else if (dest instanceof FSDir) {
      destPath = dest.fspath[this.name]().path;
    } else if (dest instanceof FSFile) {
      destPath = dest.path;
    } else {
      throw Error("Wrong 'dest' argument. Must be string or FSDir or FSFile.");
    }
    const flags =
      (options.COPYFILE_EXCL ? constants.COPYFILE_EXCL : 0) |
      (options.COPYFILE_FICLONE ? constants.COPYFILE_FICLONE : 0) |
      (options.COPYFILE_FICLONE_FORCE ? constants.COPYFILE_FICLONE_FORCE : 0);

    return new Promise<FSFile>((resolve, reject) => {
      copyFile(this.path, destPath, flags, err => {
        if (err) return reject(err);
        if (dest instanceof FSFile) {
          resolve(dest);
        } else {
          resolve(new FSFile(destPath));
        }
      });
    });
  }
}
