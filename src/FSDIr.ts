import { Dirent, readdir } from 'fs';
import { basename, join } from 'path';
import { FSFile } from './FSSile';

export class FSDir {
  constructor(public readonly path: string) {}

  public readonly name = basename(this.path);

  public async reduce<T>(cb: (previousValue: T, dirent: Dirent) => T | Promise<T>, initialValue: T) {
    return new Promise<T>((resolve, reject) => {
      readdir(this.path, { withFileTypes: true }, (err, dirents) => {
        if (err) return reject(err);
        const it = dirents[Symbol.iterator]();
        const next = (previousValue: T) => {
          const dirent = it.next();
          if (dirent.done) return resolve(previousValue);
          const cbResult = cb(previousValue, dirent.value);
          if (cbResult instanceof Promise) {
            cbResult.then(cbResult => next(cbResult)).catch(reject);
          } else {
            next(cbResult);
          }
        };
        next(initialValue);
      });
    });
  }

  public mapDirs<T>(cb: (dir: FSDir) => T) {
    return this.reduce((prev, dirent) => {
      if (!dirent.isDirectory()) return prev;
      const subDir = new FSDir(join(this.path, dirent.name));
      const cbResult = cb(subDir);
      prev.push(cbResult);
      return prev;
    }, [] as T[]);
  }

  public mapFiles<T>(cb: (file: FSFile) => T) {
    return this.reduce((prev, dirent) => {
      if (!dirent.isFile()) return prev;
      const subDir = new FSFile(join(this.path, dirent.name));
      const cbResult = cb(subDir);
      prev.push(cbResult);
      return prev;
    }, [] as T[]);
  }
}
