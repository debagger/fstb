import { opendir, stat } from 'fs';
import { Dirent } from 'fs';
// import { Dirent } from 'fs';
import { join, basename } from 'path';

class FSFile {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);

  public async getStat() {
    return new Promise((resolve, reject) => {
      stat(this.path, (err, stat) => {
        if (err) return reject(err);
        resolve(stat);
      });
    });
  }
}

class FSDir {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);
  public async reduce<T>(cb: (previousValue: T, dirent: Dirent) => T | Promise<T>, initialValue: T) {
    return new Promise<T>((resolve, reject) => {
      opendir(this.path, (err, dir) => {
        if (err) return reject(err);
        const next = (previousValue: T) => {
          dir
            .read()
            .then(dirent => {
              if (dirent == null) return resolve(previousValue);
              const cbResult = cb(previousValue, dirent);
              if (cbResult instanceof Promise) {
                cbResult.then(cbResult => next(cbResult)).catch(reject);
              } else {
                next(cbResult);
              }
            })
            .catch(reject);
        };
        next(initialValue);
      });
    });
  }
  public mapDirs<T>(cb: (file: FSDir) => T) {
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

class FSDirent {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);
  public asDir() {
    return new FSDir(this.path);
  }

  public asFile() {
    return new FSFile(this.path);
  }
}

type FSPathType = {
  (): FSDirent;
  [key: string]: FSPathType;
};

export const FSPath = function(path: string): FSPathType {
  return new Proxy(() => new FSDirent(path), {
    get: (_, key: string) => FSPath(join(path, key)),
  }) as FSPathType;
};
