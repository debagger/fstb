import { join, basename } from 'path';
import { homedir, tmpdir } from 'os';
import { FSDir } from './fs-dir.class';
import { FSFile } from './fs-file.class';

class FSDirent {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);

  /**
   * Use to work with current path as file system directory
   */
  public asDir() {
    return new FSDir(this.path);
  }

  /**
   * Use to work with current path as file system file
   */
  public asFile() {
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
 * Example:
 * FSPath(__dirname).node_modules //work as path.join(__dirname, "node_modules")
 * FSPath(__dirname)["package.json"] //work as path.join(__dirname, "package.json")
 *
 * When path completed you can get further operation to call it as function.
 * Example:
 * FSPath(__dirname).node_modules.asDir()
 * FSPath(__dirname)["package.json"].asFile()
 * At this point you can use FSDir
 * @param {string} path - start path
 */
export const FSPath = function(path: string): FSPathType {
  return new Proxy(() => new FSDirent(path), {
    get: (_, key: string) => FSPath(join(path, key)),
  }) as FSPathType;
};

export const cwd = FSPath(process.cwd());
export const dirname = FSPath(__dirname);
export const home = FSPath(homedir());
export const tmp = FSPath(tmpdir());
