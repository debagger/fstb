import { opendir, stat } from 'fs/promises';
// import { Dirent } from 'fs';
import { join, basename } from 'path';

class FSFile {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);

  public async getStat() {
    return await stat(this.path);
  }
}

class FSDir {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);
  public async mapDirs<T>(cb: (file: FSDir) => T) {
    return new Promise((resolve, reject) => {
      opendir(this.path).then(dir => {
        const res = [] as T[];
        const next = () =>
          dir
            .read()
            .then(dirent => {
              if (dirent) {
                console.log(`Dirent name=${dirent.name}, isFile()=${dirent.isFile()}`);
                if (dirent.isDirectory()) {
                  res.push(cb(new FSDir(join(this.path, dirent.name))));
                }
                next();
              } else {
                resolve(res);
              }
            })
            .catch(reject);
        next();
      });
    });
  }

  public mapFiles<T>(cb: (file: FSFile) => T) {
    return new Promise((resolve, reject) => {
      opendir(this.path).then(dir => {
        const res = [] as T[];
        const next = () =>
          dir
            .read()
            .then(dirent => {
              if (dirent) {
                console.log(`Dirent name=${dirent.name}, isFile()=${dirent.isFile()}`);
                if (dirent.isFile()) {
                  res.push(cb(new FSFile(join(this.path, dirent.name))));
                }
                next();
              } else {
                resolve(res);
              }
            })
            .catch(reject);
        next();
      });
    });
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
