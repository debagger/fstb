import { join, basename } from 'path';
import { mkdtemp as fsmkdtemp } from 'fs';
import { homedir, tmpdir } from 'os';
import { FSDir } from './fs-dir.class';
import { FSFile } from './fs-file.class';

/**
 * Represent dirent which can be converted to FSDir or FSFile.
 */
export class FSDirent {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);

  /**
   * Use to work with current path as file system directory.
   * @return {FSDir}
   */
  public asDir(): FSDir {
    return new FSDir(this.path);
  }

  /**
   * Use to work with current path as file system file
   * @return {FSFile}
   */
  public asFile(): FSFile {
    return new FSFile(this.path);
  }
}

export type FSPathType = {
  (): FSDirent;
  [key: string]: FSPathType;
};

/**
 * Creates path to filesystem object. Can be chained with any
 * key name wich act as path segment.
 * @return {FSDirent}
 *
 * @example
 * FSPath(__dirname).node_modules //work as path.join(__dirname, "node_modules")
 * FSPath(__dirname)["package.json"] //work as path.join(__dirname, "package.json")
 * // When path completed you can get further operation to call it as function.
 * FSPath(__dirname).node_modules().asDir()
 * FSPath(__dirname)["package.json"]().asFile()
 * //At this point you can use FSDir
 * @param {string} path - start path
 */
export const FSPath = function(path: string): FSPathType {
  return new Proxy(() => new FSDirent(path), {
    get: (_, key: string) => FSPath(join(path, key)),
  }) as FSPathType;
};

/**
 * Shortcut for FSPath(process.cwd())
 */
export const cwd = FSPath(process.cwd());

/**
 * Shortcut for FSPath(__dirname)
 */
export const dirname = FSPath(__dirname);

/**
 * Shortcut for FSPath(homedir())
 */
export const home = FSPath(homedir());

/**
 * Shortcut for FSPath(tmpdir())
 */
export const tmp = FSPath(tmpdir());

/**
 * Creates a unique temporary directory.
 * Generates six random characters to be appended behind a required prefix to create a unique temporary directory. 
 * Due to platform inconsistencies, avoid trailing X characters in prefix. 
 * Some platforms, notably the BSDs, can return more than six random characters, 
 * and replace trailing X characters in prefix with random characters.
 * The created directory path is passed as a string to the callback's second parameter.
 * @param prefix 
 */
export const mkdtemp = async (prefix: string) =>
  new Promise<FSPathType>((resolve, reject) => {
    fsmkdtemp(prefix, (err, path) => {
      if (err) return reject(err);
      resolve(FSPath(path));
    });
  });