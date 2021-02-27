import { Dirent, readdir, rmdir, mkdir, access, constants } from 'fs';
import { basename, join } from 'path';
import { FSFile } from './fs-file.class';
import { FSAsyncIterable } from './fs-async-iterable.class';
import { FSPath, FSPathType } from '.';

const readDirPromise = (path: string) =>
  new Promise<Dirent[]>((resolve, reject) => {
    readdir(path, { withFileTypes: true }, (err, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });

async function* direntsGen(path: string) {
  const dirents = await readDirPromise(path);
  for (const dirent of dirents) {
    yield dirent;
  }
}
/**
 * Contains all methods for work with directories
 *
 */
export class FSDir {
  /**
   *
   * @param {string} path - valid filesystem path string
   */
  constructor(public readonly path: string) {}

  /**
   * Directory name
   */
  public readonly name: string = basename(this.path);

  /**
   * Return FSPath function for current path. Can be used to countinue joining
   * path segments to subdirs or files.
   */
  public readonly fspath: FSPathType = FSPath(this.path);

  /**
   * Return async iterator which iterates all dirents in dir.
   * Chaining map, filter and forEach
   * operators available. toArray operator can be used for resulting chain to array.
   * @returns {FSAsyncIterable<Dirent>}
   */
  public dirents() {
    return new FSAsyncIterable(direntsGen(this.path));
  }

  /**
   * Return async iterator which iterates all files in dir. Chaining map, filter and forEach
   * operators available. toArray operator can be used for resulting chain to array.
   * @returns {FSAsyncIterable}
   */
  public files() {
    return this.dirents()
      .filter(async dirent => dirent.isFile())
      .map(async dirent => new FSFile(join(this.path, dirent.name)));
  }

  private async *recursiveDirsGen() {
    for await (const dir of this.subdirs()) {
      yield dir;
      yield* dir.subdirs(true);
    }
  }
  /**
   * Return async iterator wich iterates each subdirs. Chaining map, filter and forEach
   * operators available. toArray operator can be used for resulting chain to array.
   * @param recursive - if true returns each subdir of any deep
   * @returns {FSAsyncIterable}
   * @example <caption>Extratct all module names and versions from code>node_modules</caption>
   * const { cwd } = require('fstb');
   * cwd
   *  .node_modules()
   *  .asDir()
   *  .subdirs(true)
   *  .map(async dir => dir.fspath['package.json']().asFile())
   *  .filter(async package_json => await package_json.isReadable())
   *  .map(async package_json => await package_json.read.json())
   *  .forEach(async content => console.log(`${content.name}@${content.version}`));
   */
  public subdirs(recursive: boolean = false): FSAsyncIterable<FSDir> {
    if (recursive) {
      return new FSAsyncIterable(this.recursiveDirsGen());
    } else {
      return this.dirents()
        .filter(async dirent => dirent.isDirectory())
        .map(async dirent => new FSDir(join(this.path, dirent.name)));
    }
  }
  /**
   * delete a directory
   */
  public async rmdir() {
    return new Promise<void>((resolve, reject) => {
      rmdir(this.path, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Asynchronously creates a directory.
   * @param recursive - if recursive is true, the first directory path created
   */
  public async mkdir(recursive: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      mkdir(this.path, { recursive }, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Checks is dir exits
   * @returns {Promise<boolean>}
   */
  public async isExists(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      access(this.path, constants.F_OK, err => {
        if (err) return resolve(false);
        resolve(true);
      });
    });
  }

  /**
   * Compute total size of this directory.
   * @example <caption>Total size of node_modules</caption>
   *   console.log(
   * 'Total size of node_modules is ' +
   *   Math.floor(
   *     (await cwd
   *       .node_modules()
   *       .asDir()
   *       .totalSize()) /
   *       1024 /
   *       1024
   *   ) +
   *   ' MBytes'
   * );
   */
  public async totalSize(): Promise<number> {
    let size = 0;
    await this.files()
      .map(async file => (await file.stat()).size)
      .forEach(async fileSize => {
        size += fileSize;
      });

    await this.subdirs()
      .map(async dir => await dir.totalSize())
      .forEach(async totalSize => {
        size += totalSize;
      });

    return size;
  }

  /**
   * Removes directory with all content
   */
  public async rimraf() {
    if (await this.isExists()) {
      await this.files().forEach(async file => {
        await file.unlink();
      });
      await this.subdirs().forEach(async dir => {
        await dir.rimraf();
      });
      await this.rmdir();
    }
  }
}
