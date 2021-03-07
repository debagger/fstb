import { join, basename, sep } from 'path';
import { mkdtemp as fsmkdtemp } from 'fs';
import { homedir, tmpdir } from 'os';
import { FSDir } from './fs-dir.class';
import { FSFile } from './fs-file.class';
import { FSAsyncIterable } from './fs-async-iterable.class';

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
 * WARNING: Do not return FSPath with Promise resolve. This leads to unexpected behavior.
 * @return {FSDirent}
 *
 * @example
 * FSPath(__dirname).node_modules //work as path.join(__dirname, "node_modules")
 * FSPath(__dirname)["package.json"] //work as path.join(__dirname, "package.json")
 * // When path completed you can get further operation to call it as function.
 * FSPath(__dirname).node_modules().asDir() //At this point you can use FSDir
 * FSPath(__dirname)["package.json"]().asFile() //At this point you can use FSFile
 *
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
 * Creates a unique temporary directory inside os tmpdir.
 * Generates six random characters to be appended behind a required prefix to create a unique temporary directory.
 * Due to platform inconsistencies, avoid trailing X characters in prefix.
 * Some platforms, notably the BSDs, can return more than six random characters,
 * and replace trailing X characters in prefix with random characters.
 * The created directory path is passed as a string to the callback's second parameter.
 * @param prefix
 */
export const mkdtemp = async (prefix?: string) => {
  const temppath = await new Promise<FSDir>((resolve, reject) => {
    fsmkdtemp(prefix ? join(tmpdir(), prefix) : `${tmpdir()}${sep}`, (err, path) => {
      if (err) return reject(err);
      const dir = FSPath(path)().asDir();
      resolve(dir);
    });
  });
  return temppath;
};

/**
 * Returns FSPath for environment variable.
 * If environment variable whith given name not exists,
 * Then return FSPath for provided fallback value,
 * if no fallback value provided then returns nothing
 * @param {string} envVariableName
 * @param {string} fallbackValue
 */
export const envPath = (envVariableName: string, fallbackValue?: string): FSPathType => {
  let envVar = process.env[envVariableName];
  if (envVar) return FSPath(envVar);
  if (fallbackValue) return FSPath(fallbackValue);
  throw Error(`Not found process.env[${envVariableName}] and fallback value didnt provided.`);
};

export const range = (from: number, to: number) => {
  const rangeGenerator = async function*() {
    for (let index = from; index <= to; index++) {
      yield index;
    }
  };
  return new FSAsyncIterable(rangeGenerator());
};
